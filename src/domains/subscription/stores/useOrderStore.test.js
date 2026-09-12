import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createOrderStore, ORDER_DETAIL_STORAGE_KEY } from './useOrderStore.js'

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
