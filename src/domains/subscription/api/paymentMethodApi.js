import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/payment-methods'
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const writeOptions = { skipAuthRetry: true }

function requirePaymentMethodId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new SubscriptionApiError('올바른 결제수단을 선택해 주세요.', {
      status: 400,
      code: 'COMMON_001',
    })
  }
  return value
}

function requireBillingKey(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SubscriptionApiError('카드 등록 결과를 확인할 수 없습니다.', {
      status: 400,
      code: 'PAYMENT_001',
    })
  }
  return value.trim()
}

function requirePaymentMethod(data, status, fallbackMessage) {
  if (
    !data ||
    typeof data.paymentMethodId !== 'string' ||
    !UUID.test(data.paymentMethodId) ||
    (data.cardCompany !== null && typeof data.cardCompany !== 'string') ||
    (data.maskedCardNumber !== null && typeof data.maskedCardNumber !== 'string') ||
    typeof data.isCurrent !== 'boolean'
  ) {
    throw new SubscriptionApiError(fallbackMessage, { status })
  }
  return data
}

function requirePaymentMethods(data, status) {
  if (!Array.isArray(data?.paymentMethods)) {
    throw new SubscriptionApiError('결제수단 목록 응답을 확인할 수 없습니다.', { status })
  }
  return data.paymentMethods.map((paymentMethod) =>
    requirePaymentMethod(paymentMethod, status, '결제수단 목록 응답을 확인할 수 없습니다.'),
  )
}

export function createPaymentMethodApi(client) {
  return {
    async list() {
      try {
        const response = await client.get(ROOT)
        return requirePaymentMethods(
          unwrapSubscriptionResponse(response, '결제수단을 불러오지 못했습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '결제수단을 불러오지 못했습니다.')
      }
    },

    async register(billingKey) {
      try {
        const response = await client.post(
          ROOT,
          { billingKey: requireBillingKey(billingKey) },
          writeOptions,
        )
        return requirePaymentMethod(
          unwrapSubscriptionResponse(response, '결제수단 등록 결과를 확인할 수 없습니다.'),
          response.status ?? null,
          '결제수단 등록 결과를 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '결제수단을 등록하지 못했습니다.')
      }
    },

    async selectCurrent(paymentMethodId) {
      try {
        const response = await client.patch(
          `${ROOT}/${requirePaymentMethodId(paymentMethodId)}/current`,
          undefined,
          writeOptions,
        )
        const result = unwrapSubscriptionResponse(
          response,
          '현재 결제수단 변경 결과를 확인할 수 없습니다.',
        )
        if (
          !result ||
          result.paymentMethodId !== paymentMethodId ||
          typeof result.isCurrent !== 'boolean'
        ) {
          throw new SubscriptionApiError('현재 결제수단 변경 결과를 확인할 수 없습니다.', {
            status: response.status ?? null,
          })
        }
        return result
      } catch (error) {
        throw toSubscriptionApiError(error, '현재 결제수단을 변경하지 못했습니다.')
      }
    },

    async remove(paymentMethodId) {
      try {
        const response = await client.delete(
          `${ROOT}/${requirePaymentMethodId(paymentMethodId)}`,
          writeOptions,
        )
        const result = unwrapSubscriptionResponse(
          response,
          '결제수단 삭제 결과를 확인할 수 없습니다.',
        )
        if (!result || result.paymentMethodId !== paymentMethodId) {
          throw new SubscriptionApiError('결제수단 삭제 결과를 확인할 수 없습니다.', {
            status: response.status ?? null,
          })
        }
        return result
      } catch (error) {
        throw toSubscriptionApiError(error, '결제수단을 삭제하지 못했습니다.')
      }
    },
  }
}

export const paymentMethodApi = createPaymentMethodApi(http)
