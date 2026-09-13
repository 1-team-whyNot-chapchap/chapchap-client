import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, reactive, nextTick, watch } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createFirstSubscriptionStore } from './stores/useFirstSubscriptionStore.js'
import { createAddressStore } from './stores/useAddressStore.js'
import { billingUserId } from './mobileBillingContext.js'

// 실제 신청 컴포넌트와 저장소를 메모리에서 실행한다. HTTP·결제 호출은 하지 않는다.
const sourceUrl = new URL('./pages/SubscriptionFlowPage.vue', import.meta.url)
const { descriptor } = parse(await readFile(sourceUrl, 'utf8'))
let source = compileScript(descriptor, { id: 'flow-test', inlineTemplate: true }).content
source = source.replace(
  /import \{ useRoute, useRouter \} from ['"]vue-router['"];?/,
  'const useRoute = () => globalThis.__flowTest.route; const useRouter = () => globalThis.__flowTest.router;',
)
for (const name of ['Address', 'FirstSubscription', 'Plan']) {
  source = source.replace(
    new RegExp(`import \\{ use${name}Store \\} from ['"][^'"]+['"];?`),
    `const use${name}Store = () => globalThis.__flowTest.${name};`,
  )
}
source = source.replace(
  /import (\w+) from ['"][^'"]+\.vue['"];?/g,
  'const $1 = { inheritAttrs: false, render() { return this.$slots.default?.() } };',
)
source = source.replace(
  /from (['"])([^'"]+)\1/g,
  (_, q, specifier) =>
    `from ${q}${specifier.startsWith('.') ? new URL(specifier, sourceUrl).href : import.meta.resolve(specifier)}${q}`,
)
const Flow = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`))
  .default

const element = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
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
const flatten = (node) => [node, ...node.children.flatMap(flatten)]
const textOf = (node) => `${node.text || ''}${node.children.map(textOf).join('')}`
const settle = async () => {
  for (let i = 0; i < 15; i++) {
    await Promise.resolve()
    await nextTick()
  }
}
const PLAN = '550e8400-e29b-41d4-a716-446655440000'
const ADDRESS = '660e8400-e29b-41d4-a716-446655440000'
const warning = (ctx) =>
  flatten(ctx.root)
    .filter((node) => node.props.class === 'flow-validation')
    .map(textOf)
    .join('')
function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { resolve, reject, promise }
}

async function withFlow(step, run, options = {}) {
  const previous = globalThis.__flowTest
  setActivePinia(createPinia())
  let quotes = 0
  const application = createFirstSubscriptionStore(
    {
      getRequiredTerms:
        options.getRequiredTerms ||
        (async () => [{ termsType: 'A', version: '1', title: '약관', content: '내용' }]),
      agreeRequiredTerms: options.agreeRequiredTerms || (async () => {}),
      preview: async () => {
        quotes++
        if (options.preview) return options.preview()
        return { paymentAmount: 10000 }
      },
      subscribe: () => {
        throw new Error('이 테스트는 구독 생성·결제를 호출하지 않는다')
      },
    },
    'flow-application',
  )()
  application.begin(PLAN)
  if (options.weekday) application.setDeliveryWeekdays(['MONDAY'])
  if (options.address) application.updateDeliveryCondition('MONDAY', { addressId: ADDRESS })
  const addressStore = createAddressStore(
    {
      listAddresses:
        options.listAddresses ||
        (async () => [{ addressId: ADDRESS, name: '테스트', isDefault: true }]),
    },
    'flow-addresses',
  )()
  const planStore = reactive({
    detailStatuses: {},
    planById: () => ({ planId: PLAN, name: '가정식', menus: [] }),
    async fetchPlan(id) {
      this.detailStatuses[id] = options.planFails?.() ? 'error' : 'success'
    },
  })
  const route = reactive({ query: { planId: PLAN } })
  const props = reactive({ step })
  const moves = []
  const navigate = async (target) => {
    moves.push(target)
    props.step = Number(target.name.slice(-3)) - 12
    await nextTick()
  }
  const router = { replace: navigate, push: navigate }
  globalThis.__flowTest = {
    route,
    router,
    Address: addressStore,
    FirstSubscription: application,
    Plan: planStore,
  }
  const root = element('root')
  const app = renderer.createApp({ render: () => h(Flow, props) })
  let mounted = true
  const unmount = () => {
    if (mounted) {
      app.unmount()
      mounted = false
    }
  }
  try {
    app.mount(root)
    await settle()
    await run({
      application,
      addressStore,
      props,
      moves,
      root,
      quotes: () => quotes,
      unmount,
      button: (label) =>
        flatten(root).find((node) => node.type === 'button' && textOf(node).trim() === label),
    })
  } finally {
    unmount()
    globalThis.__flowTest = previous
  }
}

test('실제 컴포넌트: 빈 신청으로 2~5단계 진입 시 모두 1단계로 이동하고 견적을 호출하지 않는다', async () => {
  for (const step of [2, 3, 4, 5])
    await withFlow(step, async (ctx) => {
      assert.equal(ctx.props.step, 1)
      assert.equal(ctx.moves[0].name, 'wf-013')
      assert.equal(ctx.quotes(), 0)
      assert.match(textOf(ctx.root), /배송 요일을 한 개 이상/)
    })
})

test('실제 컴포넌트: 배송지 미입력은 2단계로 이동하고 기본 주소는 그 화면에서 적용한다', async () => {
  await withFlow(
    4,
    async (ctx) => {
      assert.equal(ctx.props.step, 2)
      assert.equal(ctx.application.deliveryConditions[0].addressId, ADDRESS)
      assert.equal(ctx.quotes(), 0)
    },
    { weekday: true },
  )
})

test('실제 컴포넌트: 배송지 조회 실패는 빈 목록 안내와 구분하고 재시도할 수 있다', async () => {
  let fail = true
  await withFlow(
    3,
    async (ctx) => {
      assert.equal(ctx.props.step, 3)
      assert.match(textOf(ctx.root), /배송지를 불러오지 못했습니다/)
      assert.doesNotMatch(textOf(ctx.root), /등록된 배송지가 없어요/)
      assert.equal(ctx.button('다음'), undefined)
      fail = false
      await ctx.button('다시 시도').props.onClick()
      await settle()
      assert.match(textOf(ctx.root), /식사 수량과 시간을 설정/)
    },
    {
      weekday: true,
      address: true,
      listAddresses: async () => {
        if (fail) throw new Error('offline')
        return [{ addressId: ADDRESS }]
      },
    },
  )
})

test('실제 컴포넌트: 배송지 조회 중에는 화면 진행을 숨기고 초기화 후 늦은 응답으로 이동하지 않는다', async () => {
  const pending = deferred()
  await withFlow(
    4,
    async (ctx) => {
      assert.match(textOf(ctx.root), /신청 정보를 확인/)
      assert.equal(ctx.button('다음'), undefined)
      ctx.application.$reset()
      ctx.addressStore.invalidate()
      pending.resolve([{ addressId: ADDRESS, isDefault: true }])
      await settle()
      assert.equal(ctx.application.planId, '')
      assert.deepEqual(ctx.application.deliveryConditions, [])
      assert.deepEqual(ctx.moves, [])
      assert.equal(ctx.quotes(), 0)
    },
    { weekday: true, address: true, listAddresses: () => pending.promise },
  )
})

test('실제 컴포넌트: 체크만 한 약관은 5단계를 열지 않고 동의 API 완료 후 견적을 조회한다', async () => {
  await withFlow(
    4,
    async (ctx) => {
      ctx.application.setTermAgreement('A', true)
      ctx.props.step = 5
      await settle()
      assert.equal(ctx.props.step, 4)
      assert.equal(ctx.quotes(), 0)
      await ctx.button('다음').props.onClick()
      await settle()
      assert.equal(ctx.props.step, 5)
      assert.equal(ctx.application.termsConfirmed, true)
      assert.equal(ctx.quotes(), 1)
      assert.equal(ctx.application.submitStatus, 'idle')
      ctx.props.step = 3
      await settle()
      assert.equal(ctx.application.preview, null)
      ctx.application.updateDeliveryCondition('MONDAY', { mealQuantity: 3 })
      ctx.props.step = 5
      await settle()
      assert.equal(ctx.quotes(), 2)
    },
    { weekday: true, address: true },
  )
})

test('실제 App의 기존 감시 코드: 로그아웃과 계정 교체는 신청 상태를 초기화한다', async () => {
  const appSource = await readFile(new URL('../../App.vue', import.meta.url), 'utf8')
  const watcher = appSource.slice(appSource.indexOf('watch('), appSource.indexOf('const route ='))
  setActivePinia(createPinia())
  const store = createFirstSubscriptionStore({}, 'app-reset-test')()
  const user = { userId: '1', email: 'a@example.test', phone: 'test-a', role: 'CUSTOMER' }
  const session = { state: reactive({ user }) }
  const noop = { invalidate() {}, $reset() {}, clearSelectedOrder() {} }
  const stops = []
  let cleared = 0
  new Function(
    'watch',
    'authSession',
    'addressStore',
    'currentSubscriptionStore',
    'firstSubscriptionStore',
    'orderStore',
    'settingChangeStore',
    'cancellationStore',
    'appStore',
    'billingUserId',
    'clearMobileBilling',
    watcher,
  )(
    (...args) => {
      const stop = watch(...args)
      stops.push(stop)
      return stop
    },
    session,
    noop,
    noop,
    store,
    noop,
    noop,
    noop,
    noop,
    billingUserId,
    () => {
      cleared++
    },
  )
  try {
    store.begin(PLAN)
    store.setDeliveryWeekdays(['MONDAY'])
    session.state.user = { ...user }
    assert.equal(store.deliveryConditions.length, 1)
    session.state.user = null
    assert.equal(store.deliveryConditions.length, 0)
    assert.equal(cleared, 1)
    session.state.user = user
    store.begin(PLAN)
    store.setDeliveryWeekdays(['TUESDAY'])
    session.state.user = { ...user, email: 'b@example.test', phone: 'test-b' }
    assert.equal(store.planId, '')
    assert.deepEqual(store.deliveryConditions, [])
    store.begin(PLAN)
    store.setDeliveryWeekdays(['MONDAY'])
    session.state.user = { ...session.state.user, userId: '2' }
    assert.equal(store.planId, '')
    assert.equal(cleared, 2)
  } finally {
    stops.forEach((stop) => stop())
  }
})

test('실제 컴포넌트: 플랜 조회 실패 후 다시 시도하면 정상 화면을 보여준다', async () => {
  let fail = true
  await withFlow(
    1,
    async (ctx) => {
      assert.match(textOf(ctx.root), /플랜 정보를 확인할 수 없어요/)
      assert.equal(ctx.button('다음'), undefined)
      fail = false
      await ctx.button('다시 시도').props.onClick()
      await settle()
      assert.match(textOf(ctx.root), /배송받을 요일을 선택/)
    },
    { planFails: () => fail },
  )
})

test('실제 컴포넌트: 삭제된 배송지는 2단계로, 잘못된 수량은 3단계로 안내한다', async () => {
  await withFlow(
    4,
    async (ctx) => {
      assert.equal(ctx.props.step, 2)
      assert.match(textOf(ctx.root), /배송지를 다시 선택/)
    },
    { weekday: true, address: true, listAddresses: async () => [] },
  )
  await withFlow(
    3,
    async (ctx) => {
      ctx.application.updateDeliveryCondition('MONDAY', { mealQuantity: 7 })
      ctx.props.step = 5
      await settle()
      assert.equal(ctx.props.step, 3)
      assert.match(textOf(ctx.root), /1~6개로 설정/)
      assert.equal(ctx.quotes(), 0)
    },
    { weekday: true, address: true },
  )
})

test('실제 컴포넌트: 서버 약관 버전 불일치는 최신 약관 재조회 및 재동의를 요구한다', async () => {
  let reads = 0
  await withFlow(
    4,
    async (ctx) => {
      ctx.application.setTermAgreement('A', true)
      await ctx.button('다음').props.onClick()
      await settle()
      assert.equal(reads, 2)
      assert.equal(ctx.application.agreedTerms.A, false)
      assert.equal(ctx.application.termsConfirmed, false)
      assert.equal(ctx.props.step, 4)
      assert.equal(ctx.quotes(), 0)
    },
    {
      weekday: true,
      address: true,
      getRequiredTerms: async () => {
        reads++
        return [{ termsType: 'A', version: String(reads), title: '약관', content: '내용' }]
      },
      agreeRequiredTerms: async () => {
        throw Object.assign(new Error('버전 변경'), { code: 'TERMS_002' })
      },
    },
  )
})

test('약관 미동의 안내는 이전 단계와 재진입한 화면에 남지 않는다', async () => {
  await withFlow(
    4,
    async (ctx) => {
      await ctx.button('다음').props.onClick()
      assert.match(warning(ctx), /모든 필수 약관/)
      for (const step of [3, 2, 1, 4]) {
        ctx.props.step = step
        await settle()
        assert.equal(warning(ctx), '')
      }
    },
    { weekday: true, address: true },
  )
})

test('약관은 일부 체크만으로 경고를 지우지 않고 모두 체크하면 해제한다', async () => {
  await withFlow(
    4,
    async (ctx) => {
      await ctx.button('다음').props.onClick()
      ctx.application.setTermAgreement('A', true)
      await settle()
      assert.match(warning(ctx), /모든 필수 약관/)
      ctx.application.setTermAgreement('B', true)
      await settle()
      assert.equal(warning(ctx), '')
      assert.equal(ctx.application.termsConfirmed, false)
      assert.equal(ctx.quotes(), 0)
    },
    {
      weekday: true,
      address: true,
      getRequiredTerms: async () => [
        { termsType: 'A', version: '1' },
        { termsType: 'B', version: '1' },
      ],
    },
  )
})

test('요일을 선택하면 요일 안내가 해제되고 직접 진입한 배송지 화면에도 남지 않는다', async () => {
  await withFlow(1, async (ctx) => {
    await ctx.button('다음').props.onClick()
    await settle()
    assert.match(warning(ctx), /배송 요일/)
    ctx.application.setDeliveryWeekdays(['MONDAY'])
    await settle()
    assert.equal(warning(ctx), '')
    ctx.props.step = 2
    await settle()
    assert.equal(warning(ctx), '')
  })
})

for (const [label, step, invalid, valid] of [
  ['배송지', 2, { addressId: '' }, { addressId: ADDRESS }],
  ['수량', 3, { mealQuantity: 7 }, { mealQuantity: 2 }],
  ['시간대', 3, { deliveryTimeSlot: 'INVALID' }, { deliveryTimeSlot: 'TIME_1700_1900' }],
]) {
  test(`${label} 수정 시 해당 안내가 해제되고 이전 단계에 남지 않는다`, async () => {
    await withFlow(
      step,
      async (ctx) => {
        ctx.application.updateDeliveryCondition('MONDAY', invalid)
        await ctx.button('다음').props.onClick()
        await settle()
        assert.notEqual(warning(ctx), '')
        ctx.application.updateDeliveryCondition('MONDAY', valid)
        await settle()
        assert.equal(warning(ctx), '')
        ctx.props.step = step - 1
        await settle()
        assert.equal(warning(ctx), '')
      },
      { weekday: true, address: true },
    )
  })
}

test('수량과 시간대가 모두 잘못되면 수정 후 남아 있는 문제로 안내를 갱신한다', async () => {
  await withFlow(
    3,
    async (ctx) => {
      ctx.application.updateDeliveryCondition('MONDAY', {
        mealQuantity: 7,
        deliveryTimeSlot: 'INVALID',
      })
      await ctx.button('다음').props.onClick()
      await settle()
      assert.match(warning(ctx), /1~6개/)
      ctx.application.updateDeliveryCondition('MONDAY', { mealQuantity: 2 })
      await settle()
      assert.doesNotMatch(warning(ctx), /1~6개/)
      assert.match(warning(ctx), /배송 시간/)
      ctx.application.updateDeliveryCondition('MONDAY', { deliveryTimeSlot: 'TIME_1100_1300' })
      await settle()
      assert.equal(warning(ctx), '')
    },
    { weekday: true, address: true },
  )
})

test('견적 실패 안내는 5단계에만 표시하고 재시도 성공 시 해제한다', async () => {
  let fail = true
  await withFlow(
    4,
    async (ctx) => {
      ctx.application.setTermAgreement('A', true)
      await ctx.button('다음').props.onClick()
      await settle()
      assert.equal(ctx.props.step, 5)
      assert.match(warning(ctx), /견적 테스트 실패/)
      for (const step of [4, 3]) {
        ctx.props.step = step
        await settle()
        assert.equal(warning(ctx), '')
      }
      fail = false
      ctx.props.step = 5
      await settle()
      assert.equal(ctx.application.previewStatus, 'success')
      assert.equal(warning(ctx), '')
    },
    {
      weekday: true,
      address: true,
      preview: async () => {
        if (fail) throw new Error('견적 테스트 실패')
        return { paymentAmount: 10000 }
      },
    },
  )
})

test('약관 조회 실패 후 다른 단계에 안내가 남지 않고 재진입하면 재조회한다', async () => {
  let fail = true
  await withFlow(
    4,
    async (ctx) => {
      assert.match(warning(ctx), /약관 테스트 실패/)
      ctx.props.step = 3
      await settle()
      assert.equal(warning(ctx), '')
      fail = false
      ctx.props.step = 4
      await settle()
      assert.equal(ctx.application.termsStatus, 'success')
      assert.equal(warning(ctx), '')
    },
    {
      weekday: true,
      address: true,
      getRequiredTerms: async () => {
        if (fail) throw new Error('약관 테스트 실패')
        return [{ termsType: 'A', version: '1' }]
      },
    },
  )
})

test('이동 후 도착한 약관 조회 실패는 현재 단계의 새 안내를 덮어쓰지 않는다', async () => {
  const pending = deferred()
  await withFlow(
    4,
    async (ctx) => {
      ctx.props.step = 1
      await settle()
      ctx.application.setDeliveryWeekdays([])
      await ctx.button('다음').props.onClick()
      await settle()
      assert.match(warning(ctx), /배송 요일/)
      pending.reject(new Error('늦은 약관 실패'))
      await settle()
      assert.match(warning(ctx), /배송 요일/)
      assert.doesNotMatch(textOf(ctx.root), /늦은 약관 실패/)
      assert.equal(ctx.application.termsStatus, 'idle')
    },
    { weekday: true, address: true, getRequiredTerms: () => pending.promise },
  )
})

test('약관 동의 API 실패는 체크 변경만으로 숨기지 않고 재시도 성공 시 해제한다', async () => {
  let fail = true
  await withFlow(
    4,
    async (ctx) => {
      ctx.application.setTermAgreement('A', true)
      await ctx.button('다음').props.onClick()
      await settle()
      assert.match(warning(ctx), /동의 테스트 실패/)
      ctx.application.setTermAgreement('A', false)
      ctx.application.setTermAgreement('A', true)
      await settle()
      assert.match(warning(ctx), /동의 테스트 실패/)
      fail = false
      await ctx.button('다음').props.onClick()
      await settle()
      assert.equal(ctx.props.step, 5)
      assert.equal(warning(ctx), '')
    },
    {
      weekday: true,
      address: true,
      agreeRequiredTerms: async () => {
        if (fail) throw new Error('동의 테스트 실패')
      },
    },
  )
})
