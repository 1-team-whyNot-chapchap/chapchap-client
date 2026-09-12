import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccountDataApi } from './accountDataApi.js'
const id = '550e8400-e29b-41d4-a716-446655440000'
const ok = (data) => ({ status: 200, data: { code: '00', data } })
test('reads addresses using public UUID and preserves delivery details', async () => {
  const api = createAccountDataApi({
    get: async (path) => {
      assert.equal(path, '/api/subscription/addresses')
      return ok({
        addresses: [
          {
            addressId: id,
            recipientName: '테스트',
            recipientPhone: '010-0000-0000',
            addressLine1: '대구',
            addressLine2: '상세',
            otherDeliveryRequest: '보관',
            isDefault: true,
          },
        ],
      })
    },
  })
  const [row] = await api.addresses()
  assert.equal(row.id, id)
  assert.equal(row.address, '대구')
  assert.equal(row.deliveryRequest, '보관')
  assert.equal(row.addressLine2, '상세')
})
test('missing or failed list envelopes are not presented as empty lists', async () => {
  for (const response of [ok({}), { data: { code: 'DATABASE_ERROR', data: { addresses: [] } } }]) {
    const api = createAccountDataApi({ get: async () => response })
    await assert.rejects(api.addresses())
    await assert.rejects(api.history('payments'))
  }
  assert.deepEqual(
    await createAccountDataApi({ get: async () => ok({ payments: [] }) }).history('payments'),
    [],
  )
})
test('only documented no-subscription response is empty', async () => {
  assert.equal(await createAccountDataApi({ get: async () => ok(null) }).subscription(), null)
  for (const [status, code, empty] of [
    [404, 'SUBSCRIPTION_003', false],
    [404, 'ROUTE_NOT_FOUND', false],
    [503, 'SUBSCRIPTION_003', false],
  ]) {
    const api = createAccountDataApi({
      get: async () => {
        throw { response: { status, data: { code } } }
      },
    })
    if (empty) assert.equal(await api.subscription(), null)
    else await assert.rejects(api.subscription())
  }
})
test('default card writes use the real endpoint without automatic write retry', async () => {
  const calls = []
  const api = createAccountDataApi({
    request: async (arg) => {
      calls.push(arg)
      return ok({ paymentMethodId: id })
    },
  })
  await api.defaultPaymentMethod(id)
  assert.equal(calls[0].url, `/api/subscription/payment-methods/${id}/current`)
  assert.equal(calls[0].skipAuthRetry, true)
  assert.throws(() => api.defaultPaymentMethod('local-1'))
  assert.throws(() => api.detail('orders', '../../other'))
  assert.equal(calls.length, 1)
})
test('history detail remains addressable by UUID after a refresh', async () => {
  const api = createAccountDataApi({
    get: async (path) => {
      assert.equal(path, `/api/subscription/orders/${id}`)
      return ok({ orderId: id })
    },
  })
  assert.equal((await api.detail('orders', id)).orderId, id)
})
