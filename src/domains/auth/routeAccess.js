import { loginPath, roleHome } from './authSession.js'

export function requiredRoles(path) {
  if (
    [
      '/admin/login',
      '/admin/access-denied',
      '/admin/session-expired',
      '/rider/login',
      '/admin/password/initial',
    ].includes(path)
  )
    return null
  if (path === '/admin/notifications') return ['ADMIN']
  if (path === '/notifications' || path === '/mypage/notifications')
    return ['CUSTOMER', 'RIDER', 'ADMIN']
  if (path === '/admin' || path.startsWith('/admin/')) return ['ADMIN', 'SUPER_ADMIN']
  if (
    path === '/help/chat' ||
    path.startsWith('/help/inquiries') ||
    path === '/support/quality-issue'
  )
    return ['CUSTOMER', 'RIDER']
  if (path.startsWith('/rider/')) return ['RIDER']
  if (
    [
      '/mypage',
      '/subscription',
      '/payments',
      '/payment',
      '/addresses',
      '/notifications',
      '/reviews',
      '/inquiries',
    ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  )
    return ['CUSTOMER']
  return null
}

export function createAccessGuard(session) {
  let publicSessionChecked = false
  return async (to) => {
    const roles = requiredRoles(to.path)
    if (!roles) {
      const authFlow =
        to.path === '/signup' ||
        to.path.startsWith('/signup/') ||
        to.path.startsWith('/auth/') ||
        to.path === '/admin/password/initial'
      if (!publicSessionChecked && !authFlow) {
        publicSessionChecked = true
        try {
          await session.ensureSession()
        } catch {
          /* Public pages remain accessible. */
        }
      }
      return true
    }
    try {
      const user = await session.ensureSession()
      return roles.includes(user.role) ? true : roleHome(user.role)
    } catch {
      return { path: loginPath(to.path), query: { reason: 'expired' } }
    }
  }
}
