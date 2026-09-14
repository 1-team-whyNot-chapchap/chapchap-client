import test from 'node:test'
import assert from 'node:assert/strict'
import { isOrderDate, orderIdsForDate } from './dateOrderDetails.js'

test('선택 날짜의 주문은 상태와 관계없이 모두 선택한다', () => {
  const orders = [
    { orderId: 'active', deliveryDate: '2026-09-18', status: 'ACTIVE' },
    { orderId: 'canceled', deliveryDate: '2026-09-18', status: 'CANCELED_BEFORE_START' },
    { orderId: 'next-day', deliveryDate: '2026-09-19', status: 'PAYMENT_FAILED' },
  ]

  assert.deepEqual(orderIdsForDate(orders, '2026-09-18'), ['active', 'canceled'])
})

test('존재하지 않는 날짜는 주문 상세 조회 대상으로 사용하지 않는다', () => {
  assert.equal(isOrderDate('2026-02-29'), false)
  assert.deepEqual(orderIdsForDate([], '2026-02-29'), [])
})
