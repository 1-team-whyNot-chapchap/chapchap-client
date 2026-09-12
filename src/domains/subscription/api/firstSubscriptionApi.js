import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription'
const writeOptions = { skipAuthRetry: true }

function requireTerms(data, status) {
  if (
    !Array.isArray(data) ||
    data.some((term) => !term?.termsType || !term?.title || !term?.content || !term?.version)
  ) {
    throw new SubscriptionApiError('필수 약관 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

function requirePreview(data, status) {
  if (
    !data ||
    typeof data.periodStartDate !== 'string' ||
    typeof data.periodEndDate !== 'string' ||
    !Number.isFinite(Number(data.paymentAmount))
  ) {
    throw new SubscriptionApiError('예상 결제금액 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

function requireSubscription(data, status) {
  if (
    !data ||
    typeof data.subscriptionId !== 'string' ||
    typeof data.subscriptionStatus !== 'string' ||
    typeof data.periodStartDate !== 'string' ||
    typeof data.periodEndDate !== 'string'
  ) {
    throw new SubscriptionApiError('구독 신청 결과를 확인할 수 없습니다.', { status })
  }
  return data
}

export function createFirstSubscriptionApi(client) {
  return {
    async getRequiredTerms() {
      try {
        const response = await client.get(`${ROOT}/terms/required`)
        return requireTerms(
          unwrapSubscriptionResponse(response, '필수 약관을 불러오지 못했습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '필수 약관을 불러오지 못했습니다.')
      }
    },

    async agreeRequiredTerms({ termsType, version }) {
      try {
        const response = await client.post(
          `${ROOT}/terms/agreements`,
          { termsType, version },
          writeOptions,
        )
        return unwrapSubscriptionResponse(response, '필수 약관 동의 결과를 확인할 수 없습니다.')
      } catch (error) {
        throw toSubscriptionApiError(error, '필수 약관에 동의하지 못했습니다.')
      }
    },

    async preview(request) {
      try {
        const response = await client.post(`${ROOT}/subscriptions/preview`, request, writeOptions)
        return requirePreview(
          unwrapSubscriptionResponse(response, '예상 결제금액을 불러오지 못했습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '예상 결제금액을 불러오지 못했습니다.')
      }
    },

    async subscribe(request) {
      try {
        const response = await client.post(`${ROOT}/subscriptions`, request, writeOptions)
        return requireSubscription(
          unwrapSubscriptionResponse(response, '구독 신청 결과를 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '구독을 신청하지 못했습니다.')
      }
    },
  }
}

export const firstSubscriptionApi = createFirstSubscriptionApi(http)
