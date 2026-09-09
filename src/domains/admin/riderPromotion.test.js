import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePhone,
  isValidPhone,
  promotionBlockReason,
  searchPreviewUsers,
} from './riderPromotion.js'

test('phone search accepts formatting, rejects partial and malformed input', () => {
  assert.equal(normalizePhone(' 010-0000-0001 '), '01000000001')
  for (const value of [
    '0001',
    '010abc00000001',
    '+82 10 0000 0001',
    '010000000001',
    '0101234567',
    '',
  ])
    assert.equal(isValidPhone(value), false)
  assert.equal(isValidPhone('010-0000-0001'), true)
  assert.equal(searchPreviewUsers('0001').length, 0)
})

test('exact search returns all duplicate matches without automatically choosing a user', () => {
  const matches = searchPreviewUsers('010-0000-0003')
  assert.equal(matches.length, 2)
  assert.notEqual(matches[0].id, matches[1].id)
  assert.equal(searchPreviewUsers('01000000000').length, 0)
})

test('search results are isolated and cannot mutate the fixture roles', () => {
  searchPreviewUsers('01000000001')[0].role = 'RIDER'
  assert.equal(searchPreviewUsers('01000000001')[0].role, 'CUSTOMER')
})

test('only active customers with known clear subscription and order status are eligible', () => {
  const user = searchPreviewUsers('01000000001')[0]
  assert.equal(promotionBlockReason(user), '')
  assert.ok(promotionBlockReason(null))
  for (const change of [
    { status: 'SUSPENDED' },
    { status: 'WITHDRAWN' },
    { role: 'RIDER' },
    { role: 'ADMIN' },
    { hasActiveSubscription: true },
    { hasPendingOrders: true },
    { hasActiveSubscription: undefined },
    { hasPendingOrders: null },
  ])
    assert.ok(promotionBlockReason({ ...user, ...change }))
})
