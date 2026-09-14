import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { createPaymentRefundHistoryStore } from './usePaymentRefundHistoryStore.js'

test('목록 진입과 상세 복귀를 감시하는 컴포넌트는 강제 재조회를 요청한다', () => {
  const component = readFileSync(
    new URL('../components/PaymentRefundHistory.vue', import.meta.url),
    'utf8',
  )
  assert.match(component, /\(\) => \[props\.kind, props\.detail, routeId\.value\]/)
  assert.match(component, /else if \(!detail\) config\.value\.loadList\(true\)/)
  assert.match(component, /\{ immediate: true \}/)
})

for (const [label, method, apiMethod, list, status, errorKey] of [
  ['결제', 'fetchPayments', 'listPayments', 'payments', 'paymentListStatus', 'paymentListError'],
  ['환불', 'fetchRefunds', 'listRefunds', 'refunds', 'refundListStatus', 'refundListError'],
]) {
  test(`${label} 재조회는 이전 성공 결과를 교체하고 진행 중 요청은 중복하지 않는다`, async () => {
    setActivePinia(createPinia())
    let calls = 0
    let resolveNext
    const store = createPaymentRefundHistoryStore({
      [apiMethod]: async () => {
        calls += 1
        if (calls === 1) return [{ id: 'first' }]
        return new Promise((resolve) => {
          resolveNext = resolve
        })
      },
    })()
    await store[method]()
    await store[method]()
    assert.equal(calls, 1)
    const pending = store[method](true)
    assert.equal(store[status], 'loading')
    await store[method](true)
    assert.equal(calls, 2)
    resolveNext([{ id: 'second' }, { id: 'first' }])
    await pending
    assert.equal(store[status], 'success')
    assert.deepEqual(store[list], [{ id: 'second' }, { id: 'first' }])
  })

  test(`${label} 재조회 실패를 성공으로 숨기지 않고 재시도로 복구한다`, async () => {
    setActivePinia(createPinia())
    let calls = 0
    const failure = new Error('temporary failure')
    const store = createPaymentRefundHistoryStore({
      [apiMethod]: async () => {
        calls += 1
        if (calls === 2) throw failure
        return calls === 1 ? [{ id: 'old' }] : []
      },
    })()
    await store[method]()
    await store[method](true)
    assert.equal(store[status], 'error')
    assert.equal(store[errorKey], failure)
    await store[method](true)
    assert.equal(store[status], 'success')
    assert.equal(store[errorKey], null)
    assert.deepEqual(store[list], [])
  })
}

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
