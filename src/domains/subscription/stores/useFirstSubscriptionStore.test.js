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
  assert.equal(store.termsConfirmed, true)
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

test('직접 진입 안내는 목적지에 한 번 전달되고 다음 이동부터 해제된다', () => {
  const store = previewStore({})
  store.enterStep(5)
  store.setError(new Error('요일을 선택해 주세요'), 1, 'redirect')
  store.enterStep(null)
  assert.equal(store.errorKind, 'redirect')
  store.enterStep(1)
  assert.equal(store.errorStep, 1)
  assert.equal(store.errorKind, 'validation')
  store.enterStep(2)
  assert.equal(store.error, null)
  store.enterStep(1)
  assert.equal(store.error, null)
})

for (const outcome of ['resolve', 'reject']) {
  test(`단계 이동 후 약관의 늦은 ${outcome} 응답은 재조회 결과와 현재 안내를 덮어쓰지 않는다`, async () => {
    const pending = deferred()
    let reads = 0
    const store = previewStore({
      getRequiredTerms: () =>
        ++reads === 1 ? pending.promise : Promise.resolve([{ termsType: 'NEW', version: '2' }]),
    })
    store.enterStep(4)
    const old = store.fetchRequiredTerms()
    store.enterStep(3)
    assert.equal(store.termsStatus, 'idle')
    store.enterStep(4)
    await store.fetchRequiredTerms()
    store.setError(new Error('새 화면 안내'), 4, 'validation')
    pending[outcome](outcome === 'resolve' ? [{ termsType: 'OLD' }] : new Error('old'))
    await old
    assert.equal(store.requiredTerms[0].termsType, 'NEW')
    assert.equal(store.termsStatus, 'success')
    assert.equal(store.error.message, '새 화면 안내')
  })
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

test('같은 플랜 복귀는 입력·동의를 보존하고 화면 이탈은 견적만 비운다', async () => {
  const store = previewStore({
    getRequiredTerms: async () => [{ termsType: 'SERVICE', version: '1' }],
    agreeRequiredTerms: async () => {},
  })
  store.begin('plan-a')
  store.setDeliveryWeekdays(['MONDAY'])
  store.updateDeliveryCondition('MONDAY', {
    addressId: 'address-a',
    mealQuantity: 3,
    deliveryTimeSlot: 'TIME_1700_1900',
  })
  await store.fetchRequiredTerms()
  store.setTermAgreement('SERVICE', true)
  await store.agreeRequiredTerms()
  const state = JSON.stringify(store.deliveryConditions)
  store.preview = { paymentAmount: 10000 }
  store.invalidatePreview()
  store.begin('plan-a')
  assert.equal(JSON.stringify(store.deliveryConditions), state)
  assert.equal(store.termsConfirmed, true)
  assert.equal(store.preview, null)
  store.$reset()
  assert.equal(store.planId, '')
  assert.deepEqual(store.deliveryConditions, [])
  assert.deepEqual(store.agreedTerms, {})
  assert.equal(store.termsConfirmed, false)
})

for (const reset of ['logout', 'plan-change']) {
  for (const outcome of ['resolve', 'reject']) {
    test(`${reset} 후 약관 조회의 늦은 ${outcome} 응답을 폐기한다`, async () => {
      const pending = deferred()
      const store = previewStore({ getRequiredTerms: () => pending.promise })
      store.begin('plan-a')
      const request = store.fetchRequiredTerms()
      if (reset === 'logout') store.$reset()
      else store.begin('plan-b')
      pending[outcome](
        outcome === 'resolve' ? [{ termsType: 'OLD', version: '1' }] : new Error('old'),
      )
      assert.deepEqual(await request, [])
      assert.deepEqual(store.requiredTerms, [])
      assert.equal(store.termsStatus, 'idle')
      assert.equal(store.error, null)
    })
  }
}

test('일부 약관 동의 실패는 완료로 표시하지 않고 재시도 성공 시에만 확정한다', async () => {
  let fail = true
  const store = previewStore({
    getRequiredTerms: async () => [
      { termsType: 'A', version: '1' },
      { termsType: 'B', version: '1' },
    ],
    agreeRequiredTerms: async (term) => {
      if (fail && term.termsType === 'B') throw new Error('failed')
    },
  })
  await store.fetchRequiredTerms()
  store.setTermAgreement('A', true)
  store.setTermAgreement('B', true)
  assert.equal(store.termsConfirmed, false)
  await assert.rejects(store.agreeRequiredTerms(), /failed/)
  assert.equal(store.termsConfirmed, false)
  fail = false
  assert.equal(await store.agreeRequiredTerms(), true)
  store.setTermAgreement('B', false)
  assert.equal(store.termsConfirmed, false)
})

for (const reset of ['logout', 'plan-change', 'uncheck']) {
  test(`${reset} 후 늦은 약관 동의 성공이 신청을 다시 진행시키지 않는다`, async () => {
    const pending = deferred()
    const store = previewStore({
      getRequiredTerms: async () => [{ termsType: 'A', version: '1' }],
      agreeRequiredTerms: () => pending.promise,
    })
    store.begin('plan-a')
    await store.fetchRequiredTerms()
    store.setTermAgreement('A', true)
    const request = store.agreeRequiredTerms()
    if (reset === 'logout') store.$reset()
    else if (reset === 'plan-change') store.begin('plan-b')
    else store.setTermAgreement('A', false)
    pending.resolve()
    assert.equal(await request, false)
    assert.equal(store.termsConfirmed, false)
  })
}

test('필수 약관이 비어 있으면 오류로 처리하고 재조회할 수 있다', async () => {
  let terms = []
  const store = previewStore({ getRequiredTerms: async () => terms })
  await store.fetchRequiredTerms()
  assert.equal(store.termsStatus, 'error')
  terms = [{ termsType: 'A', version: '1' }]
  await store.fetchRequiredTerms(true)
  assert.equal(store.termsStatus, 'success')
  assert.equal(store.termsConfirmed, false)
})

for (const outcome of ['resolve', 'reject']) {
  test(`초기화 후 이전 신청의 늦은 ${outcome} 응답도 다음 계정 상태에 남기지 않는다 (모의 API)`, async () => {
    const pending = deferred()
    const store = previewStore({ subscribe: () => pending.promise })
    store.begin('plan-a')
    const request = store.submit({})
    store.$reset()
    pending[outcome](outcome === 'resolve' ? { subscriptionId: 'old' } : new Error('old'))
    assert.equal(await request, null)
    assert.equal(store.result, null)
    assert.equal(store.submitStatus, 'idle')
    assert.equal(store.error, null)
  })
}
