import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createSettingChangeStore } from './useSettingChangeStore.js'

const subscription = {
  plan: { planId: '550e8400-e29b-41d4-a716-446655440000' },
  deliveryConditions: [
    {
      weekday: 'MONDAY',
      mealQuantity: 2,
      address: { addressId: '550e8400-e29b-41d4-a716-446655440001' },
      deliveryTimeSlot: 'TIME_1100_1300',
    },
  ],
}
const request = {
  planId: subscription.plan.planId,
  deliveryConditions: [
    {
      weekday: 'MONDAY',
      mealQuantity: 2,
      addressId: subscription.deliveryConditions[0].address.addressId,
      deliveryTimeSlot: 'TIME_1100_1300',
    },
  ],
}

test('현재 구독으로 변경 입력을 초기화하고 미리보기 성공 상태를 보관한다', async () => {
  setActivePinia(createPinia())
  const preview = { effectiveStartDate: '2026-09-14' }
  const store = createSettingChangeStore(
    {
      preview: async (value) => {
        assert.deepEqual(value, request)
        return preview
      },
    },
    'setting-change-success-test',
  )()
  assert.equal(store.initialize(subscription), true)
  assert.deepEqual(store.deliveryConditions, request.deliveryConditions)
  assert.deepEqual(await store.requestPreview(request), preview)
  assert.equal(store.previewStatus, 'success')
})

test('최종 실행은 중복 요청을 막고 실패 오류를 보존한다', async () => {
  setActivePinia(createPinia())
  const error = new Error('conflict')
  const store = createSettingChangeStore(
    { change: async () => Promise.reject(error) },
    'setting-change-error-test',
  )()
  assert.equal(await store.submit(request), null)
  assert.equal(store.submitStatus, 'error')
  assert.equal(store.error, error)
})
