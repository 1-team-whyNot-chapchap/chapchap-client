import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateFirstSubscriptionSchedule as calculate,
  subscriptionReference,
  shiftScheduleDate,
} from './firstSubscriptionSchedule.js'
import { DELIVERY_WEEKDAYS } from './firstSubscriptionForm.js'
import { canSelectMenuDate, menuForDate } from '../product/utils/menuCalendar.js'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick, reactive } from 'vue'

// Deliberately limited holiday fixtures, not the production holiday seed.
const calendar = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: [
    { holidayDate: '2026-08-17', holidayName: '대체공휴일' },
    { holidayDate: '2026-09-24', holidayName: '추석 연휴' },
    { holidayDate: '2026-09-25', holidayName: '추석' },
    { holidayDate: '2026-09-26', holidayName: '추석 연휴' },
    { holidayDate: '2027-01-01', holidayName: '신정' },
  ],
}
const at = (date) => new Date(date)

test('KST 13:59:59와 14:00:00 사이에 첫 배송일이 변경된다', () => {
  const before = calculate(at('2026-09-14T13:59:59+09:00'), DELIVERY_WEEKDAYS, calendar)
  const after = calculate(at('2026-09-14T14:00:00+09:00'), DELIVERY_WEEKDAYS, calendar)
  assert.equal(before.periodStartDate, '2026-09-15')
  assert.equal(before.periodEndDate, '2026-10-12')
  assert.equal(after.periodStartDate, '2026-09-16')
  assert.equal(after.periodEndDate, '2026-10-13')
})
test('입력 시각의 표기 시간대와 무관하게 한국 날짜를 적용한다', () => {
  assert.deepEqual(subscriptionReference(at('2026-09-13T15:00:00Z')), {
    today: '2026-09-14',
    reflectionDate: '2026-09-15',
  })
  assert.equal(subscriptionReference(at('2026-09-13T14:59:59Z')).today, '2026-09-13')
})
test('월·수·금 선택 시 가장 빠른 선택 요일부터 정확히 28일을 표시한다', () => {
  const result = calculate(
    at('2026-09-14T13:00:00+09:00'),
    ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    calendar,
  )
  assert.equal(result.periodStartDate, '2026-09-16')
  assert.equal(result.periodEndDate, '2026-10-13')
  assert.deepEqual(result.deliveryDates, [
    '2026-09-16',
    '2026-09-18',
    '2026-09-21',
    '2026-09-23',
    '2026-09-28',
    '2026-09-30',
    '2026-10-02',
    '2026-10-05',
    '2026-10-07',
    '2026-10-09',
    '2026-10-12',
  ])
})
test('요일 미선택은 기간을 만들지 않고 1개부터 6개 요일까지 계산한다', () => {
  const now = at('2026-09-14T13:00:00+09:00')
  assert.equal(calculate(now, [], calendar).status, 'unselected')
  assert.equal(calculate(now, [], calendar).periodStartDate, null)
  for (let count = 1; count <= 6; count++) {
    const result = calculate(now, DELIVERY_WEEKDAYS.slice(0, count), calendar)
    assert.equal(result.status, 'ready')
    assert.equal(result.periodEndDate, shiftScheduleDate(result.periodStartDate, 27))
    assert.ok(result.deliveryDates.every((date) => canSelectMenuDate(date, calendar)))
  }
})
test('연속 공휴일과 일요일을 건너뛰고 선택 요일을 바꾸면 시작일도 재계산한다', () => {
  const now = at('2026-09-23T13:00:00+09:00')
  assert.equal(calculate(now, DELIVERY_WEEKDAYS, calendar).periodStartDate, '2026-09-28')
  assert.equal(calculate(now, ['TUESDAY'], calendar).periodStartDate, '2026-09-29')
  assert.equal(
    calculate(at('2026-08-15T13:00:00+09:00'), ['MONDAY', 'TUESDAY', 'WEDNESDAY'], calendar)
      .periodStartDate,
    '2026-08-18',
  )
})
test('연도와 윤년 월 경계의 날짜 계산이 정확하다', () => {
  assert.equal(
    calculate(at('2026-12-31T13:00:00+09:00'), DELIVERY_WEEKDAYS, calendar).periodStartDate,
    '2027-01-02',
  )
  assert.equal(shiftScheduleDate('2028-02-28', 1), '2028-02-29')
  assert.equal(shiftScheduleDate('2028-02-28', 2), '2028-03-01')
})
test('공휴일 미조회·범위 부족은 부분 일정도 배송 예정으로 표시하지 않는다', () => {
  const now = at('2026-09-14T13:00:00+09:00')
  assert.equal(calculate(now, ['MONDAY'], null).status, 'unavailable')
  for (const changed of [
    { ...calendar, supportedStartDate: '2026-10-01' },
    { ...calendar, supportedEndDate: '2026-09-30' },
    { ...calendar, supportedEndDate: '2026-09-14' },
  ]) {
    const result = calculate(now, DELIVERY_WEEKDAYS, changed)
    assert.equal(result.status, 'out-of-range')
    assert.deepEqual(result.deliveryDates, [])
    assert.equal(result.periodStartDate, null)
  }
})
test('일요일·공휴일·범위 밖은 클릭 불가, 선택하지 않은 평일은 메뉴 확인 가능', () => {
  for (const date of ['2026-09-13', '2026-09-24', '2028-01-01'])
    assert.equal(canSelectMenuDate(date, calendar), false)
  assert.equal(canSelectMenuDate('2026-09-15', calendar), true)
})
test('날짜 N일의 실제 메뉴를 선택하며 누락 시 다른 메뉴로 대체하지 않는다', () => {
  const menu = { menuSequence: 15, name: '실제 15일 메뉴', imageUrl: '/test-menu.png' }
  const plan = { menus: [{ menuSequence: 1, name: '첫 메뉴' }, menu] }
  assert.equal(menuForDate(plan, '2026-09-15'), menu)
  assert.equal(menuForDate(plan, '2026-09-16'), null)
  assert.equal(menuForDate(plan, '2026-10-15'), menu)
})

