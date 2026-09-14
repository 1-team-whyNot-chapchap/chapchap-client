import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import axios from 'axios'
import { createAuthSession } from '../auth/authSession.js'
import { createAccessGuard } from '../auth/routeAccess.js'
import { createFirstSubscriptionStore } from './stores/useFirstSubscriptionStore.js'
import {
  createPaymentMethodManager,
  paymentMethodState,
  paymentMethodsReady,
} from './paymentMethodManager.js'
const a = { id: 'a', isDefault: true }
const b = { id: 'b', isDefault: false }
function setup(overrides = {}) {
  let cards = []
  const session = reactive({ user: { userId: '2', role: 'CUSTOMER' } })
  const calls = []
  const state = paymentMethodState()
  const api = {
    paymentMethods: async () => structuredClone(cards),
    registerPaymentMethod: async () => {
      calls.push('register')
      const isCurrent = cards.length === 0
      cards.push({ id: isCurrent ? 'a' : 'b', isDefault: isCurrent })
      return { isCurrent }
    },
    defaultPaymentMethod: async (id) => {
      calls.push('select')
      cards = cards.map((c) => ({ ...c, isDefault: c.id === id }))
    },
    deletePaymentMethod: async (id) => {
      calls.push('delete')
      cards = cards.filter((c) => c.id !== id)
    },
    ...overrides.api,
  }
  const manager = createPaymentMethodManager({
    api,
    state,
    getOwner: () => session.user,
    issue: async () => 'test-key',
    ...overrides.manager,
  })
  return {
    state,
    manager,
    calls,
    api,
    setOwner: (user) => {
      session.user = user
    },
    setCards: (value) => {
      cards = value
    },
    logout: () => {
      session.user = null
    },
  }
}

test('first application draft, consent and preview survive card registration and selection without submitting', async () => {
  setActivePinia(createPinia())
  let payments = 0
  const application = createFirstSubscriptionStore(
    {
      subscribe: async () => {
        payments++
      },
    },
    'payment-draft-preservation',
  )()
  application.begin('test-plan')
  application.setDeliveryWeekdays(['MONDAY', 'WEDNESDAY', 'THURSDAY'])
  application.updateDeliveryCondition('MONDAY', { addressId: 'test-address', mealQuantity: 3 })
  application.agreedTerms = { SUBSCRIPTION: true }
  application.preview = { paymentAmount: 243300 }
  const before = JSON.stringify(application.$state)
  const t = setup()
  await t.manager.load()
  await t.manager.register()
  await t.manager.register()
  await t.manager.select(b)
  assert.equal(t.state.notice, '현재 결제수단 변경이 완료되었습니다.')
  assert.equal(JSON.stringify(application.$state), before)
  assert.equal(payments, 0)
})

