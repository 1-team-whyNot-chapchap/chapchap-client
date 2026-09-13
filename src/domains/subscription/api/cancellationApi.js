import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/subscriptions'
const writeOptions = { skipAuthRetry: true }

function isAmount(value) {
  return Number.isFinite(Number(value))
}

function requireRefund(refund, status) {
  if (refund === null) return null
  if (
    !refund ||
    typeof refund.refundId !== 'string' ||
    typeof refund.status !== 'string' ||
    !isAmount(refund.requestedAmount) ||
    !isAmount(refund.refundedAmount) ||
    !isAmount(refund.unprocessedAmount)
  ) {
    throw new SubscriptionApiError('구독 해지 환불 응답을 확인할 수 없습니다.', { status })
  }
  return refund
}

function requireCancellation(data, status) {
  if (
    !data ||
    typeof data.cancellationType !== 'string' ||
    typeof data.subscriptionStatus !== 'string' ||
    typeof data.periodStatus !== 'string' ||
    typeof data.cancellationRequestedAt !== 'string'
  ) {
    throw new SubscriptionApiError('구독 해지 결과 응답을 확인할 수 없습니다.', { status })
  }

  return { ...data, refund: requireRefund(data.refund, status) }
}

export function createCancellationApi(client) {
  return {
    async cancel() {
      try {
        const response = await client.delete(ROOT, writeOptions)
        return requireCancellation(
          unwrapSubscriptionResponse(response, '구독 해지 결과 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '구독 해지를 처리하지 못했습니다.')
      }
    },
  }
}

export const cancellationApi = createCancellationApi(http)
