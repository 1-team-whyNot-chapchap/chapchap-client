import http from '../../../common/api/http.js'
import { SubscriptionApiError, toSubscriptionApiError } from './subscriptionApiError.js'

const ROOT = '/api/subscription/subscriptions'

function requireCurrentSubscription(data, status) {
  if (data === null) return null

  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.subscriptionId !== 'string' ||
    typeof data.subscriptionStatus !== 'string' ||
    !Array.isArray(data.deliveryConditions)
  ) {
    throw new SubscriptionApiError('현재 구독 응답을 확인할 수 없습니다.', { status })
  }

  return data
}

export function createCurrentSubscriptionApi(client) {
  return {
    async getCurrentSubscription() {
      try {
        const response = await client.get(ROOT)
        const payload = response?.data

        if (payload?.code !== '00') {
          throw new SubscriptionApiError('현재 구독 응답을 확인할 수 없습니다.', {
            status: response?.status ?? null,
            code: typeof payload?.code === 'string' ? payload.code : '',
            serverMessage: typeof payload?.message === 'string' ? payload.message : '',
          })
        }

        return requireCurrentSubscription(payload.data, response.status ?? null)
      } catch (error) {
        throw toSubscriptionApiError(error, '현재 구독을 불러오지 못했습니다.')
      }
    },
  }
}

export const currentSubscriptionApi = createCurrentSubscriptionApi(http)
