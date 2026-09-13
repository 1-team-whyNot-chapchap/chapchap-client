import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription'
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

const isAmount = (value) => Number.isFinite(Number(value))
const isUuid = (value) => typeof value === 'string' && UUID.test(value)

function requireId(value, name) {
  if (!isUuid(value)) {
    throw new SubscriptionApiError(`올바른 ${name}을 선택해 주세요.`, {
      status: 400,
      code: 'COMMON_001',
    })
  }
  return value
}

function requirePaymentItem(item, status) {
  if (
    !isUuid(item?.paymentId) ||
    typeof item.paymentType !== 'string' ||
    typeof item.status !== 'string' ||
    !isAmount(item.amount) ||
    typeof item.occurredAt !== 'string'
  ) {
    throw new SubscriptionApiError('결제 내역 응답을 확인할 수 없습니다.', { status })
  }
  return item
}

function requireRefundItem(item, status) {
  if (
    !isUuid(item?.refundId) ||
    typeof item.refundType !== 'string' ||
    typeof item.status !== 'string' ||
    !isAmount(item.requestedAmount) ||
    !isAmount(item.refundedAmount) ||
    !isAmount(item.unprocessedAmount) ||
    typeof item.requestedAt !== 'string'
  ) {
    throw new SubscriptionApiError('환불 내역 응답을 확인할 수 없습니다.', { status })
  }
  return item
}

function requirePaymentDetail(data, status) {
  const detail = requirePaymentItem(data, status)
  if (
    !isAmount(detail.originalPaymentAmount) ||
    !isAmount(detail.cumulativeCancelAmount) ||
    !isAmount(detail.cancelableAmount) ||
    typeof detail.periodStartDate !== 'string' ||
    typeof detail.periodEndDate !== 'string' ||
    !Array.isArray(detail.attempts) ||
    detail.attempts.some(
      (attempt) =>
        !Number.isInteger(attempt?.attemptSequence) ||
        !isAmount(attempt.requestedAmount) ||
        typeof attempt.requestedAt !== 'string' ||
        typeof attempt.result !== 'string',
    )
  ) {
    throw new SubscriptionApiError('결제 상세 응답을 확인할 수 없습니다.', { status })
  }
  return detail
}

function requireRefundDetail(data, status) {
  const detail = requireRefundItem(data, status)
  if (
    !Array.isArray(detail.cancellations) ||
    detail.cancellations.some(
      (cancellation) =>
        !isUuid(cancellation?.paymentId) ||
        !isUuid(cancellation.originalPaymentId) ||
        typeof cancellation.status !== 'string' ||
        !isAmount(cancellation.amount) ||
        typeof cancellation.occurredAt !== 'string',
    )
  ) {
    throw new SubscriptionApiError('환불 상세 응답을 확인할 수 없습니다.', { status })
  }
  return detail
}

function requireList(data, key, itemValidator, status, fallbackMessage) {
  if (!Array.isArray(data?.[key])) {
    throw new SubscriptionApiError(fallbackMessage, { status })
  }
  return data[key].map((item) => itemValidator(item, status))
}

export function createPaymentRefundHistoryApi(client) {
  const get = async (path, fallbackMessage) => {
    const response = await client.get(`${ROOT}${path}`)
    return {
      data: unwrapSubscriptionResponse(response, fallbackMessage),
      status: response.status ?? null,
    }
  }

  return {
    async listPayments() {
      try {
        const { data, status } = await get('/payments', '결제 내역을 불러오지 못했습니다.')
        return requireList(
          data,
          'payments',
          requirePaymentItem,
          status,
          '결제 내역 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '결제 내역을 불러오지 못했습니다.')
      }
    },

    async getPayment(paymentId) {
      try {
        const { data, status } = await get(
          `/payments/${requireId(paymentId, '결제 내역')}`,
          '결제 상세를 불러오지 못했습니다.',
        )
        return requirePaymentDetail(data, status)
      } catch (error) {
        throw toSubscriptionApiError(error, '결제 상세를 불러오지 못했습니다.')
      }
    },

    async listRefunds() {
      try {
        const { data, status } = await get('/refunds', '환불 내역을 불러오지 못했습니다.')
        return requireList(
          data,
          'refunds',
          requireRefundItem,
          status,
          '환불 내역 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '환불 내역을 불러오지 못했습니다.')
      }
    },

    async getRefund(refundId) {
      try {
        const { data, status } = await get(
          `/refunds/${requireId(refundId, '환불 내역')}`,
          '환불 상세를 불러오지 못했습니다.',
        )
        return requireRefundDetail(data, status)
      } catch (error) {
        throw toSubscriptionApiError(error, '환불 상세를 불러오지 못했습니다.')
      }
    },
  }
}

export const paymentRefundHistoryApi = createPaymentRefundHistoryApi(http)
