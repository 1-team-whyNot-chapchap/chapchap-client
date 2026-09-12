import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/subscriptions/setting-changes'
const writeOptions = { skipAuthRetry: true }

function requirePreview(data, status) {
  if (
    !data ||
    !Number.isFinite(Number(data.currentAmount)) ||
    !Number.isFinite(Number(data.changedAmount)) ||
    !Number.isFinite(Number(data.differenceAmount)) ||
    typeof data.differenceType !== 'string' ||
    typeof data.effectiveStartDate !== 'string' ||
    typeof data.requiredAction !== 'string'
  ) {
    throw new SubscriptionApiError('설정 변경 미리보기 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

function requireResult(data, status) {
  if (
    !data ||
    typeof data.settingStatus !== 'string' ||
    typeof data.differenceType !== 'string' ||
    !Number.isFinite(Number(data.differenceAmount)) ||
    typeof data.effectiveStartDate !== 'string' ||
    typeof data.paymentConfirmationRequired !== 'boolean'
  ) {
    throw new SubscriptionApiError('설정 변경 결과 응답을 확인할 수 없습니다.', { status })
  }
  return data
}

export function createSettingChangeApi(client) {
  return {
    async preview(request) {
      try {
        const response = await client.post(`${ROOT}/preview`, request, writeOptions)
        return requirePreview(
          unwrapSubscriptionResponse(response, '설정 변경 미리보기 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '설정 변경 미리보기를 불러오지 못했습니다.')
      }
    },

    async change(request) {
      try {
        const response = await client.post(ROOT, request, writeOptions)
        return requireResult(
          unwrapSubscriptionResponse(response, '설정 변경 결과 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '구독 설정을 변경하지 못했습니다.')
      }
    },
  }
}

export const settingChangeApi = createSettingChangeApi(http)
