import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createPaymentMethodStore } from './usePaymentMethodStore.js'

test('변경 성공 뒤 서버 목록을 다시 읽고 진행 중 중복 요청을 막는다', async () => {
  setActivePinia(createPinia())
  let resolveRegister
  let listCalls = 0
  const store = createPaymentMethodStore(
    {
      list: async () => {
        listCalls += 1
        return [{ paymentMethodId: 'id', isCurrent: true }]
      },
      register: () =>
        new Promise((resolve) => {
          resolveRegister = resolve
        }),
    },
    'payment-method-store-test',
  )()
  const first = store.register('billing-key')
  assert.equal(await store.register('billing-key'), null)
  resolveRegister({ paymentMethodId: 'id' })
  assert.deepEqual(await first, { paymentMethodId: 'id' })
  assert.equal(listCalls, 1)
  assert.equal(store.currentPaymentMethod.paymentMethodId, 'id')
})

test('변경 실패 오류를 보존한다', async () => {
  setActivePinia(createPinia())
  const error = new Error('provider unavailable')
  const store = createPaymentMethodStore(
    { remove: async () => Promise.reject(error) },
    'payment-method-store-error-test',
  )()
  assert.equal(await store.remove('id'), null)
  assert.equal(store.mutationStatus, 'error')
  assert.equal(store.mutationError, error)
})
