import test from 'node:test'
import assert from 'node:assert/strict'
import { createCustomerApi } from './customerApi.js'
import { createAccessGuard, requiredRoles } from '../../auth/routeAccess.js'

test('customer paths preserve identifiers and writes are never automatically replayed', async () => {
  const calls = []
  const client = {
    get: async (url, config) => {
      calls.push({ url, ...config })
      return { data: { code: '00', data: [] } }
    },
    request: async (config) => {
      calls.push(config)
      return { data: { code: '00', data: {} } }
    },
  }
  const api = createCustomerApi(client)
  await api.inquiry('9007199254740993')
  assert.equal(calls[0].url, '/api/customer/quality-inquiries/9007199254740993')
  assert.throws(() => api.inquiry(Number.MAX_SAFE_INTEGER + 1))
  assert.throws(() => api.messages('../admin'))
  await api.accept('12')
  await api.handoff('12')
  await api.close('12')
  assert.ok(calls.slice(1).every((call) => call.skipAuthRetry === true))
  await api.messages('12', true)
  assert.equal(calls.at(-1).url, '/api/customer/admin/consultations/12/messages')
  const form = new FormData()
  form.append('content', '문의')
  form.append('attachments', new Blob(['file']), 'test.txt')
  await api.createInquiry(form)
  assert.equal(calls.at(-1).data, form)
})

test('support routes require current customer or rider account', async () => {
  for (const path of [
    '/help/chat',
    '/help/inquiries',
    '/help/inquiries/new',
    '/help/inquiries/1',
    '/support/quality-issue',
  ]) {
    assert.deepEqual(requiredRoles(path), ['CUSTOMER', 'RIDER'])
    assert.equal(
      await createAccessGuard({ ensureSession: async () => ({ role: 'RIDER' }) })({ path }),
      true,
    )
    assert.equal(
      await createAccessGuard({ ensureSession: async () => ({ role: 'ADMIN' }) })({ path }),
      '/admin',
    )
  }
  assert.equal(requiredRoles('/help/faq'), null)
})

test('summary uses assigned administrator endpoint and validates identity', async () => {
  let url
  const api = createCustomerApi({
    get: async (value) => {
      url = value
      return { data: { code: '00', data: { status: 'PENDING' } } }
    },
  })
  assert.equal((await api.consultationSummary('501')).status, 'PENDING')
  assert.equal(url, '/api/customer/admin/consultations/501/summary')
  assert.throws(() => api.consultationSummary('../other'))
})
