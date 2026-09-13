import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import {
  BILLING_CALLBACK_PATH,
  BILLING_CONTEXT_KEY,
  BILLING_CONTEXT_TTL,
  billingDraft,
  billingUserId,
  billingReturnTarget,
  createMobileBillingContext,
} from './mobileBillingContext.js'
import {
  captureMobileBillingReturn,
  takeMobileBillingResult,
  completeMobileBilling,
  recoverAbandonedBilling,
  takeBillingReturnNotice,
} from './mobileBillingReturn.js'
import { createFirstSubscriptionStore } from './stores/useFirstSubscriptionStore.js'

const id = '550e8400-e29b-41d4-a716-446655440000'
const other = '660e8400-e29b-41d4-a716-446655440000'
const user = { userId: '1', role: 'CUSTOMER' }
const origin = 'https://example.test'
function fixture() {
  let clock = 1000
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  const context = createMobileBillingContext(
    storage,
    () => clock,
    () => id,
  )
  const application = {
    planId: id,
    deliveryConditions: [
      {
        weekday: 'MONDAY',
        addressId: other,
        mealQuantity: 3,
        deliveryTimeSlot: 'TIME_1100_1300',
        recipientPhone: 'not-saved',
      },
    ],
    requiredTerms: [{ termsType: 'A', version: '1', content: 'not-saved' }],
    agreedTerms: { A: true },
    termsConfirmed: true,
    preview: { paymentAmount: 999 },
    billingKey: 'not-saved',
    token: 'not-saved',
  }
  const begin = (source = 'methods') =>
    context.begin({
      userId: '1',
      source,
      origin,
      draft: source === 'subscription' ? billingDraft(application) : null,
    })
  const result = () => ({
    id,
    billingKey: 'test-key',
    transactionType: 'ISSUE_BILLING_KEY',
    failed: false,
  })
  return {
    context,
    storage,
    values,
    begin,
    result,
    application,
    setTime: (value) => {
      clock = value
    },
  }
}

