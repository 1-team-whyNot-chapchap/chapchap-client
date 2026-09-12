import test from 'node:test'
import assert from 'node:assert/strict'
import { createCurrentSubscriptionApi } from './currentSubscriptionApi.js'

const subscription = {
  subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
  subscriptionStatus: 'IN_PROGRESS',
  periodStartDate: '2026-09-14',
  periodEndDate: '2026-10-11',
  cancellationRequestedAt: null,
  plan: { planId: '4bb90ac5-9e29-446e-aee6-26b7c8780ca2', name: '간편식' },
  deliveryConditions: [],
}

test('현재 구독 조회는 Gateway 경로와 구독 응답을 사용한다', async () => {
  const calls = []
  const api = createCurrentSubscriptionApi({
    get: async (url) => {
      calls.push(url)
      return { status: 200, data: { code: '00', message: 'SUCCESS', data: subscription } }
    },
  })

  assert.deepEqual(await api.getCurrentSubscription(), subscription)
  assert.deepEqual(calls, ['/api/subscription/subscriptions'])
})

test('구독이 없는 200 응답은 오류가 아닌 null로 반환한다', async () => {
  const api = createCurrentSubscriptionApi({
    get: async () => ({ status: 200, data: { code: '00', message: 'SUCCESS', data: null } }),
  })

  assert.equal(await api.getCurrentSubscription(), null)
})

test('응답 모양이 잘못되면 오류로 처리한다', async () => {
  const api = createCurrentSubscriptionApi({
    get: async () => ({ status: 200, data: { code: '00', message: 'SUCCESS', data: {} } }),
  })

  await assert.rejects(api.getCurrentSubscription(), (error) => {
    assert.equal(error.status, 200)
    return true
  })
})

test('인증 오류의 HTTP 상태와 서버 코드를 보존한다', async () => {
  const api = createCurrentSubscriptionApi({
    get: async () => {
      throw {
        response: {
          status: 401,
          data: { code: 'AUTH_001', message: '인증이 필요합니다.' },
        },
      }
    },
  })

  await assert.rejects(api.getCurrentSubscription(), (error) => {
    assert.equal(error.status, 401)
    assert.equal(error.code, 'AUTH_001')
    return true
  })
})
