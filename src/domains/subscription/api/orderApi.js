import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/orders'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isOrderId(value) {
  return typeof value === 'string' && UUID_V4.test(value)
}

function orderId(value) {
  if (!isOrderId(value)) {
    throw new SubscriptionApiError('올바른 주문을 선택해 주세요.', {
      status: 400,
      code: 'COMMON_001',
    })
  }
  return value
}

function requireOrders(data, status) {
  if (
    !Array.isArray(data?.orders) ||
    data.orders.some(
      (order) =>
        !isOrderId(order?.orderId) ||
        typeof order.deliveryDate !== 'string' ||
        typeof order.status !== 'string' ||
        !Number.isFinite(Number(order.amount)),
    )
  ) {
    throw new SubscriptionApiError('주문 목록 응답을 확인할 수 없습니다.', { status })
  }
  return data.orders
}

function requireOrder(data, status) {
  if (
    !data ||
    !isOrderId(data.orderId) ||
    typeof data.deliveryDate !== 'string' ||
    typeof data.status !== 'string' ||
    typeof data.planName !== 'string' ||
    typeof data.menuName !== 'string' ||
    !Number.isInteger(data.mealQuantity) ||
    typeof data.deliveryTimeSlot !== 'string' ||
    !Number.isFinite(Number(data.amount))
  ) {
    throw new SubscriptionApiError('주문 상세 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

export function createOrderApi(client) {
  return {
    async listOrders() {
      try {
        const response = await client.get(ROOT)
        return requireOrders(
          unwrapSubscriptionResponse(response, '주문 목록을 불러오지 못했습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '주문 목록을 불러오지 못했습니다.')
      }
    },

    async getOrder(value) {
      try {
        const response = await client.get(`${ROOT}/${orderId(value)}`)
        return requireOrder(
          unwrapSubscriptionResponse(response, '주문 상세를 불러오지 못했습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '주문 상세를 불러오지 못했습니다.')
      }
    },
  }
}

export const orderApi = createOrderApi(http)
