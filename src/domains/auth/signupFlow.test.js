import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSignupFlow,
  createIdentityVerificationId,
  validatePolicies,
  restoreConsent,
} from './signupFlow.js'

test('consent draft survives mobile redirect and submission can be claimed only once', () => {
  const { flow } = fixture()
  const policies = [
    { policyId: 1, version: '1', required: true },
    { policyId: 2, version: '1', required: false },
  ]
  flow.start(id)
  flow.beginVerification('verification', policies, [1])
  assert.deepEqual(restoreConsent(flow.read().consentDraft, policies), [1])
  assert.equal(flow.claimSubmission(), false)
  flow.acceptResult({ identityVerificationId: 'verification' })
  assert.equal(flow.claimSubmission(), true)
  assert.equal(flow.claimSubmission(), false)
  assert.equal(flow.read().submitted, true)
})
test('changed or missing required consent cannot auto-submit after redirect', () => {
  const policies = [{ policyId: 1, version: '2', required: true }]
  assert.equal(restoreConsent([{ policyId: 1, version: '1', agreed: true }], policies), null)
  assert.equal(restoreConsent([{ policyId: 1, version: '2', agreed: false }], policies), null)
  assert.equal(restoreConsent(undefined, policies), null)
  assert.equal(restoreConsent([], []), null)
})

test('identity ID fits KCP alphanumeric 40-character limit without reducing UUID entropy', () => {
  const value = createIdentityVerificationId(() => '1917733e-2bbc-4fc0-9625-b7141c6ec097')
  assert.equal(value, '1917733e2bbc4fc09625b7141c6ec097')
  assert.match(value, /^[a-zA-Z0-9]{32}$/)
  assert.notEqual(createIdentityVerificationId(), createIdentityVerificationId())
})

const id = '1917733e-2bbc-4fc0-9625-b7141c6ec097'
function fixture() {
  const data = new Map()
  let time = 1000
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  }
  return {
    flow: createSignupFlow(storage, () => time),
    storage,
    advance: (n) => {
      time += n
    },
  }
}
test('signup identifiers survive reload, but expire after 15 minutes', () => {
  const { flow, advance } = fixture()
  flow.start(id)
  assert.equal(flow.read().signupSessionId, id)
  advance(15 * 60 * 1000)
  assert.equal(flow.read(), null)
})
test('reject invalid signup session values and discard the previous flow', () => {
  const { flow } = fixture()
  flow.start(id)
  for (const invalid of ['', [id], 'https://evil.example', null]) {
    assert.throws(() => flow.start(invalid))
    assert.equal(flow.read(), null)
  }
})
test('only matching successful SDK result advances; cancellation and mismatches do not', () => {
  const { flow } = fixture()
  flow.start(id)
  assert.equal(flow.acceptResult({ identityVerificationId: 'invented' }), false)
  flow.beginVerification('verification-test')
  assert.equal(flow.acceptResult(undefined), false)
  assert.equal(flow.acceptResult({ identityVerificationId: 'other' }), false)
  assert.equal(
    flow.acceptResult({ identityVerificationId: 'verification-test', code: 'CANCEL' }),
    false,
  )
  assert.equal(flow.read().returned, false)
  assert.equal(flow.acceptResult({ identityVerificationId: 'verification-test' }), true)
  assert.equal(flow.read().returned, true)
  flow.beginVerification('new-attempt')
  assert.equal(flow.read().returned, false)
})
test('expired identity result cannot resume signup', () => {
  const { flow, advance } = fixture()
  flow.start(id)
  flow.beginVerification('verification-test')
  advance(900000)
  assert.equal(flow.acceptResult({ identityVerificationId: 'verification-test' }), false)
})
test('policies fail closed for empty, malformed or missing required content', () => {
  const p = { policyId: 1, required: true, title: '이용 약관', content: '약관 본문' }
  assert.deepEqual(validatePolicies([p]), [p])
  for (const invalid of [[], null, [p, p], [{ ...p, content: '' }], [{ ...p, required: false }]])
    assert.throws(() => validatePolicies(invalid))
})
