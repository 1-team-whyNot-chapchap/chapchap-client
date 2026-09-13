import test from 'node:test'
import assert from 'node:assert/strict'
import { createPaymentMethodApi } from './paymentMethodApi.js'

const id = '550e8400-e29b-41d4-a716-446655440000'
const method = {
  paymentMethodId: id,
  cardCompany: '현대카드',
  maskedCardNumber: '****-****-****-1234',
  isCurrent: true,
}
const ok = (data) => ({ status: 200, data: { code: '00', data } })

test('결제수단 목록·등록·현재 선택·삭제는 Gateway 계약과 쓰기 재시도 제외를 사용한다', async () => {
  const calls = []
  const api = createPaymentMethodApi({
    get: async (url) => {
      calls.push(['get', url])
      return ok({ paymentMethods: [method] })
    },
    post: async (url, data, options) => {
      calls.push(['post', url, data, options])
      return ok(method)
    },
    patch: async (url, data, options) => {
      calls.push(['patch', url, data, options])
      return ok({ paymentMethodId: id, isCurrent: true })
    },
    delete: async (url, options) => {
      calls.push(['delete', url, options])
      return ok({ paymentMethodId: id })
    },
  })

  assert.deepEqual(await api.list(), [method])
  assert.deepEqual(await api.register('billing-key-only-in-memory'), method)
  await api.selectCurrent(id)
  await api.remove(id)
  assert.deepEqual(calls, [
    ['get', '/api/subscription/payment-methods'],
    [
      'post',
      '/api/subscription/payment-methods',
      { billingKey: 'billing-key-only-in-memory' },
      { skipAuthRetry: true },
    ],
    [
      'patch',
      `/api/subscription/payment-methods/${id}/current`,
      undefined,
      { skipAuthRetry: true },
    ],
    ['delete', `/api/subscription/payment-methods/${id}`, { skipAuthRetry: true }],
  ])
})

test('빌링키 누락·잘못된 UUID·서버 오류를 성공으로 처리하지 않는다', async () => {
  const api = createPaymentMethodApi({ post: async () => ok(method) })
  await assert.rejects(api.register(''), /카드 등록 결과/)
  await assert.rejects(api.remove('local-id'), /올바른 결제수단/)

  const conflict = createPaymentMethodApi({
    post: async () => {
      throw { response: { status: 409, data: { code: 'PAYMENT_004', message: '상태 충돌' } } }
    },
  })
  await assert.rejects(
    conflict.register('billing-key-only-in-memory'),
    (error) => error.status === 409 && error.code === 'PAYMENT_004',
  )
})
