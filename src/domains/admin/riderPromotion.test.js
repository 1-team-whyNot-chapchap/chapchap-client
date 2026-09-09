import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePhone,
  isValidPhone,
  promotionBlockReason,
  promoteConfirmedUser,
  promotionErrorMessage,
} from './riderPromotion.js'
import { createRiderPromotionApi } from './api/riderPromotionApi.js'

const user = { userId: '9007199254740993', name: '테스트', role: 'CUSTOMER', status: 'ACTIVE' }
const response = (data) => ({ data: { code: '00', data } })

test('full phone normalization matches server input constraints', () => {
  assert.equal(normalizePhone(' 010-1234-5678 '), '01012345678')
  assert.equal(isValidPhone('010-1234-5678'), true)
  for (const value of [
    '5678',
    '',
    '+821012345678',
    '010abc12345678',
    '010\t12345678',
    '010123456789',
  ])
    assert.equal(isValidPhone(value), false)
})

test('only active customers can be promoted', () => {
  assert.equal(promotionBlockReason(user), '')
  for (const change of [
    { status: 'SUSPENDED' },
    { status: 'WITHDRAWN' },
    { role: 'RIDER' },
    { role: 'ADMIN' },
    { role: 'SUPER_ADMIN' },
  ])
    assert.ok(promotionBlockReason({ ...user, ...change }))
  assert.ok(promotionBlockReason(null))
})

test('API uses body for phone, preserves duplicate IDs and page metadata', async () => {
  let sent
  const users = [user, { ...user, userId: '9007199254740994' }]
  const api = createRiderPromotionApi({
    post: async (...args) => {
      sent = args
      return response({ users, page: 0, totalElements: 2, hasNext: false })
    },
  })
  assert.deepEqual((await api.search('010-1234-5678')).users, users)
  assert.deepEqual(sent, ['/api/auth/admin/users/search', { phone: '01012345678', page: 0 }])
  await assert.rejects(api.search('1234'))
  await assert.rejects(api.search('01012345678', -1))
})

test('confirmed promotion reads current state before patching the exact string ID', async () => {
  const calls = []
  const api = createRiderPromotionApi({
    get: async (url) => {
      calls.push(['get', url])
      return response(user)
    },
    patch: async (...args) => {
      calls.push(['patch', ...args])
      return response({ newRole: 'RIDER' })
    },
  })
  assert.equal((await promoteConfirmedUser(api, user, true)).newRole, 'RIDER')
  assert.deepEqual(calls, [
    ['get', `/api/auth/admin/users/${user.userId}`],
    [
      'patch',
      `/api/auth/admin/users/${user.userId}/role`,
      { targetRole: 'RIDER' },
      { skipAuthRetry: true },
    ],
  ])
})

test('missing confirmation and changed identity/status never send PATCH', async () => {
  let writes = 0
  for (const change of [
    { name: '다른 사용자' },
    { role: 'RIDER' },
    { status: 'SUSPENDED' },
    { userId: '2' },
  ]) {
    const api = { getUser: async () => ({ ...user, ...change }), promote: async () => writes++ }
    await assert.rejects(promoteConfirmedUser(api, user, true), { code: 'USER_CHANGED' })
  }
  await assert.rejects(promoteConfirmedUser({}, user, false))
  assert.equal(writes, 0)
})

test('network failure and conflict are propagated without automatic promotion retry', async () => {
  let writes = 0
  const failure = { response: { status: 409 } }
  await assert.rejects(
    promoteConfirmedUser(
      {
        getUser: async () => user,
        promote: async () => {
          writes++
          throw failure
        },
      },
      user,
      true,
    ),
    (error) => error === failure,
  )
  assert.equal(writes, 1)
  assert.match(promotionErrorMessage(failure), /다시 검색/)
  assert.match(promotionErrorMessage({ response: { status: 401 } }), /다시 로그인/)
  assert.match(promotionErrorMessage(new Error('timeout')), /현재 역할/)
})
