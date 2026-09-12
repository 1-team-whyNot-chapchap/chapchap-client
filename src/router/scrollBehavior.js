export function scrollBehavior(to, from, savedPosition) {
  if (savedPosition) return savedPosition
  if (to.path === from.path) return false
  return { left: 0, top: 0, behavior: 'instant' }
}
