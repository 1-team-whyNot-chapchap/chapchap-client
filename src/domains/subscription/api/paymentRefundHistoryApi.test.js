import test from 'node:test'
import assert from 'node:assert/strict'
import { createPaymentRefundHistoryApi } from './paymentRefundHistoryApi.js'

const paymentId = '550e8400-e29b-41d4-a716-446655440000'
const refundId = '119ec1f0-1aa5-4a6e-bca1-865d83a23f15'
const ok = (data) => ({ status: 200, data: { code: '00', data } })
const payment = {
  paymentId,
  paymentType: 'REGULAR_PAYMENT',
  status: 'SUCCESS',
  amount: 32700,
  occurredAt: '2026-09-13T10:30:00',
}
const refund = {
  refundId,
  refundType: 'CANCELLATION_BEFORE_START',
  status: 'COMPLETED',
  requestedAmount: 32700,
  refundedAmount: 32700,
  unprocessedAmount: 0,
  requestedAt: '2026-09-13T10:30:00',
  completedAt: '2026-09-13T10:30:01',
}

test('결제·환불 목록과 UUID 상세 경로를 조회한다', async () => {
  const paths = []
  const api = createPaymentRefundHistoryApi({
    get: async (path) => {
      paths.push(path)
      if (path === '/api/subscription/payments') return ok({ payments: [payment] })
      if (path === `/api/subscription/payments/${paymentId}`)
        return ok({
          ...payment,
          originalPaymentAmount: 98100,
          cumulativeCancelAmount: 32700,
          cancelableAmount: 65400,
          periodStartDate: '2026-09-14',
          periodEndDate: '2026-10-11',
          attempts: [],
        })
      if (path === '/api/subscription/refunds') return ok({ refunds: [refund] })
      return ok({ ...refund, cancellations: [] })
    },
  })

  assert.deepEqual(await api.listPayments(), [payment])
  assert.equal((await api.getPayment(paymentId)).paymentId, paymentId)
  assert.deepEqual(await api.listRefunds(), [refund])
  assert.equal((await api.getRefund(refundId)).refundId, refundId)
  assert.deepEqual(paths, [
    '/api/subscription/payments',
    `/api/subscription/payments/${paymentId}`,
    '/api/subscription/refunds',
    `/api/subscription/refunds/${refundId}`,
  ])
})

test('빈 목록은 유지하고 잘못된 목록·상세 UUID·서버 오류는 실패로 보존한다', async () => {
  const empty = createPaymentRefundHistoryApi({
    get: async (path) => ok(path.endsWith('payments') ? { payments: [] } : { refunds: [] }),
  })
  assert.deepEqual(await empty.listPayments(), [])
  assert.deepEqual(await empty.listRefunds(), [])

  const invalid = createPaymentRefundHistoryApi({ get: async () => ok({ payments: [{}] }) })
  await assert.rejects(invalid.listPayments(), /결제 내역 응답/)
  await assert.rejects(invalid.getPayment('not-a-uuid'), /올바른 결제 내역/)

  const missing = createPaymentRefundHistoryApi({
    get: async () => {
      throw { response: { status: 404, data: { code: 'PAYMENT_HISTORY_NOT_FOUND' } } }
    },
  })
  await assert.rejects(
    missing.getPayment(paymentId),
    (error) => error.status === 404 && error.code === 'PAYMENT_HISTORY_NOT_FOUND',
  )
})
