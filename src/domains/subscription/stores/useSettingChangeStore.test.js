import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createSettingChangeStore } from './useSettingChangeStore.js'

const subscription = {
  effectiveStartDate: '2026-09-14',
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

test('변경 기준으로 입력을 초기화하고 미리보기 성공 상태를 보관한다', async () => {
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
  store.initialize(subscription)
  store.preview = { effectiveStartDate: subscription.effectiveStartDate }
  assert.equal(await store.submit(request), null)
  assert.equal(store.submitStatus, 'error')
  assert.equal(store.error, error)
})

test('미래 확정 기준을 조회하고 편집값과 분리하며 완료 후 다시 조회한다', async () => {
  setActivePinia(createPinia())
  let count = 0
  const store = createSettingChangeStore(
    {
      baseline: async () => {
        count++
        return subscription
      },
    },
    'baseline-success',
  )()
  await store.fetchBaseline()
  store.updateDeliveryCondition('MONDAY', { mealQuantity: 3 })
  assert.equal(store.baseline.deliveryConditions[0].mealQuantity, 2)
  assert.equal(store.deliveryConditions[0].mealQuantity, 3)
  await store.fetchBaseline()
  assert.equal(count, 2)
  assert.equal(store.deliveryConditions[0].mealQuantity, 2)
})

test('기준 조회 실패 시 기존 기준으로 진행하지 않고 재시도로 복구한다', async () => {
  setActivePinia(createPinia())
  let fail = true
  const store = createSettingChangeStore(
    {
      baseline: async () => {
        if (fail) throw new Error('조회 실패')
        return subscription
      },
    },
    'baseline-error',
  )()
  assert.equal(await store.fetchBaseline(), null)
  assert.equal(store.baselineStatus, 'error')
  assert.equal(await store.requestPreview(request), null)
  fail = false
  assert.deepEqual(await store.fetchBaseline(), subscription)
})

test('적용일 경계에서 입력은 보존하되 이전 기준의 견적과 실행을 차단한다', async () => {
  setActivePinia(createPinia())
  const store = createSettingChangeStore(
    { preview: async () => ({ effectiveStartDate: '2026-09-15' }) },
    'baseline-date',
  )()
  store.initialize(subscription)
  store.updateDeliveryCondition('MONDAY', { mealQuantity: 3 })
  assert.equal(await store.requestPreview(request), null)
  assert.equal(store.baselineNeedsRefresh, true)
  assert.equal(store.deliveryConditions[0].mealQuantity, 3)
  assert.equal(store.preview, null)
  assert.equal(await store.submit(request), null)
})

test('계정 초기화 이후 늦게 도착한 기준 응답을 버린다', async () => {
  setActivePinia(createPinia())
  let finish
  const store = createSettingChangeStore(
    {
      baseline: () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    },
    'baseline-reset',
  )()
  const pending = store.fetchBaseline()
  store.$reset()
  finish(subscription)
  assert.equal(await pending, null)
  assert.equal(store.baseline, null)
  assert.deepEqual(store.deliveryConditions, [])
})

test('계정 초기화 이후 늦은 미리보기 응답도 복원하지 않는다', async () => {
  setActivePinia(createPinia())
  let finish
  const store = createSettingChangeStore(
    {
      preview: () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    },
    'preview-reset',
  )()
  store.initialize(subscription)
  const pending = store.requestPreview(request)
  store.$reset()
  finish({ effectiveStartDate: subscription.effectiveStartDate })
  assert.equal(await pending, null)
  assert.equal(store.preview, null)
})