test('only authenticated customer userId is used; email or phone cannot identify a registration', () => {
  assert.equal(billingUserId(user), '1')
  for (const value of [
    null,
    { email: 'same', phone: 'same' },
    { ...user, role: 'ADMIN' },
    { ...user, userId: 1 },
  ])
    assert.equal(billingUserId(value), null)
})
test('return URL uses current origin and fixed path; state contains only minimal input', () => {
  const f = fixture(),
    started = f.begin('subscription')
  assert.equal(new URL(started.redirectUrl).origin, origin)
  assert.equal(new URL(started.redirectUrl).pathname, BILLING_CALLBACK_PATH)
  assert.equal(new URL(started.redirectUrl).searchParams.get('billingRequest'), id)
  assert.doesNotMatch(
    f.storage.getItem(BILLING_CONTEXT_KEY),
    /not-saved|paymentAmount|billingKey|token|recipientPhone/,
  )
  assert.deepEqual(billingReturnTarget(f.context.read()), {
    path: '/subscribe/payment',
    query: { planId: id },
  })
  assert.deepEqual(billingReturnTarget(null), { path: '/mypage/payment-methods' })
})
test('pending request cannot be overwritten; wrong nonce or owner cannot claim it', () => {
  const f = fixture()
  f.begin()
  assert.throws(() => f.begin(), /진행 중/)
  assert.equal(f.context.claim(other, '1'), null)
  assert.equal(f.context.claim(id, '2'), null)
  assert.equal(f.context.claim(id, '1').source, 'methods')
  assert.equal(f.context.claim(id, '1'), null)
})
test('30-minute expiry and invalid persisted input fail closed and remove the record', () => {
  const f = fixture()
  f.begin('subscription')
  f.setTime(1000 + BILLING_CONTEXT_TTL)
  assert.equal(f.context.read(), null)
  assert.equal(f.values.size, 0)
  f.storage.setItem(BILLING_CONTEXT_KEY, '{broken')
  assert.equal(f.context.read(), null)
  assert.throws(() => f.context.begin({ userId: '1', source: 'https://evil.test', origin }))
  assert.throws(() =>
    f.context.begin({ userId: '1', source: 'methods', origin: 'javascript:alert(1)' }),
  )
})
test('storage errors stop starting or claiming instead of permitting a write', () => {
  const context = createMobileBillingContext(
    {
      getItem: () => null,
      removeItem() {},
      setItem() {
        throw new Error('denied')
      },
    },
    () => 1000,
    () => id,
  )
  assert.throws(() => context.begin({ userId: '1', source: 'methods', origin }), /denied/)
  const f = fixture()
  f.begin()
  f.storage.setItem = () => {
    throw new Error('denied')
  }
  assert.throws(() => f.context.claim(id, '1'), /denied/)
})
test('normal-path and hash callback capture clears all query fields and consumes key only in memory', () => {
  for (const path of [BILLING_CALLBACK_PATH, `/#${BILLING_CALLBACK_PATH}`]) {
    let replaced
    assert.equal(
      captureMobileBillingReturn({
        location: {
          href: `${origin}${path}?billingRequest=${id}&billingKey=test-key&message=provider-secret`,
        },
        history: {
          replaceState: (state, title, url) => {
            assert.equal(state, null)
            replaced = url
          },
        },
      }),
      true,
    )
    assert.equal(replaced, `/#${BILLING_CALLBACK_PATH}`)
    const result = takeMobileBillingResult()
    assert.equal(result.billingKey, 'test-key')
    assert.equal(result.message, undefined)
    assert.equal(takeMobileBillingResult(), null)
  }
})
test('duplicate callback query values are not accepted; unrelated URLs are untouched', () => {
  captureMobileBillingReturn({
    location: { href: `${origin}${BILLING_CALLBACK_PATH}?billingKey=a&billingKey=b` },
    history: { replaceState() {} },
  })
  assert.equal(takeMobileBillingResult().billingKey, null)
  assert.equal(
    captureMobileBillingReturn({
      location: { href: `${origin}/#/signup` },
      history: {
        replaceState() {
          throw new Error('must not touch')
        },
      },
    }),
    false,
  )
})
test('successful callback saves once; consumed marker has no draft or key, reload cannot POST again', async () => {
  const f = fixture()
  f.begin('subscription')
  let calls = 0
  const args = {
    context: f.context,
    getUser: () => user,
    register: async (key) => {
      calls++
      assert.equal(key, 'test-key')
      assert.equal(f.context.read().status, 'consumed')
      return { paymentMethodId: id, isCurrent: true }
    },
  }
  const result = f.result()
  const outcome = await completeMobileBilling({ ...args, result })
  assert.match(outcome.message, /현재 결제수단/)
  assert.equal(outcome.record.draft.planId, id)
  assert.equal(result.billingKey, null)
  assert.equal(f.context.read().draft, null)
  await completeMobileBilling({ ...args, result: f.result() })
  assert.equal(calls, 1)
})
test('concurrent duplicate callback does not POST twice', async () => {
  const f = fixture()
  f.begin()
  let calls = 0
  await Promise.all(
    [1, 2].map(() =>
      completeMobileBilling({
        result: f.result(),
        context: f.context,
        getUser: () => user,
        register: async () => {
          calls++
          return { paymentMethodId: id, isCurrent: false }
        },
      }),
    ),
  )
  assert.equal(calls, 1)
})
test('cancel, failure, missing key and wrong transaction type never call registration', async () => {
  for (const overrides of [
    { failed: true },
    { billingKey: null },
    { billingKey: 'NEEDS_CONFIRMATION' },
    { transactionType: 'PAYMENT' },
  ]) {
    const f = fixture()
    f.begin()
    let calls = 0
    const outcome = await completeMobileBilling({
      result: { ...f.result(), ...overrides },
      context: f.context,
      getUser: () => user,
      register: () => {
        calls++
      },
    })
    assert.equal(calls, 0)
    assert.match(outcome.message, /취소되었거나/)
  }
})
test('wrong owner, no session or missing correlation cannot register or restore another account draft', async () => {
  for (const account of [null, { ...user, userId: '2' }]) {
    const f = fixture()
    f.begin('subscription')
    const outcome = await completeMobileBilling({
      result: f.result(),
      context: f.context,
      getUser: () => account,
      register: () => {
        throw new Error('must not POST')
      },
    })
    assert.equal(outcome.record, null)
  }
})
test('uncertain write or malformed response is not success and is not replayed', async () => {
  for (const failure of [true, false]) {
    const f = fixture()
    f.begin()
    let calls = 0
    const args = {
      context: f.context,
      getUser: () => user,
      register: async () => {
        calls++
        if (failure) throw new Error('provider-secret')
        return { isCurrent: true }
      },
    }
    const outcome = await completeMobileBilling({ ...args, result: f.result() })
    assert.match(outcome.message, /자동으로 다시 요청하지/)
    assert.doesNotMatch(outcome.message, /provider-secret/)
    await completeMobileBilling({ ...args, result: f.result() })
    assert.equal(calls, 1)
  }
})
test('logout while POST is pending suppresses success and draft restoration', async () => {
  const f = fixture()
  f.begin('subscription')
  let account = user
  const outcome = await completeMobileBilling({
    result: f.result(),
    context: f.context,
    getUser: () => account,
    register: async () => {
      account = null
      return { paymentMethodId: id, isCurrent: true }
    },
  })
  assert.equal(outcome.record, null)
})
test('browser back restores input once without pretending registration succeeded', () => {
  const f = fixture()
  f.begin('subscription')
  assert.equal(recoverAbandonedBilling(user, 'subscription', other, f.context), null)
  const recovered = recoverAbandonedBilling(user, 'subscription', id, f.context)
  assert.equal(recovered.draft.planId, id)
  assert.match(takeBillingReturnNotice('1'), /완료를 확인하지 못/)
  assert.equal(recoverAbandonedBilling(user, 'subscription', id, f.context), null)
})
test('back under another account deletes pending draft without restoring it', () => {
  const f = fixture()
  f.begin('subscription')
  assert.equal(
    recoverAbandonedBilling({ ...user, userId: '2' }, 'subscription', id, f.context),
    null,
  )
  assert.equal(f.context.read(), null)
})
test('restored draft refetches terms and quote, never automatically agrees or pays', async () => {
  setActivePinia(createPinia())
  let agreements = 0,
    payments = 0,
    quotes = 0
  const store = createFirstSubscriptionStore(
    {
      getRequiredTerms: async () => [{ termsType: 'A', version: '1' }],
      agreeRequiredTerms: async () => {
        agreements++
      },
      preview: async () => {
        quotes++
        return { paymentAmount: 123 }
      },
      subscribe: async () => {
        payments++
      },
    },
    'mobile-restore',
  )()
  const f = fixture()
  store.restoreMobileDraft(billingDraft(f.application))
  assert.equal(store.preview, null)
  assert.equal(store.termsConfirmed, false)
  await store.fetchRequiredTerms()
  assert.equal(store.termsConfirmed, true)
  await store.requestPreview({})
  assert.equal(store.preview.paymentAmount, 123)
  assert.equal(quotes, 1)
  assert.equal(agreements, 0)
  assert.equal(payments, 0)
})
test('changed terms or no successful agreement requires fresh customer agreement', async () => {
  for (const version of ['2', '1']) {
    setActivePinia(createPinia())
    const store = createFirstSubscriptionStore(
      { getRequiredTerms: async () => [{ termsType: 'A', version }] },
      `terms-${version}`,
    )()
    const f = fixture()
    if (version === '1') f.application.termsConfirmed = false
    store.restoreMobileDraft(billingDraft(f.application))
    await store.fetchRequiredTerms()
    assert.equal(store.termsConfirmed, false)
    assert.equal(store.agreedTerms.A, false)
  }
})
