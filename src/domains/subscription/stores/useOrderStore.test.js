import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createOrderStore, ORDER_DETAIL_STORAGE_KEY } from './useOrderStore.js'

function deferred() {
  let resolve, reject
  const promise = new Promise((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}

for (const fails of [false, true]) {
  test(`주문 목록 초기화 이후 이전 계정 응답(${fails ? '실패' : '성공'})을 무시한다`, async () => {
    setActivePinia(createPinia())
    const old = deferred()
    let calls = 0
    const store = createOrderStore(
      { listOrders: () => (++calls === 1 ? old.promise : Promise.resolve([])) },
      createStorage(),
    )()
    const pending = store.fetchOrders()
    store.$reset()
    await store.fetchOrders()
    if (fails) old.reject(new Error('old account'))
    else old.resolve([{ orderId: ORDER_ID }])
    await pending
    assert.deepEqual(store.orders, [])
    assert.equal(store.listStatus, 'empty')
    assert.equal(store.listError, null)
  })
}

test('강제 주문 재조회 중 늦은 응답이 최신 결과를 덮어쓰지 않는다', async () => {
  setActivePinia(createPinia())
  const old = deferred()
  let calls = 0
  const orders = [{ orderId: ORDER_ID, status: 'ACTIVE', deliveryDate: '2026-09-16' }]
  const store = createOrderStore(
    { listOrders: () => (++calls === 1 ? old.promise : Promise.resolve(orders)) },
    createStorage(),
  )()
  const pending = store.fetchOrders()
  await store.fetchOrders(true)
  old.resolve([])
  await pending
  assert.deepEqual(store.orders, orders)
  assert.equal(store.listStatus, 'success')
})

test('주문 목록 실패와 재시도 및 빈 결과를 구분한다', async () => {
  setActivePinia(createPinia())
  let calls = 0
  const store = createOrderStore(
    {
      listOrders: async () => {
        if (++calls === 1) throw new Error('temporary')
        return []
      },
    },
    createStorage(),
  )()
  await store.fetchOrders()
  assert.equal(store.listStatus, 'error')
  await store.fetchOrders(true)
  assert.equal(store.listStatus, 'empty')
  assert.equal(store.listError, null)
})

for (const operation of ['reset', 'clear', 'select']) {
  test(`주문 상세 조회 중 ${operation} 뒤 이전 상세 응답이 표시되지 않는다`, async () => {
    setActivePinia(createPinia())
    const old = deferred()
    const nextId = '660e8400-e29b-41d4-a716-446655440000'
    const store = createOrderStore(
      { getOrder: (id) => (id === ORDER_ID ? old.promise : Promise.resolve({ orderId: nextId })) },
      createStorage(),
    )()
    store.selectOrder(ORDER_ID)
    const pending = store.fetchSelectedOrder()
    if (operation === 'reset') store.$reset()
    if (operation === 'clear') store.clearSelectedOrder()
    if (operation === 'select') {
      store.selectOrder(nextId)
      await store.fetchSelectedOrder()
    }
    old.resolve({ orderId: ORDER_ID })
    await pending
    assert.equal(store.detail?.orderId ?? null, operation === 'select' ? nextId : null)
    assert.equal(store.detailStatus, operation === 'select' ? 'success' : 'idle')
  })
}

const ORDER_ID = '550e8400-e29b-41d4-a716-446655440000'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('선택 주문 UUID만 sessionStorage에 보관하고 새 탭의 잘못된 값은 제거한다', () => {
  const storage = createStorage()
  setActivePinia(createPinia())
  const store = createOrderStore({}, storage, 'subscription-order-selection-test')()

  assert.equal(store.selectOrder(ORDER_ID), true)
  assert.equal(storage.getItem(ORDER_DETAIL_STORAGE_KEY), ORDER_ID)
  store.clearSelectedOrder()
  assert.equal(storage.getItem(ORDER_DETAIL_STORAGE_KEY), null)
  storage.setItem(ORDER_DETAIL_STORAGE_KEY, 'not-an-order')
  assert.equal(store.restoreSelectedOrder(), '')
})

test('주문 목록과 선택한 주문 상세를 서버에서 읽는다', async () => {
  const storage = createStorage()
  const order = { orderId: ORDER_ID, deliveryDate: '2026-09-14', status: 'ACTIVE', amount: 17800 }
  setActivePinia(createPinia())
  const store = createOrderStore(
    { listOrders: async () => [order], getOrder: async () => ({ ...order, menuName: '샐러드' }) },
    storage,
    'subscription-order-fetch-test',
  )()

  assert.deepEqual(await store.fetchOrders(), [order])
  store.selectOrder(ORDER_ID)
  assert.equal((await store.fetchSelectedOrder()).menuName, '샐러드')
})

test('월 변경 뒤 늦은 달력과 목록 응답은 현재 월 데이터를 덮어쓰지 않는다', async () => {
  setActivePinia(createPinia())
  const oldCalendar = deferred()
  const oldHistory = deferred()
  const store = createOrderStore(
    {
      listCalendarOrders: (month) =>
        month === '2026-09'
          ? oldCalendar.promise
          : Promise.resolve({ month, orders: [{ orderId: 'october' }] }),
      listOrderHistory: (month, page) =>
        month === '2026-09'
          ? oldHistory.promise
          : Promise.resolve(history(month, page, [{ orderId: 'october' }])),
    },
    createStorage(),
    'subscription-order-month-race-test',
  )()

  const oldCalendarRequest = store.fetchCalendarOrders('2026-09')
  const oldHistoryRequest = store.fetchOrderHistory('2026-09', 1)
  await store.fetchCalendarOrders('2026-10')
  await store.fetchOrderHistory('2026-10', 1)
  oldCalendar.resolve({ month: '2026-09', orders: [{ orderId: 'september' }] })
  oldHistory.resolve(history('2026-09', 1, [{ orderId: 'september' }]))
  await Promise.all([oldCalendarRequest, oldHistoryRequest])

  assert.equal(store.calendarMonth, '2026-10')
  assert.deepEqual(store.calendarOrders, [{ orderId: 'october' }])
  assert.equal(store.history.month, '2026-10')
  assert.deepEqual(store.history.orders, [{ orderId: 'october' }])
})

test('주문 일정 조회 중 초기화하면 이전 계정 응답을 표시하지 않는다', async () => {
  setActivePinia(createPinia())
  const oldCalendar = deferred()
  const oldHistory = deferred()
  const store = createOrderStore(
    { listCalendarOrders: () => oldCalendar.promise, listOrderHistory: () => oldHistory.promise },
    createStorage(),
    'subscription-order-reset-race-test',
  )()

  const pending = Promise.all([
    store.fetchCalendarOrders('2026-09'),
    store.fetchOrderHistory('2026-09', 1),
  ])
  store.$reset()
  oldCalendar.resolve({ month: '2026-09', orders: [{ orderId: 'old' }] })
  oldHistory.resolve(history('2026-09', 1, [{ orderId: 'old' }]))
  await pending

  assert.equal(store.calendarStatus, 'idle')
  assert.deepEqual(store.calendarOrders, [])
  assert.equal(store.historyStatus, 'idle')
  assert.deepEqual(store.history.orders, [])
})

function history(month, page, orders) {
  return {
    month,
    orders,
    page,
    size: 3,
    totalElements: orders.length,
    totalPages: orders.length ? 1 : 0,
    hasPrevious: false,
    hasNext: false,
  }
}
