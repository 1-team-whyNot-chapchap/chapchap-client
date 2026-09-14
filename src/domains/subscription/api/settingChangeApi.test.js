import test from 'node:test'
import assert from 'node:assert/strict'
import { createSettingChangeApi } from './settingChangeApi.js'

const request = {
  planId: '550e8400-e29b-41d4-a716-446655440000',
  deliveryConditions: [
    {
      weekday: 'MONDAY',
      mealQuantity: 2,
      addressId: '550e8400-e29b-41d4-a716-446655440001',
      deliveryTimeSlot: 'TIME_1100_1300',
    },
  ],
}
const preview = {
  currentAmount: 17800,
  changedAmount: 26700,
  differenceType: 'INCREASE',
  differenceAmount: 8900,
  effectiveStartDate: '2026-09-14',
  requiredAction: 'ADDITIONAL_PAYMENT',
}
const result = {
  settingStatus: 'APPLIED',
  differenceType: 'INCREASE',
  differenceAmount: 8900,
  effectiveStartDate: '2026-09-14',
  paymentConfirmationRequired: true,
  currentPaymentMethod: null,
  refund: null,
}
const success = (data) => ({ status: 200, data: { code: '00', message: 'SUCCESS', data } })

test('설정 변경 미리보기와 최종 실행은 Gateway 경로 및 동일 요청 본문을 사용한다', async () => {
  const calls = []
  const api = createSettingChangeApi({
    post: async (url, body, options) => {
      calls.push({ url, body, options })
      return success(url.endsWith('/preview') ? preview : result)
    },
  })
  assert.deepEqual(await api.preview(request), preview)
  assert.deepEqual(await api.change(request), result)
  assert.deepEqual(calls, [
    {
      url: '/api/subscription/subscriptions/setting-changes/preview',
      body: request,
      options: { skipAuthRetry: true },
    },
    {
      url: '/api/subscription/subscriptions/setting-changes',
      body: request,
      options: { skipAuthRetry: true },
    },
  ])
})

test('설정 변경 결과의 계약 누락과 상태 충돌 오류를 보존한다', async () => {
  const invalid = createSettingChangeApi({
    post: async () => success({ effectiveStartDate: '2026-09-14' }),
  })
  await assert.rejects(invalid.preview(request), /미리보기 응답을 확인할 수 없습니다/)
  const conflict = createSettingChangeApi({
    post: async () => {
      throw {
        response: {
          status: 409,
          data: { code: 'SUBSCRIPTION_004', message: '변경 처리 중입니다.' },
        },
      }
    },
  })
  await assert.rejects(
    conflict.change(request),
    (error) => error.status === 409 && error.code === 'SUBSCRIPTION_004',
  )
})
