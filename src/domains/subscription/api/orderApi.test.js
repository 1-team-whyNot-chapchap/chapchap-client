import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrderApi } from './orderApi.js'

const ORDER_ID = '550e8400-e29b-41d4-a716-446655440000'
const success = (data) => ({ status: 200, data: { code: '00', data } })
const item = { orderId: ORDER_ID, deliveryDate: '2026-09-14', status: 'ACTIVE', amount: 17800 }

test('주문 목록과 상세는 Gateway 주문 조회 경로를 사용한다', async () => {
  const calls = []
  const api = createOrderApi({
    get: async (url) => {
      calls.push(url)
      return url.endsWith(ORDER_ID)
        ? success({
            ...item,
            planName: '간편식',
            menuName: '샐러드',
            mealQuantity: 2,
            deliveryTimeSlot: 'TIME_1100_1300',
          })
        : success({ orders: [item] })
    },
  })

  assert.deepEqual(await api.listOrders(), [item])
  assert.equal((await api.getOrder(ORDER_ID)).menuName, '샐러드')
  assert.deepEqual(calls, ['/api/subscription/orders', `/api/subscription/orders/${ORDER_ID}`])
})

test('잘못된 주문 ID와 계약에 없는 응답은 요청 전에 또는 응답 검증에서 거절한다', async () => {
  const api = createOrderApi({
    get: async () => success({ orders: [{ orderId: 'local', amount: 1 }] }),
  })
  await assert.rejects(api.listOrders(), /주문 목록 응답/)
  await assert.rejects(api.getOrder('local'), (error) => {
    assert.equal(error.status, 400)
    assert.equal(error.code, 'COMMON_001')
    return true
  })
})

test('월별 주문 달력과 3건 목록 페이지는 별도 조회 경로를 사용한다', async () => {
  const calls = []
  const api = createOrderApi({
    get: async (url, options) => {
      calls.push({ url, options })
      if (url.endsWith('/calendar')) {
        return success({
          month: '2026-09',
          orders: [{ orderId: ORDER_ID, deliveryDate: '2026-09-14', status: 'ACTIVE' }],
        })
      }
      return success({
        month: '2026-09',
        orders: [item],
        page: 2,
        size: 3,
        totalElements: 4,
        totalPages: 2,
        hasPrevious: true,
        hasNext: false,
      })
    },
  })

  assert.equal((await api.listCalendarOrders('2026-09')).orders[0].orderId, ORDER_ID)
  assert.equal((await api.listOrderHistory('2026-09', 2)).page, 2)
  assert.deepEqual(calls, [
    { url: '/api/subscription/orders/calendar', options: { params: { month: '2026-09' } } },
    {
      url: '/api/subscription/orders/history',
      options: { params: { month: '2026-09', page: 2 } },
    },
  ])
})

test('월 또는 페이지 형식이 잘못되면 월별 조회 요청을 보내지 않는다', async () => {
  const api = createOrderApi({ get: async () => assert.fail('요청을 보내면 안 됩니다.') })

  await assert.rejects(api.listCalendarOrders('2026-9'), /조회할 월/)
  await assert.rejects(api.listOrderHistory('2026-09', 0), /조회할 페이지/)
})
