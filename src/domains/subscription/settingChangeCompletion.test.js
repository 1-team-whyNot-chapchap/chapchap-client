import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, reactive, nextTick } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createSettingChangeStore } from './stores/useSettingChangeStore.js'

// 실제 확인 화면·Router·저장소를 메모리에서 실행한다. HTTP·결제는 호출하지 않는다.
const sourceUrl = new URL('./pages/SubscriptionSettingsConfirmPage.vue', import.meta.url)
const { descriptor } = parse(await readFile(sourceUrl, 'utf8'))
let source = compileScript(descriptor, { id: 'completion-test', inlineTemplate: true }).content
source = source.replace(
  /import \{ authSession \} from ['"][^'"]+['"];?/,
  'const authSession = { get state() { return globalThis.__completionTest.authSession.state } };',
)
for (const name of ['Address', 'CurrentSubscription', 'Order', 'Plan', 'SettingChange']) {
  source = source.replace(
    new RegExp(`import \\{ use${name}Store \\} from ['"][^'"]+['"];?`),
    `const use${name}Store = () => globalThis.__completionTest.${name};`,
  )
}
source = source.replace(
  /import (\w+) from ['"][^'"]+\.vue['"];?/g,
  'const $1 = { render() { return null } };',
)
source = source.replace(
  /from (['"])([^'"]+)\1/g,
  (_, quote, path) =>
    `from ${quote}${path.startsWith('.') ? new URL(path, sourceUrl).href : import.meta.resolve(path)}${quote}`,
)
const Confirm = (
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
).default
const element = (type, text = '') => ({ type, text, children: [], props: {}, parent: null })
const renderer = createRenderer({
  createElement: element,
  createText: (text) => element('#text', text),
  createComment: () => element('#comment'),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.text = text
    node.children = []
  },
  patchProp: (node, key, previous, value) => {
    node.props[key] = value
  },
  insert(node, parent, anchor) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
    node.parent = parent
  },
  remove(node) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1],
})
const textOf = (node) => node.text + node.children.map(textOf).join('')
const flatten = (node) => [node, ...node.children.flatMap(flatten)]
async function withPage(
  run,
  result = {
    effectiveStartDate: '2026-09-16',
    differenceType: 'DECREASE',
    differenceAmount: 31600,
    refund: { requestedAmount: 31600, refundedAmount: 31600, unprocessedAmount: 0 },
  },
) {
  const previous = globalThis.__completionTest
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = createSettingChangeStore({}, 'completion-test')()
  store.planId = 'test-plan'
  store.deliveryConditions = [{ weekday: 'WEDNESDAY', mealQuantity: 1 }]
  store.result = result
  const authSession = { state: reactive({ user: { userId: 1 } }) }
  globalThis.__completionTest = {
    authSession,
    SettingChange: store,
    Address: { listStatus: 'idle' },
    Plan: {},
    CurrentSubscription: {},
    Order: {},
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/confirm', name: 'wf-025', component: Confirm },
      { path: '/settings', name: 'wf-024', component: { render: () => h('p', '입력 화면') } },
      {
        path: '/subscription',
        name: 'subscription',
        component: { render: () => h('p', '내 구독') },
      },
    ],
  })
  const root = element('root')
  const app = renderer.createApp({ render: () => h(RouterView) })
  app.use(pinia).use(router)
  await router.push('/confirm')
  app.mount(root)
  await nextTick()
  try {
    await run({ router, store, root, authSession })
  } finally {
    app.unmount()
    globalThis.__completionTest = previous
  }
}

test('완료 문구와 적용일·환불 결과를 실제 컴포넌트에서 표시한다', async () => {
  await withPage(async ({ root }) => {
    const text = textOf(root)
    assert.match(text, /변경이 완료되었어요\./)
    assert.match(text, /2026-09-16/)
    assert.match(text, /환불 요청 31,600원 · 완료 31,600원 · 미처리 0원/)
    assert.doesNotMatch(text, /확인할 변경 내용이 없어요/)
    assert.ok(
      flatten(root).find(
        (node) => node.type === 'button' && textOf(node).includes('내 구독에서 확인하기'),
      ),
    )
  })
})