// Mount the actual Vue template in memory; no browser, network, DB, or extra test dependency.
const componentUrl = new URL('./components/SubscriptionScheduleSelector.vue', import.meta.url)
const { descriptor } = parse(await readFile(componentUrl, 'utf8'))
let compiled = compileScript(descriptor, { id: 'schedule-test', inlineTemplate: true }).content
compiled = compiled.replace(
  /import \{ holidayApi \} from ['"][^'"]+['"];?/,
  'const holidayApi = { getHolidays: () => globalThis.__scheduleTest.api() }; const Date = class { constructor(...args) { return new globalThis.__scheduleTest.Date(...args) } static now() { return globalThis.__scheduleTest.Date.now() } };',
)
compiled = compiled.replace(
  /from (['"])([^'"]+)\1/g,
  (_, quote, specifier) =>
    `from ${quote}${specifier.startsWith('.') ? new URL(specifier, componentUrl).href : import.meta.resolve(specifier)}${quote}`,
)
const ScheduleComponent = (
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
).default

function element(type, text = '') {
  return { type, text, props: {}, children: [], parent: null }
}
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
const settle = async () => {
  await Promise.resolve()
  await nextTick()
  await nextTick()
}
function flatten(node) {
  return [node, ...node.children.flatMap(flatten)]
}
function textOf(node) {
  return `${typeof node.text === 'string' ? node.text : ''}${node.children.map(textOf).join('')}`
}

async function mountedSchedule(run, api = async () => calendar) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    harness: globalThis.__scheduleTest,
  }
  const listeners = new Map()
  let callback
  let current = '2026-09-14T13:59:59+09:00'
  const RealDate = Date
  globalThis.__scheduleTest = {
    api,
    Date: class extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [current]))
      }
      static now() {
        return new RealDate(current).getTime()
      }
    },
  }
  const events = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  }
  globalThis.window = {
    ...events,
    setTimeout: (fn) => {
      callback = fn
      return 1
    },
    clearTimeout: () => {
      callback = null
    },
  }
  globalThis.document = { ...events, visibilityState: 'visible' }
  const props = reactive({
    modelValue: ['MONDAY', 'TUESDAY'],
    plan: {
      planId: 'a',
      name: '가정식',
      menus: [{ menuSequence: 15, name: '15일 메뉴', imageUrl: '/menu.png' }],
    },
  })
  const root = element('root')
  const app = renderer.createApp({
    render: () =>
      h(ScheduleComponent, {
        ...props,
        'onUpdate:modelValue': (value) => {
          props.modelValue = value
        },
      }),
  })
  let unmounted = false
  const unmount = () => {
    if (!unmounted) {
      app.unmount()
      unmounted = true
    }
  }
  const nodes = () => flatten(root)
  const button = (label) =>
    nodes().find(
      (node) =>
        node.type === 'button' &&
        (node.props['aria-label'] === label || textOf(node).trim() === label),
    )
  try {
    app.mount(root)
    await settle()
    await run({
      props,
      root,
      nodes,
      button,
      listeners,
      text: () => textOf(root),
      setTime: (value) => {
        current = value
      },
      tick: () => callback?.(),
      unmount,
    })
  } finally {
    unmount()
    assert.equal(listeners.size, 0)
    assert.equal(callback, null)
    for (const [key, value] of [
      ['window', previous.window],
      ['document', previous.document],
      ['__scheduleTest', previous.harness],
    ]) {
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
    }
  }
}

