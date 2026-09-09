import test from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { createAuthSession, roleHome } from './authSession.js'
import { createAccessGuard, requiredRoles } from './routeAccess.js'

const user = (role = 'CUSTOMER') => ({ userId: '25', name: '테스트', role, status: 'ACTIVE' })
function clients(handler) {
  const calls = []
  const adapter = async (config) => {
    calls.push(config)
    const result = await handler(config, calls)
    if (result.status >= 400)
      throw new axios.AxiosError('request failed', 'ERR_BAD_RESPONSE', config, null, {
        status: result.status,
        data: {},
      })
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { code: '00', data: result },
    }
  }
  const http = axios.create({ adapter })
  return { http, session: createAuthSession(http, axios.create({ adapter })), calls }
}

test('simultaneous initial requests share refresh, and profile role comes from server', async () => {
  const { session, calls } = clients(async (config) =>
    config.url.endsWith('reissue-token') ? { accessToken: 'test-rider' } : user('RIDER'),
  )
  const [first, second] = await Promise.all([session.ensureSession(), session.ensureSession()])
  assert.equal(first.role, 'RIDER')
  assert.equal(second.role, 'RIDER')
  assert.equal(calls.filter((call) => call.url.endsWith('reissue-token')).length, 1)
  assert.equal(
    calls.find((call) => call.url.endsWith('/me')).headers.get('Authorization'),
    'Bearer test-rider',
  )
})

test('expired access token is renewed once and original read resumes', async () => {
  let refreshes = 0
  const { session, http } = clients(async (config) => {
    if (config.url.endsWith('reissue-token')) return { accessToken: `token-${++refreshes}` }
    if (config.url === '/protected' && config.headers.get('Authorization') === 'Bearer token-1')
      return { status: 401 }
    return user()
  })
  await session.ensureSession()
  await http.get('/protected')
  assert.equal(refreshes, 2)
})

test('revoked refresh clears identity and notifies expiry without an infinite retry', async () => {
  let revoked = false
  const { session, http, calls } = clients(async (config) => {
    if (config.url.endsWith('reissue-token'))
      return revoked ? { status: 401 } : { accessToken: 'token' }
    if (config.url === '/protected') return { status: 401 }
    return user()
  })
  await session.ensureSession()
  revoked = true
  let expired = 0
  session.onExpired(() => expired++)
  await assert.rejects(http.get('/protected'))
  assert.equal(session.state.user, null)
  assert.equal(expired, 1)
  assert.equal(calls.filter((call) => call.url.endsWith('reissue-token')).length, 2)
})

test('promotion write marked skipAuthRetry is never replayed', async () => {
  const { session, http, calls } = clients(async (config) =>
    config.url.endsWith('reissue-token')
      ? { accessToken: 'token' }
      : config.method === 'patch'
        ? { status: 401 }
        : user('ADMIN'),
  )
  await session.ensureSession()
  await assert.rejects(http.patch('/role', {}, { skipAuthRetry: true }))
  assert.equal(calls.filter((call) => call.method === 'patch').length, 1)
  assert.equal(session.state.user, null)
})

test('admin initial password flag cannot become an authenticated user', async () => {
  const { session, calls } = clients(async () => ({ mustChangePassword: true, accessToken: null }))
  assert.deepEqual(await session.loginAdmin('admin', 'test-password'), { mustChangePassword: true })
  assert.equal(session.state.user, null)
  await assert.rejects(session.ensureSession())
  assert.equal(calls.length, 1)
})

test('inactive or unknown-role profile fails closed', async () => {
  for (const profile of [{ ...user(), status: 'SUSPENDED' }, user('UNKNOWN')]) {
    const { session } = clients(async (config) =>
      config.url.endsWith('reissue-token') ? { accessToken: 'token' } : profile,
    )
    await assert.rejects(session.ensureSession())
    assert.equal(session.state.user, null)
  }
})

test('role routing and unauthorized route access use current server identity', async () => {
  assert.equal(roleHome('CUSTOMER'), '/')
  assert.equal(roleHome('RIDER'), '/rider/deliveries')
  for (const role of ['ADMIN', 'SUPER_ADMIN']) assert.equal(roleHome(role), '/admin')
  const guard = createAccessGuard({ ensureSession: async () => user('CUSTOMER') })
  assert.equal(await guard({ path: '/admin/riders' }), '/')
  assert.equal(await guard({ path: '/rider/deliveries' }), '/')
  assert.equal(await guard({ path: '/mypage' }), true)
  assert.equal(requiredRoles('/admin/login'), null)
  assert.equal(requiredRoles('/admin/password/initial'), null)
  const failed = createAccessGuard({
    ensureSession: async () => {
      throw new Error('expired')
    },
  })
  assert.deepEqual(await failed({ path: '/rider/deliveries' }), {
    path: '/rider/login',
    query: { reason: 'expired' },
  })
})

test('late refresh cannot restore explicitly cleared authentication', async () => {
  let finish
  const wait = new Promise((resolve) => {
    finish = resolve
  })
  const { session } = clients(async () => {
    await wait
    return { accessToken: 'late-token' }
  })
  const pending = session.ensureSession()
  await new Promise((resolve) => setImmediate(resolve))
  session.clear()
  finish()
  await assert.rejects(pending)
  assert.equal(session.state.user, null)
})
