// Auth 저장소: gradlew.bat test -PriderClientPath=../chapchap-client
// 실제 Auth MVC/JPA 테스트 서버와 연결한다. 운영 서버를 대상으로 실행하지 않는다.
import assert from 'node:assert/strict'
import axios from 'axios'
import { createAuthSession, roleHome } from '../src/domains/auth/authSession.js'
import { createAccessGuard } from '../src/domains/auth/routeAccess.js'
import { createRiderPromotionApi } from '../src/domains/admin/api/riderPromotionApi.js'
import { promoteConfirmedUser } from '../src/domains/admin/riderPromotion.js'

const baseURL = process.env.RIDER_AUTH_TEST_URL
assert.equal(new URL(baseURL).hostname, '127.0.0.1', 'Test server must use loopback')

function client(initialCookie = '') {
  let cookie = initialCookie
  let logoutRequests = 0
  const create = () => {
    const http = axios.create({ baseURL, timeout: 5000, proxy: false })
    http.interceptors.request.use((config) => {
      if (cookie) config.headers.set('Cookie', cookie)
      if (config.url === '/api/auth/logout') {
        logoutRequests++
        // First logout reaches the JWT boundary with a truly expired signed token.
        if (logoutRequests === 1)
          config.headers.set(
            'Authorization',
            `Bearer ${process.env.RIDER_TEST_EXPIRED_ACCESS_TOKEN}`,
          )
      }
      return config
    })
    const readCookie = (response) => {
      const received = response?.headers?.['set-cookie']?.find((value) =>
        value.startsWith('refreshToken='),
      )
      if (received) cookie = /Max-Age=0/i.test(received) ? '' : received.split(';')[0]
    }
    http.interceptors.response.use(
      (response) => {
        readCookie(response)
        return response
      },
      (error) => {
        readCookie(error.response)
        return Promise.reject(error)
      },
    )
    return http
  }
  const http = create()
  const authHttp = create()
  return {
    http,
    authHttp,
    cookie: () => cookie,
    logoutRequests: () => logoutRequests,
    session: createAuthSession(http, authHttp),
    api: createRiderPromotionApi(http),
  }
}

const admin = client(process.env.RIDER_TEST_ADMIN_COOKIE)
const customer = client()
const anonymous = client()
assert.equal((await admin.session.ensureSession()).role, 'ADMIN')
await customer.authHttp.post('/__test/social-login')
assert.equal((await customer.session.completeSocialLogin()).role, 'CUSTOMER')
await assert.rejects(anonymous.api.search('01012345678'), (error) => error.response.status === 401)
await assert.rejects(customer.api.search('01012345678'), (error) => error.response.status === 403)
const search = await admin.api.search('010-1234-5678')
assert.equal(search.totalElements, 2)
assert.equal(search.users.length, 2)
assert.notEqual(search.users[0].userId, search.users[1].userId)
const target = search.users.find((user) => user.userId === process.env.RIDER_TEST_CUSTOMER_ID)
assert.ok(target)
await assert.rejects(promoteConfirmedUser(admin.api, target, false))
await assert.rejects(customer.api.promote(target.userId), (error) => error.response.status === 403)
await promoteConfirmedUser(admin.api, target, true)
assert.equal((await admin.api.getUser(target.userId)).role, 'RIDER')
await assert.rejects(admin.api.promote(target.userId), (error) => error.response.status === 409)
await assert.rejects(customer.session.ensureSession())
assert.equal(customer.session.state.user, null)
await customer.authHttp.post('/__test/social-login')
const rider = await customer.session.completeSocialLogin()
assert.equal(rider.role, 'RIDER')
assert.equal(roleHome(rider.role), '/rider/deliveries')
assert.equal(await createAccessGuard(customer.session)({ path: '/rider/deliveries' }), true)
assert.equal(
  await createAccessGuard(customer.session)({ path: '/admin/riders' }),
  '/rider/deliveries',
)
const cookieBeforeLogout = customer.cookie()
await customer.session.logout()
assert.equal(customer.logoutRequests(), 2)
assert.equal(customer.cookie(), '')
// Replaying the cookie held before logout cannot resurrect the revoked session.
await assert.rejects(client(cookieBeforeLogout).session.ensureSession())
await assert.rejects(customer.session.ensureSession())
console.log(
  'Auth + frontend integration passed: search, promotion, revoked session, rider relogin, access denial, logout',
)
