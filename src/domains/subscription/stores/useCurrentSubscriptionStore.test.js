import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createCurrentSubscriptionStore } from './useCurrentSubscriptionStore.js'

const subscription = {
  subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
  subscriptionStatus: 'IN_PROGRESS',
  deliveryConditions: [],
}

test('현재 구독이 있으면 success 상태로 저장한다', async () => {
  setActivePinia(createPinia())
  const store = createCurrentSubscriptionStore(
    { getCurrentSubscription: async () => subscription },
    'current-subscription-success-test',
  )()

  assert.deepEqual(await store.fetchCurrentSubscription(), subscription)
  assert.equal(store.status, 'success')
  assert.equal(store.error, null)
})

test('현재 구독이 없으면 empty 상태로 저장한다', async () => {
  setActivePinia(createPinia())
  const store = createCurrentSubscriptionStore(
    { getCurrentSubscription: async () => null },
    'current-subscription-empty-test',
  )()

  assert.equal(await store.fetchCurrentSubscription(), null)
  assert.equal(store.status, 'empty')
})

test('조회 실패는 error 상태와 오류를 보존한다', async () => {
  const error = new Error('network')
  setActivePinia(createPinia())
  const store = createCurrentSubscriptionStore(
    { getCurrentSubscription: async () => Promise.reject(error) },
    'current-subscription-error-test',
  )()

  assert.equal(await store.fetchCurrentSubscription(), null)
  assert.equal(store.status, 'error')
  assert.equal(store.error, error)
})