for (const outcome of ['success', 'cancel', 'error']) {
  test(`이동 ${outcome}: 대기 중 결과를 유지하고 성공한 경우에만 정리한다`, async () => {
    await withPage(async ({ router, store, root }) => {
      let release, reject, entered
      const waiting = new Promise((resolve) => {
        entered = resolve
      })
      router.beforeEach(() => {
        entered()
        return new Promise((yes, no) => {
          release = yes
          reject = no
        })
      })
      router.onError(() => {})
      const navigation = router.push({ name: 'subscription' }).catch((error) => error)
      await waiting
      await nextTick()
      assert.equal(router.currentRoute.value.name, 'wf-025')
      assert.match(textOf(root), /변경이 완료되었어요/)
      assert.doesNotMatch(textOf(root), /확인할 변경 내용이 없어요/)
      if (outcome === 'error') reject(new Error('test navigation error'))
      else release(outcome === 'success')
      await navigation
      await nextTick()
      assert.equal(
        router.currentRoute.value.name,
        outcome === 'success' ? 'subscription' : 'wf-025',
      )
      if (outcome === 'success') {
        assert.equal(store.result, null)
        assert.equal(store.planId, '')
        assert.deepEqual(store.deliveryConditions, [])
        assert.match(textOf(root), /내 구독/)
      } else {
        assert.equal(store.result.differenceAmount, 31600)
        assert.match(textOf(root), /변경이 완료되었어요/)
      }
    })
  })
}

test('실제 완료 버튼으로 내 구독으로 이동한 뒤 확인 화면 재진입 시 결과가 남지 않는다', async () => {
  await withPage(async ({ router, root, store }) => {
    const button = flatten(root).find(
      (node) => node.type === 'button' && textOf(node).includes('내 구독에서 확인하기'),
    )
    await button.props.onClick()
    await nextTick()
    assert.equal(router.currentRoute.value.name, 'subscription')
    assert.equal(store.result, null)
    await router.push('/confirm')
    await nextTick()
    assert.match(textOf(root), /확인할 변경 내용이 없어요/)
  })
})

for (const [differenceType, differenceAmount, label] of [
  ['NO_PRICE_CHANGE', 0, '차액 없음'],
  ['INCREASE', 31600, '추가 결제'],
]) {
  test(`${label} 성공 결과도 완료 문구와 금액을 표시한다`, async () => {
    await withPage(
      async ({ root }) => {
        assert.match(textOf(root), /변경이 완료되었어요/)
        assert.ok(textOf(root).includes(`${label} ${differenceAmount.toLocaleString('ko-KR')}원`))
      },
      { effectiveStartDate: '2026-09-16', differenceType, differenceAmount },
    )
  })
}

test('입력 화면 복귀 시 작성 정보와 견적을 보존한다', async () => {
  await withPage(async ({ router, store }) => {
    store.preview = { differenceAmount: 0 }
    await router.push({ name: 'wf-024' })
    await nextTick()
    assert.equal(store.planId, 'test-plan')
    assert.equal(store.deliveryConditions[0].weekday, 'WEDNESDAY')
    assert.equal(store.preview.differenceAmount, 0)
  }, null)
})

test('준비 없이 직접 접근하면 빈 안내를 유지한다', async () => {
  await withPage(async ({ root }) => {
    assert.match(textOf(root), /확인할 변경 내용이 없어요/)
    assert.doesNotMatch(textOf(root), /변경이 완료되었어요/)
  }, null)
})

for (const user of [null, { userId: 2 }]) {
  test(`로그아웃·계정 변경 시 이전 결과와 입력을 초기화한다: ${user?.userId ?? 'logout'}`, async () => {
    await withPage(async ({ authSession, store, root }) => {
      authSession.state.user = user
      await nextTick()
      assert.equal(store.result, null)
      assert.equal(store.planId, '')
      assert.doesNotMatch(textOf(root), /31,600/)
    })
  })
}
