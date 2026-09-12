import test from 'node:test'
import assert from 'node:assert/strict'
import { scrollBehavior } from './scrollBehavior.js'
test('new pages start at top while back navigation and same-page filters preserve position', () => {
  assert.deepEqual(scrollBehavior({ path: '/help/faq' }, { path: '/support' }, null), {
    left: 0,
    top: 0,
    behavior: 'instant',
  })
  assert.deepEqual(
    scrollBehavior({ path: '/support' }, { path: '/help/faq' }, { left: 0, top: 900 }),
    { left: 0, top: 900 },
  )
  assert.equal(
    scrollBehavior({ path: '/support', query: { page: 2 } }, { path: '/support' }, null),
    false,
  )
})