test('실제 컴포넌트: 조회 실패 시 날짜 차단, 재시도 후 해제하며 이미지는 실패 대체 표시', async () => {
  let attempts = 0
  await mountedSchedule(
    async ({ button, nodes, text, props }) => {
      assert.match(text(), /공휴일 정보를 불러오지 못해/)
      assert.ok(
        nodes()
          .filter((node) => node.props['aria-label']?.includes('메뉴 확인'))
          .every((node) => node.props.disabled),
      )
      await button('다시 시도').props.onClick()
      await settle()
      assert.doesNotMatch(text(), /공휴일 정보를 불러오지 못해/)
      assert.equal(button('9월 24일 추석 연휴 · 선택 불가 메뉴 확인').props.disabled, true)
      button('9월 15일 배송 예정 메뉴 확인').props.onClick()
      await settle()
      assert.match(text(), /15일 메뉴/)
      assert.deepEqual([...props.modelValue], ['MONDAY', 'TUESDAY'])
      nodes()
        .find((node) => node.type === 'img')
        .props.onError()
      await settle()
      assert.match(text(), /메뉴 이미지 준비 중/)
      button('9월 16일 메뉴 확인용 · 배송 예정일 아님 메뉴 확인').props.onClick()
      await settle()
      assert.match(text(), /해당 날짜의 메뉴 정보를 확인할 수 없습니다/)
    },
    async () => {
      if (++attempts === 1) throw new Error('test outage')
      return calendar
    },
  )
})

test('실제 컴포넌트: 14시 타이머·자정 복귀 갱신과 이벤트 정리', async () => {
  await mountedSchedule(async ({ text, props, setTime, tick, listeners }) => {
    props.modelValue = [...DELIVERY_WEEKDAYS]
    await settle()
    assert.match(text(), /2026-09-15 ~ 2026-10-12/)
    setTime('2026-09-14T14:00:00+09:00')
    tick()
    await settle()
    assert.match(text(), /2026-09-16 ~ 2026-10-13/)
    setTime('2026-09-15T23:59:59+09:00')
    listeners.get('focus')()
    await settle()
    assert.match(text(), /2026-09-17 ~ 2026-10-14/)
    setTime('2026-09-16T00:00:00+09:00')
    listeners.get('visibilitychange')()
    await settle()
    assert.match(text(), /2026-09-17 ~ 2026-10-14/)
  })
})

test('실제 컴포넌트: 첫 날짜 무선택·플랜 전환 및 제공 범위 밖 월 이동 차단', async () => {
  await mountedSchedule(async ({ text, button, props }) => {
    assert.match(text(), /날짜를 누르면/)
    button('9월 15일 배송 예정 메뉴 확인').props.onClick()
    await settle()
    props.plan = { planId: 'b', name: '간편식', menus: [] }
    await settle()
    assert.match(text(), /날짜를 누르면/)
    assert.doesNotMatch(text(), /15일 메뉴/)
    for (let i = 0; i < 8; i++) {
      button('이전 달').props.onClick()
      await settle()
    }
    assert.equal(button('이전 달').props.disabled, true)
    for (let i = 0; i < 23; i++) {
      button('다음 달').props.onClick()
      await settle()
    }
    assert.equal(button('다음 달').props.disabled, true)
  })
})

test('실제 컴포넌트: 이탈 뒤 도착한 공휴일 응답은 폐기한다', async () => {
  let resolve
  await mountedSchedule(
    async ({ unmount, root }) => {
      unmount()
      resolve(calendar)
      await settle()
      assert.equal(root.children.length, 0)
    },
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
})
