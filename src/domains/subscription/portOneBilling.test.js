import test from 'node:test'
import assert from 'node:assert/strict'
import { billingConfiguration, issueBillingKey } from './portOneBilling.js'
const env = {
  VITE_PORTONE_STORE_ID: 'test-store',
  VITE_PORTONE_BILLING_CHANNEL_KEY: 'test-channel',
  VITE_PORTONE_IDENTITY_CHANNEL_KEY: 'identity-channel',
}
const navigatorInfo = { userAgent: 'Desktop', platform: 'Win32' }
test('billing uses the shared store and only the billing channel, not the identity channel', () => {
  assert.throws(() =>
    billingConfiguration({
      VITE_PORTONE_STORE_ID: 'identity',
      VITE_PORTONE_IDENTITY_CHANNEL_KEY: 'identity',
    }),
  )
  assert.deepEqual(billingConfiguration(env), {
    storeId: 'test-store',
    channelKey: 'test-channel',
    billingKeyMethod: 'CARD',
  })
})

test('shared store and billing channel are required and trimmed independently', () => {
  for (const invalid of [undefined, '', '   ']) {
    assert.throws(() => billingConfiguration({ ...env, VITE_PORTONE_STORE_ID: invalid }))
    assert.throws(() => billingConfiguration({ ...env, VITE_PORTONE_BILLING_CHANNEL_KEY: invalid }))
  }
  assert.deepEqual(
    billingConfiguration({
      ...env,
      VITE_PORTONE_STORE_ID: ' test-store ',
      VITE_PORTONE_BILLING_CHANNEL_KEY: ' test-channel ',
    }),
    { storeId: 'test-store', channelKey: 'test-channel', billingKeyMethod: 'CARD' },
  )
})
test('issuer calls only billing-key issuance without payment or redirection', async () => {
  let request
  const key = await issueBillingKey({
    env,
    navigatorInfo,
    loadSdk: async () => ({
      requestIssueBillingKey: async (r) => {
        request = r
        return { billingKey: 'test-key' }
      },
    }),
  })
  assert.equal(key, 'test-key')
  assert.deepEqual(request, {
    storeId: 'test-store',
    channelKey: 'test-channel',
    billingKeyMethod: 'CARD',
    windowType: { pc: 'IFRAME', mobile: 'REDIRECTION' },
  })
})
test('cancel, failure and incomplete results never return a usable key or expose provider message', async () => {
  for (const response of [
    undefined,
    { code: 'FAIL', billingKey: 'sensitive', message: 'secret' },
    {},
    { billingKey: ' ' },
    { billingKey: 'NEEDS_CONFIRMATION' },
  ]) {
    await assert.rejects(
      issueBillingKey({
        env,
        navigatorInfo,
        loadSdk: async () => ({ requestIssueBillingKey: async () => response }),
      }),
      (e) => !/secret|sensitive/.test(e.message),
    )
  }
})
test('mobile cannot leave without a saved return context', async () => {
  for (const info of [
    { userAgent: 'iPhone' },
    { userAgent: 'Android' },
    { userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 5 },
  ]) {
    await assert.rejects(
      issueBillingKey({
        env,
        navigatorInfo: info,
        loadSdk: async () => {
          throw new Error('must not load')
        },
      }),
      /복귀 정보/,
    )
  }
})

test('mobile uses the card channel and redirects only after preparing the return context', async () => {
  let request
  const sequence = []
  await assert.rejects(
    issueBillingKey({
      env,
      navigatorInfo: { userAgent: 'Android' },
      loadSdk: async () => {
        sequence.push('sdk')
        return {
          requestIssueBillingKey: async (value) => {
            sequence.push('request')
            request = value
            return { code: 'CANCEL' }
          },
        }
      },
      prepareRedirect: () => {
        sequence.push('saved')
        return 'https://example.test/subscription/payment-methods/callback?billingRequest=test'
      },
    }),
    /완료하지 못/,
  )
  assert.deepEqual(sequence, ['sdk', 'saved', 'request'])
  assert.equal(request.billingKeyMethod, 'CARD')
  assert.equal(request.channelKey, 'test-channel')
  assert.equal(request.windowType.mobile, 'REDIRECTION')
  assert.equal(request.forceRedirect, true)
  assert.match(request.redirectUrl, /^https:\/\/example.test\//)
})

test('storage preparation failure never opens the issuer', async () => {
  let opened = 0
  await assert.rejects(
    issueBillingKey({
      env,
      navigatorInfo: { userAgent: 'iPhone' },
      loadSdk: async () => ({
        requestIssueBillingKey: () => {
          opened++
        },
      }),
      prepareRedirect: () => {
        throw new Error('storage disabled')
      },
    }),
    /storage disabled/,
  )
  assert.equal(opened, 0)
})
