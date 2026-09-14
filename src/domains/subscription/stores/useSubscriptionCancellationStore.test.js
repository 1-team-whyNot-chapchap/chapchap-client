import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createSubscriptionCancellationStore } from './useSubscriptionCancellationStore.js'

const result = {
  cancellationType: 'REGULAR_CANCELLATION',
  subscriptionStatus: 'CANCELLATION_SCHEDULED',
  periodStatus: 'IN_PROGRESS',
  cancellationRequestedAt: '2026-09-13T10:30:00',
  refund: null,
}

test('해지 성공 결과를 보관하고 처리 중 중복 요청을 막는다', async () => {
  setActivePinia(createPinia())
  let resolve
  let calls = 0
  const store = createSubscriptionCancellationStore(
    {
      cancel: () => {
        calls += 1
        return new Promise((done) => {
          resolve = done
        })
      },
    },
    'subscription-cancellation-success-test',
  )()

  const first = store.cancel()
  assert.equal(await store.cancel(), null)
  assert.equal(calls, 1)
  resolve(result)
  assert.deepEqual(await first, result)
  assert.equal(store.status, 'success')
})

test('해지 실패 오류를 보존한다', async () => {
  setActivePinia(createPinia())
  const error = new Error('conflict')
  const store = createSubscriptionCancellationStore(
    { cancel: async () => Promise.reject(error) },
    'subscription-cancellation-error-test',
  )()

  assert.equal(await store.cancel(), null)
  assert.equal(store.status, 'error')
  assert.equal(store.error, error)
})
