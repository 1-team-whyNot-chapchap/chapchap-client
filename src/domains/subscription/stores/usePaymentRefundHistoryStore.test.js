import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createPaymentRefundHistoryStore } from './usePaymentRefundHistoryStore.js'

test('결제·환불 목록의 빈 결과와 상세 오류 상태를 구분한다', async () => {
  setActivePinia(createPinia())
  const detailError = new Error('not found')
  const store = createPaymentRefundHistoryStore(
    {
      listPayments: async () => [],
      listRefunds: async () => [],
      getPayment: async () => Promise.reject(detailError),
      getRefund: async () => ({ refundId: 'refund' }),
    },
    'payment-refund-history-test',
  )()

  await store.fetchPayments()
  await store.fetchRefunds()
  await store.fetchPayment('payment')
  await store.fetchRefund('refund')

  assert.deepEqual(store.payments, [])
  assert.deepEqual(store.refunds, [])
  assert.equal(store.paymentListStatus, 'success')
  assert.equal(store.refundListStatus, 'success')
  assert.equal(store.paymentDetailStatus, 'error')
  assert.equal(store.paymentDetailError, detailError)
  assert.equal(store.refundDetailStatus, 'success')
})
