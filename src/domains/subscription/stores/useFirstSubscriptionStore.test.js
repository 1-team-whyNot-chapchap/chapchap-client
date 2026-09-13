import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createFirstSubscriptionStore } from './useFirstSubscriptionStore.js'

test('플랜 변경은 이전 신청 상태를 초기화하고 배송 조건 변경은 견적을 무효화한다', () => {
  setActivePinia(createPinia())
  const store = createFirstSubscriptionStore({}, 'first-subscription-state-test')()
  store.begin('plan-a')
  store.setDeliveryWeekdays(['MONDAY', 'WEDNESDAY'])
  store.preview = { paymentAmount: 10000 }
  store.updateDeliveryCondition('MONDAY', { mealQuantity: 2 })
  assert.equal(store.preview, null)
  assert.deepEqual(
    store.deliveryConditions.map((item) => item.weekday),
    ['MONDAY', 'WEDNESDAY'],
  )
  store.begin('plan-b')
  assert.equal(store.planId, 'plan-b')
  assert.deepEqual(store.deliveryConditions, [])
})

test('약관 동의는 화면에 조회된 모든 필수 약관 버전을 전송한다', async () => {
  const calls = []
  setActivePinia(createPinia())
  const store = createFirstSubscriptionStore(
    {
      getRequiredTerms: async () => [
        { termsType: 'SERVICE', title: '서비스', content: '내용', version: '1' },
        { termsType: 'PRIVACY', title: '개인정보', content: '내용', version: '3' },
      ],
      agreeRequiredTerms: async (term) => calls.push(term),
    },
    'first-subscription-terms-test',
  )()
  await store.fetchRequiredTerms()
  store.setTermAgreement('SERVICE', true)
  store.setTermAgreement('PRIVACY', true)
  await store.agreeRequiredTerms()
  assert.deepEqual(calls, [
    { termsType: 'SERVICE', version: '1' },
    { termsType: 'PRIVACY', version: '3' },
  ])
})

function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function previewStore(api) {
  setActivePinia(createPinia())
  return createFirstSubscriptionStore(api, 'preview-lifecycle-test')()
}

test('카드 조회 없이 예상 금액을 조회하고 신청 조건과 약관 동의를 유지한다', async () => {
  const calls = []
  const quote = { paymentAmount: 72520 }
  const store = previewStore({
    preview: async (request) => {
      calls.push(request)
      return quote
    },
  })
  store.begin('plan-a')
  store.setDeliveryWeekdays(['TUESDAY', 'THURSDAY'])
  store.setTermAgreement('SERVICE', true)
  const conditions = JSON.stringify(store.deliveryConditions)
  const request = { planId: store.planId, deliveryConditions: store.deliveryConditions }
  assert.deepEqual(await store.requestPreview(request), quote)
  assert.deepEqual(calls, [request])
  assert.equal(store.previewStatus, 'success')
  assert.equal(JSON.stringify(store.deliveryConditions), conditions)
  assert.equal(store.agreedTerms.SERVICE, true)
  assert.equal(store.result, null)
  assert.equal(store.submitStatus, 'idle')
})

test('재조회 중에는 이전 금액을 비우고 실패 후 재시도할 수 있다', async () => {
  const pending = deferred()
  let calls = 0
  const store = previewStore({
    preview: () => (++calls === 1 ? pending.promise : Promise.resolve({ paymentAmount: 20000 })),
  })
  store.preview = { paymentAmount: 10000 }
  store.previewStatus = 'success'
  const result = store.requestPreview({})
  assert.equal(store.preview, null)
  assert.equal(store.previewStatus, 'loading')
  pending.reject(new Error('조회 실패'))
  assert.equal(await result, null)
  assert.equal(store.previewStatus, 'error')
  assert.equal(store.preview, null)
  assert.equal((await store.requestPreview({})).paymentAmount, 20000)
  assert.equal(store.error, null)
})

test('이전 견적 응답이 늦게 도착해도 새 견적을 덮어쓰지 않는다', async () => {
  const old = deferred()
  let calls = 0
  const store = previewStore({
    preview: () => (++calls === 1 ? old.promise : Promise.resolve({ paymentAmount: 20000 })),
  })
  const first = store.requestPreview({})
  await store.requestPreview({})
  old.resolve({ paymentAmount: 10000 })
  assert.equal(await first, null)
  assert.equal(store.preview.paymentAmount, 20000)
  assert.equal(store.previewStatus, 'success')
})

for (const [label, invalidate] of [
  ['이전 단계 이동·화면 이탈', (store) => store.invalidatePreview()],
  ['배송 요일 변경', (store) => store.setDeliveryWeekdays(['TUESDAY'])],
  [
    '수량·배송지·시간 변경',
    (store) => store.updateDeliveryCondition('MONDAY', { mealQuantity: 3 }),
  ],
  ['약관 동의 변경', (store) => store.setTermAgreement('SERVICE', false)],
  ['로그아웃 초기화', (store) => store.$reset()],
  ['플랜 변경', (store) => store.begin('plan-b')],
]) {
  test(`${label} 후 이전 견적의 성공 응답을 사용하지 않는다`, async () => {
    const pending = deferred()
    const store = previewStore({ preview: () => pending.promise })
    store.begin('plan-a')
    store.setDeliveryWeekdays(['MONDAY'])
    const result = store.requestPreview({})
    invalidate(store)
    pending.resolve({ paymentAmount: 10000 })
    assert.equal(await result, null)
    assert.equal(store.preview, null)
    assert.equal(store.previewStatus, 'idle')
  })
}

test('폐기된 견적의 실패 응답도 최신 화면에 오류를 남기지 않는다', async () => {
  const pending = deferred()
  const store = previewStore({ preview: () => pending.promise })
  const result = store.requestPreview({})
  store.invalidatePreview()
  pending.reject(new Error('이전 요청 실패'))
  assert.equal(await result, null)
  assert.equal(store.error, null)
  assert.equal(store.previewStatus, 'idle')
})
