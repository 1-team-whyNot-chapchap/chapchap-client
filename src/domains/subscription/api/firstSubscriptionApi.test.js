import test from 'node:test'
import assert from 'node:assert/strict'
import { createFirstSubscriptionApi } from './firstSubscriptionApi.js'

const request = {
  planId: '550e8400-e29b-41d4-a716-446655440000',
  deliveryConditions: [
    {
      weekday: 'MONDAY',
      mealQuantity: 2,
      addressId: '660e8400-e29b-41d4-a716-446655440000',
      deliveryTimeSlot: 'TIME_1100_1300',
    },
  ],
}
const success = (data) => ({ status: 200, data: { code: '00', data } })

test('필수 약관, 견적, 신청은 Gateway 계약 경로와 명시적 재시도 차단을 사용한다', async () => {
  const calls = []
  const api = createFirstSubscriptionApi({
    get: async (url) => {
      calls.push({ method: 'get', url })
      return success([
        {
          termsType: 'SUBSCRIPTION_SERVICE_TERMS',
          title: '구독 약관',
          content: '전문',
          version: '1',
        },
      ])
    },
    post: async (url, body, config) => {
      calls.push({ method: 'post', url, body, config })
      if (url.endsWith('/preview'))
        return success({
          periodStartDate: '2026-10-01',
          periodEndDate: '2026-10-28',
          totalMealAmount: 10000,
          totalDeliveryFee: 3000,
          totalDiscountAmount: 0,
          paymentAmount: 13000,
        })
      if (url.endsWith('/subscriptions'))
        return success({
          subscriptionId: '770e8400-e29b-41d4-a716-446655440000',
          subscriptionStatus: 'SCHEDULED',
          periodStartDate: '2026-10-01',
          periodEndDate: '2026-10-28',
        })
      return success({ termsType: body.termsType, version: body.version })
    },
  })

  await api.getRequiredTerms()
  await api.agreeRequiredTerms({ termsType: 'SUBSCRIPTION_SERVICE_TERMS', version: '1' })
  await api.preview(request)
  await api.subscribe(request)
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      '/api/subscription/terms/required',
      '/api/subscription/terms/agreements',
      '/api/subscription/subscriptions/preview',
      '/api/subscription/subscriptions',
    ],
  )
  assert.deepEqual(
    calls.slice(1).map((call) => call.config),
    Array.from({ length: 3 }, () => ({ skipAuthRetry: true })),
  )
  assert.equal('paymentMethodId' in calls[2].body, false)
  assert.equal('paymentMethodId' in calls[3].body, false)
})