test('two current cards and a failed list refresh after success never enable payment', async () => {
  const t = setup()
  t.setCards([a, { ...b, isDefault: true }])
  await t.manager.load()
  assert.equal(paymentMethodsReady(t.state), false)
  t.api.paymentMethods = async () => {
    throw new Error('offline')
  }
  await t.manager.select(a)
  assert.match(t.state.notice, /완료/)
  assert.equal(t.state.loaded, false)
  assert.equal(paymentMethodsReady(t.state), false)
})
test('first registration selects server current; additional registration preserves it; selection and delete reload', async () => {
  const t = setup()
  await t.manager.load()
  assert.equal(paymentMethodsReady(t.state), false)
  await t.manager.register()
  assert.equal(paymentMethodsReady(t.state), true)
  await t.manager.register()
  assert.deepEqual(t.state.cards, [a, b])
  await t.manager.select(b)
  assert.deepEqual(t.state.cards, [
    { ...a, isDefault: false },
    { ...b, isDefault: true },
  ])
  await t.manager.remove(a)
  assert.equal(t.state.notice, '카드 삭제가 완료되었습니다.')
  assert.deepEqual(t.calls, ['register', 'register', 'select', 'delete'])
  assert.equal(JSON.stringify(t.state).includes('test-key'), false)
})
test('current card deletion without ongoing subscription is not blocked by frontend or auto-replaced', async () => {
  const t = setup()
  t.setCards([a, b])
  await t.manager.load()
  await t.manager.remove(a)
  assert.deepEqual(t.state.cards, [b])
  assert.equal(paymentMethodsReady(t.state), false)
})
test('server PAYMENT_006 preserves cards and explains replacing the current card', async () => {
  const t = setup({
    api: {
      deletePaymentMethod: async () => {
        throw { code: 'PAYMENT_006' }
      },
    },
  })
  t.setCards([a, b])
  await t.manager.load()
  assert.equal(await t.manager.remove(a), false)
  assert.deepEqual(t.state.cards, [a, b])
  assert.match(t.state.error, /다른 카드를 현재 결제수단으로 먼저 선택/)
})
test('provider cancel does not POST a key or change the current card', async () => {
  const t = setup({
    manager: {
      issue: async () => {
        throw new Error('등록 취소')
      },
    },
  })
  t.setCards([a])
  await t.manager.load()
  await t.manager.register()
  assert.deepEqual(t.calls, [])
  assert.deepEqual(t.state.cards, [a])
})
test('double submit while issuing is ignored and disposed component never registers the issued key', async () => {
  let resolve
  const t = setup({
    manager: {
      issue: () =>
        new Promise((r) => {
          resolve = r
        }),
    },
  })
  await t.manager.load()
  const pending = t.manager.register()
  assert.equal(t.state.busy, true)
  assert.equal(await t.manager.register(), false)
  assert.equal(await t.manager.select(a), false)
  t.manager.dispose()
  resolve('test-key')
  await pending
  assert.deepEqual(t.calls, [])
  assert.deepEqual(t.state.cards, [])
})
test('logout during issuer UI never registers a key for another session', async () => {
  let resolve
  const t = setup({
    manager: {
      issue: () =>
        new Promise((r) => {
          resolve = r
        }),
    },
  })
  await t.manager.load()
  const pending = t.manager.register()
  t.logout()
  resolve('test-key')
  await pending
  assert.deepEqual(t.calls, [])
})
test('uncertain writes are not replayed, not labelled success and require a list check', async () => {
  let writes = 0
  const t = setup({
    api: {
      registerPaymentMethod: async () => {
        writes++
        throw new Error('timeout')
      },
    },
  })
  await t.manager.load()
  await t.manager.register()
  assert.equal(writes, 1)
  assert.equal(t.state.notice, '')
  assert.match(t.state.error, /자동으로 다시 요청하지 않습니다/)
  assert.equal(paymentMethodsReady(t.state), false)
})
test('read failure is not a valid empty list; old owner responses are ignored', async () => {
  const failed = setup({
    api: {
      paymentMethods: async () => {
        throw new Error('offline')
      },
    },
  })
  await failed.manager.load()
  assert.equal(failed.state.loaded, false)
  assert.ok(failed.state.error)
  let resolve
  const t = setup({
    api: {
      paymentMethods: () =>
        new Promise((r) => {
          resolve = r
        }),
    },
  })
  const pending = t.manager.load()
  t.manager.dispose()
  resolve([a])
  await pending
  assert.deepEqual(t.state.cards, [])
})
test('before payment a changed or missing current card blocks submission until customer rechecks', async () => {
  const t = setup()
  t.setCards([a, b])
  await t.manager.load()
  assert.equal(await t.manager.verifyCurrent(), true)
  t.setCards([
    { ...a, isDefault: false },
    { ...b, isDefault: true },
  ])
  assert.equal(await t.manager.verifyCurrent(), false)
  assert.match(t.state.error, /현재 결제수단이 변경/)
  await t.manager.load()
  assert.equal(await t.manager.verifyCurrent(), true)
})

const customer = (userId = '2') => ({ userId, role: 'CUSTOMER' })
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const settle = () => new Promise((resolve) => setImmediate(resolve))

test('real auth session and route guard can refetch the same user without clearing cards', async () => {
  let profileReads = 0
  const http = axios.create({
    adapter: async (config) => {
      profileReads++
      return {
        config,
        status: 200,
        headers: {},
        data: { code: '00', data: { ...customer(), status: 'ACTIVE' } },
      }
    },
  })
  const auth = createAuthSession(http, {
    post: async () => ({ data: { code: '00', data: { accessToken: 'test-only-token' } } }),
  })
  const guard = createAccessGuard(auth)
  assert.equal(await guard({ path: '/mypage/payment-methods' }), true)
  const original = auth.state.user
  const t = setup({ manager: { getOwner: () => auth.state.user } })
  t.setCards([a])
  await t.manager.load()
  assert.equal(await guard({ path: '/mypage/payment-methods' }), true)
  assert.equal(profileReads, 2)
  assert.notEqual(auth.state.user, original)
  assert.equal(auth.state.user.userId, original.userId)
  assert.deepEqual(t.state.cards, [a])
  assert.equal(paymentMethodsReady(t.state), true)
  t.manager.dispose()
})

test('same customer object refresh preserves cards, confirmation and readiness', async () => {
  let ownerChanges = 0
  const t = setup({ manager: { onOwnerChange: () => ownerChanges++ } })
  t.setCards([a])
  await t.manager.load()
  t.setOwner({ ...customer(), subscriptionStatus: 'ACTIVE' })
  assert.deepEqual(t.state.cards, [a])
  assert.equal(paymentMethodsReady(t.state), true)
  assert.equal(ownerChanges, 0)
  assert.equal(await t.manager.verifyCurrent(), true)
})

test('same customer refresh during list retrieval accepts the response', async () => {
  const read = deferred()
  const t = setup({ api: { paymentMethods: () => read.promise } })
  const pending = t.manager.load()
  t.setOwner(customer())
  read.resolve([a])
  assert.equal(await pending, true)
  assert.equal(paymentMethodsReady(t.state), true)
})

