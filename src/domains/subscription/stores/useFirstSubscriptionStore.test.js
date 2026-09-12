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
