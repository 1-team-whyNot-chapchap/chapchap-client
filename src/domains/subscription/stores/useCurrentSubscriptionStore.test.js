import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createCurrentSubscriptionStore } from './useCurrentSubscriptionStore.js'
import { createOrderStore } from './useOrderStore.js'

for (const failingPart of ['subscription', 'orders']) {
  test(`${failingPart} 조회가 실패해도 다른 요약 데이터는 성공 상태를 유지한다`, async () => {
    setActivePinia(createPinia())
    const subscriptionStore = createCurrentSubscriptionStore({
      getCurrentSubscription: async () => {
        if (failingPart === 'subscription') throw new Error('temporary')
        return subscription
      },
    })()
    const orderStore = createOrderStore(
      {
        listOrders: async () => {
          if (failingPart === 'orders') throw new Error('temporary')
          return [{ orderId: '550e8400-e29b-41d4-a716-446655440000' }]
        },
      },
      null,
    )()
    await Promise.all([
      subscriptionStore.fetchCurrentSubscription(true),
      orderStore.fetchOrders(true),
    ])
    assert.equal(subscriptionStore.status, failingPart === 'subscription' ? 'error' : 'success')
    assert.equal(orderStore.listStatus, failingPart === 'orders' ? 'error' : 'success')
  })
}

function deferred() {
  let resolve, reject
  const promise = new Promise((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}

for (const fails of [false, true]) {
  test(`초기화 전 구독 응답(${fails ? '실패' : '성공'})은 새 계정 상태에 반영되지 않는다`, async () => {
    setActivePinia(createPinia())
    const old = deferred()
    let calls = 0
    const store = createCurrentSubscriptionStore({
      getCurrentSubscription: () => (++calls === 1 ? old.promise : Promise.resolve(null)),
    })()
    const pending = store.fetchCurrentSubscription()
    store.$reset()
    await store.fetchCurrentSubscription()
    if (fails) old.reject(new Error('old account'))
    else old.resolve(subscription)
    await pending
    assert.equal(store.status, 'empty')
    assert.equal(store.subscription, null)
    assert.equal(store.error, null)
  })
}

test('마이페이지 강제 재조회는 기존 구독 없음 캐시를 갱신하고 뒤늦은 요청을 무시한다', async () => {
  setActivePinia(createPinia())
  const old = deferred()
  let calls = 0
  const store = createCurrentSubscriptionStore({
    getCurrentSubscription: () => {
      calls++
      return calls === 1
        ? Promise.resolve(null)
        : calls === 2
          ? old.promise
          : Promise.resolve(subscription)
    },
  })()
  await store.fetchCurrentSubscription()
  const pending = store.fetchCurrentSubscription(true)
  await store.fetchCurrentSubscription(true)
  old.resolve(null)
  await pending
  assert.equal(store.subscription.subscriptionId, subscription.subscriptionId)
  assert.equal(store.status, 'success')
})

test('구독 조회 실패 이후 재시도 성공 시 오류를 지운다', async () => {
  setActivePinia(createPinia())
  let calls = 0
  const store = createCurrentSubscriptionStore({
    getCurrentSubscription: async () => {
      if (++calls === 1) throw new Error('temporary')
      return subscription
    },
  })()
  await store.fetchCurrentSubscription()
  assert.equal(store.status, 'error')
  await store.fetchCurrentSubscription(true)
  assert.equal(store.status, 'success')
  assert.equal(store.error, null)
})

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