test('same customer refresh during card issue and registration accepts success once', async () => {
  const issue = deferred()
  const registration = deferred()
  let writes = 0
  const t = setup({
    manager: { issue: () => issue.promise },
    api: {
      registerPaymentMethod: () => {
        writes++
        return registration.promise
      },
    },
  })
  await t.manager.load()
  const pending = t.manager.register()
  t.setOwner(customer())
  issue.resolve('test-key')
  await settle()
  t.setOwner(customer())
  t.setCards([a])
  registration.resolve({ isCurrent: true })
  assert.equal(await pending, true)
  assert.equal(writes, 1)
  assert.equal(paymentMethodsReady(t.state), true)
})

test('same customer refresh during card selection retains its successful result', async () => {
  const selection = deferred()
  const t = setup({ api: { defaultPaymentMethod: () => selection.promise } })
  t.setCards([a, b])
  await t.manager.load()
  const pending = t.manager.select(b)
  t.setOwner(customer())
  t.setCards([
    { ...a, isDefault: false },
    { ...b, isDefault: true },
  ])
  selection.resolve()
  assert.equal(await pending, true)
  assert.equal(paymentMethodsReady(t.state), true)
  assert.equal(t.state.cards.find((c) => c.isDefault).id, 'b')
})

test('logout clears all display state synchronously and does not query without an owner', async () => {
  let reads = 0,
    cleared = 0
  const t = setup({
    api: {
      paymentMethods: async () => {
        reads++
        return [a]
      },
    },
    manager: { onOwnerChange: () => cleared++ },
  })
  await t.manager.load()
  t.state.notice = 'old notice'
  t.logout()
  assert.deepEqual(t.state, paymentMethodState())
  assert.equal(cleared, 1)
  assert.equal(await t.manager.load(), false)
  assert.equal(reads, 1)
})

test('account switch loads fresh cards and ignores the old pending list response', async () => {
  const old = deferred(),
    next = deferred()
  let reads = 0
  const t = setup({ api: { paymentMethods: () => (++reads === 1 ? old.promise : next.promise) } })
  const pending = t.manager.load()
  t.setOwner(customer('3'))
  next.resolve([b])
  await settle()
  old.resolve([a])
  assert.equal(await pending, false)
  assert.deepEqual(t.state.cards, [b])
  assert.equal(t.state.loading, false)
  assert.equal(t.state.loaded, true)
})

for (const middle of [null, customer('3')]) {
  test(`leaving and returning to customer 2 invalidates pending card issue via ${middle ? 'another account' : 'logout'}`, async () => {
    const issue = deferred()
    let allowed
    const t = setup({
      manager: {
        issue: (stillActive) => {
          allowed = stillActive
          return issue.promise
        },
      },
    })
    await t.manager.load()
    const pending = t.manager.register()
    t.setOwner(middle)
    t.setOwner(customer())
    await settle()
    assert.equal(allowed(), false)
    issue.resolve('test-key')
    assert.equal(await pending, false)
    assert.deepEqual(t.calls, [])
    assert.equal(t.state.notice, '')
  })
}

test('old failed write cannot overwrite a new account state after its recovery read', async () => {
  const recovery = deferred(),
    newRead = deferred()
  let reads = 0
  const t = setup({
    api: {
      paymentMethods: () => {
        reads++
        return reads === 1 ? Promise.resolve([a]) : reads === 2 ? recovery.promise : newRead.promise
      },
      defaultPaymentMethod: async () => {
        throw new Error('old failure')
      },
    },
  })
  await t.manager.load()
  const pending = t.manager.select(a)
  await settle()
  t.setOwner(customer('3'))
  recovery.resolve([a])
  assert.equal(await pending, false)
  assert.equal(t.state.loading, true)
  assert.equal(t.state.error, '')
  newRead.resolve([b])
  await settle()
  assert.deepEqual(t.state.cards, [b])
})

test('owner change during current-card verification never authorizes payment', async () => {
  const read = deferred()
  const t = setup()
  t.setCards([a])
  await t.manager.load()
  t.api.paymentMethods = () => read.promise
  const verification = t.manager.verifyCurrent()
  t.logout()
  t.setOwner(customer())
  read.resolve([a])
  assert.equal(await verification, false)
})

test('invalid owner or customer role loss clears cards; disposed manager never reloads', async () => {
  let reads = 0
  const t = setup({
    api: {
      paymentMethods: async () => {
        reads++
        return [a]
      },
    },
  })
  await t.manager.load()
  t.setOwner({ userId: '2', role: 'ADMIN' })
  assert.deepEqual(t.state, paymentMethodState())
  assert.equal(await t.manager.load(), false)
  t.manager.dispose()
  t.setOwner(customer())
  await settle()
  assert.equal(reads, 1)
  assert.deepEqual(t.state, paymentMethodState())
})
