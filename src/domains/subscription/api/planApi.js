import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/plans'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function planId(value) {
  if (typeof value !== 'string' || !UUID_V4.test(value)) {
    throw new SubscriptionApiError('올바른 플랜을 선택해 주세요.', {
      status: 400,
      code: 'COMMON_001',
    })
  }
  return value
}

function requirePlanList(data, status) {
  if (!Array.isArray(data?.plans)) {
    throw new SubscriptionApiError('플랜 목록 응답을 확인할 수 없습니다.', { status })
  }
  return data.plans
}

function requirePlanDetail(data, status) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.menus)) {
    throw new SubscriptionApiError('플랜 상세 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

export function createPlanApi(client) {
  return {
    async listPlans() {
      try {
        const response = await client.get(ROOT)
        return requirePlanList(
          unwrapSubscriptionResponse(response, '플랜 목록 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '플랜 목록을 불러오지 못했습니다.')
      }
    },

    async getPlan(value) {
      try {
        const id = planId(value)
        const response = await client.get(`${ROOT}/${id}`)
        return requirePlanDetail(
          unwrapSubscriptionResponse(response, '플랜 상세 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '플랜 정보를 불러오지 못했습니다.')
      }
    },
  }
}

export const planApi = createPlanApi(http)
