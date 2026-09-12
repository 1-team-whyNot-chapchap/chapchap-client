import { reactive, readonly } from 'vue'
import { validatePolicies } from './signupFlow.js'

export function roleHome(role) {
  return (
    { CUSTOMER: '/', RIDER: '/rider/deliveries', ADMIN: '/admin', SUPER_ADMIN: '/admin' }[role] ||
    '/forbidden'
  )
}

export function loginPath(path = '') {
  return path.startsWith('/admin')
    ? '/admin/login'
    : path.startsWith('/rider')
      ? '/rider/login'
      : '/login'
}

export function createAuthSession(http, authHttp) {
  const state = reactive({ user: null })
  let accessToken = ''
  let generation = 0
  let refreshPromise = null
  let sessionPromise = null
  let expired = () => {}
  let initialPasswordRequired = false
  const payload = (response) => {
    if (response.data?.code !== '00' || !response.data.data)
      throw new Error('인증 응답을 확인할 수 없습니다.')
    return response.data.data
  }
  function clear() {
    accessToken = ''
    state.user = null
    generation++
  }
  function expire() {
    clear()
    expired()
  }
  function refresh() {
    if (initialPasswordRequired)
      return Promise.reject(new Error('최초 비밀번호 변경이 필요합니다.'))
    if (refreshPromise) return refreshPromise
    const version = generation
    refreshPromise = authHttp
      .post('/api/auth/reissue-token')
      .then((response) => {
        const data = payload(response)
        if (version !== generation || typeof data.accessToken !== 'string' || !data.accessToken)
          throw new Error('로그인 상태가 변경되었습니다.')
        accessToken = data.accessToken
        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
    return refreshPromise
  }
  async function loadUser() {
    const version = generation
    const user = payload(await http.get('/api/auth/me'))
    if (version !== generation || user.status !== 'ACTIVE' || roleHome(user.role) === '/forbidden')
      throw new Error('사용할 수 없는 계정입니다.')
    state.user = user
    return user
  }
  function ensureSession() {
    if (sessionPromise) return sessionPromise
    sessionPromise = (async () => {
      try {
        if (!accessToken) await refresh()
        return await loadUser()
      } catch (error) {
        clear()
        throw error
      } finally {
        sessionPromise = null
      }
    })()
    return sessionPromise
  }
  http.interceptors.request.use((config) => {
    if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`)
    else config.headers.delete('Authorization')
    return config
  })
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config
      if (error.response?.status !== 401 || !config) throw error
      if (config.skipAuthRetry || config.authRetried) {
        expire()
        throw error
      }
      config.authRetried = true
      try {
        // 같은 만료 토큰으로 시작한 동시 요청은 이미 갱신된 토큰을 재사용한다.
        if (!accessToken || config.headers.get('Authorization') === `Bearer ${accessToken}`)
          await refresh()
        return await http.request(config)
      } catch (failure) {
        expire()
        throw failure
      }
    },
  )
  return {
    state: readonly(state),
    ensureSession,
    async getSignupPolicies() {
      return validatePolicies(payload(await authHttp.get('/api/auth/policies/current')))
    },
    async completeSignup(request) {
      if (refreshPromise) await refreshPromise.catch(() => {})
      clear()
      initialPasswordRequired = false
      const version = generation
      // Dedicated client: never refresh/replay an account-creation POST.
      const data = payload(await authHttp.post('/api/auth/signup/complete', request))
      if (version !== generation || typeof data.accessToken !== 'string' || !data.accessToken)
        throw new Error('가입 결과를 확인할 수 없습니다. 다시 로그인해 주세요.')
      accessToken = data.accessToken
      try {
        return await loadUser()
      } catch (error) {
        clear()
        throw error
      }
    },
    async completeSocialLogin() {
      clear()
      initialPasswordRequired = false
      return ensureSession()
    },
    async loginLocalTestCustomer() {
      if (refreshPromise) await refreshPromise.catch(() => {})
      clear()
      initialPasswordRequired = false
      const version = generation
      const data = payload(await authHttp.post('/api/auth/local-test-login/customer'))
      if (version !== generation || typeof data.accessToken !== 'string' || !data.accessToken)
        throw new Error('테스트 로그인 결과를 확인할 수 없습니다.')
      accessToken = data.accessToken
      try {
        return await loadUser()
      } catch (error) {
        clear()
        throw error
      }
    },
    async loginAdmin(username, password) {
      if (refreshPromise) await refreshPromise.catch(() => {})
      clear()
      initialPasswordRequired = false
      const data = payload(await authHttp.post('/api/auth/admin/login', { username, password }))
      if (data.mustChangePassword) {
        initialPasswordRequired = true
        return { mustChangePassword: true }
      }
      if (typeof data.accessToken !== 'string' || !data.accessToken)
        throw new Error('인증 응답을 확인할 수 없습니다.')
      accessToken = data.accessToken
      try {
        const user = await loadUser()
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role))
          throw new Error('관리자 권한이 필요합니다.')
        return { user, mustChangePassword: false }
      } catch (error) {
        clear()
        throw error
      }
    },
    async changeInitialPassword(request) {
      await authHttp.post('/api/auth/admin/password/initial', request)
      initialPasswordRequired = false
      clear()
    },
    clear,
    getAccessToken() {
      return accessToken
    },
    refreshAccessToken() {
      return refresh()
    },
    async logout() {
      // 쿠키 회전이 끝난 뒤 종료하여 늦게 온 refresh 응답이 쿠키를 되살리지 않게 한다.
      if (refreshPromise) await refreshPromise.catch(() => {})
      try {
        // 만료된 access token은 한 번 갱신하여 서버 세션과 HttpOnly 쿠키까지 폐기한다.
        await http.post('/api/auth/logout', null)
      } finally {
        clear()
      }
    },
    onExpired(callback) {
      expired = callback
    },
  }
}
