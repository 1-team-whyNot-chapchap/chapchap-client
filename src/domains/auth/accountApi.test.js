import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccountApi, validateProfileImage } from './accountApi.js'

test('invalid image and unconfirmed withdrawal never send a request', () => {
  const api = createAccountApi({ request: () => assert.fail('unexpected write') })
  assert.throws(() => api.withdraw(false))
  assert.throws(() => api.uploadImage({ size: 6 * 1024 * 1024, type: 'image/png' }))
  assert.throws(() => validateProfileImage({ size: 1, type: 'image/svg+xml' }))
})
test('account mutations use actual API and prohibit auth replay', async () => {
  const calls = []
  const api = createAccountApi({
    request: async (config) => {
      calls.push(config)
      return { data: { code: '00', data: null } }
    },
  })
  await api.saveConsent(3, false)
  await api.withdraw(true)
  assert.equal(calls[0].url, '/api/auth/users/me/marketing-consent')
  assert.deepEqual(calls[0].data, { policyId: 3, agreed: false })
  assert.equal(calls[1].method, 'delete')
  assert.deepEqual(calls[1].data, { confirmed: true })
  assert.ok(calls.every((call) => call.skipAuthRetry))
})
