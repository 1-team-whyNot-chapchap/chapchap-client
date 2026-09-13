import test from 'node:test'
import assert from 'node:assert/strict'
import { createCancellationApi } from './cancellationApi.js'

const result = {
  cancellationType: 'CANCELLATION_BEFORE_START',
  subscriptionStatus: 'CANCELED_BEFORE_START',
  periodStatus: 'CANCELED_BEFORE_START',
  cancellationRequestedAt: '2026-09-13T10:30:00',
  refund: {
    refundId: '550e8400-e29b-41d4-a716-446655440000',
    status: 'COMPLETED',
    requestedAmount: 17800,
    refundedAmount: 17800,
    unprocessedAmount: 0,
  },
}
const success = (data) => ({ status: 200, data: { code: '00', message: 'SUCCESS', data } })

test('구독 해지는 Gateway DELETE 경로와 재시도 제외 옵션을 사용한다', async () => {
  const calls = []
  const api = createCancellationApi({
    delete: async (url, options) => {
      calls.push({ url, options })
      return success(result)
    },
  })

  assert.deepEqual(await api.cancel(), result)
  assert.deepEqual(calls, [
    { url: '/api/subscription/subscriptions', options: { skipAuthRetry: true } },
  ])
})

test('구독 해지 결과 계약 누락과 서버 오류를 보존한다', async () => {
  const invalid = createCancellationApi({ delete: async () => success({ refund: null }) })
  await assert.rejects(invalid.cancel(), /구독 해지 결과 응답을 확인할 수 없습니다/)

  const conflict = createCancellationApi({
    delete: async () => {
      throw {
        response: {
          status: 409,
          data: { code: 'SUBSCRIPTION_005', message: '현재 상태에서는 해지할 수 없습니다.' },
        },
      }
    },
  })
  await assert.rejects(
    conflict.cancel(),
    (error) => error.status === 409 && error.code === 'SUBSCRIPTION_005',
  )
})
