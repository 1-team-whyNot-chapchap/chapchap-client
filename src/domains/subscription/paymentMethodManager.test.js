import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
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
  let owner = { id: 'test-owner' }
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
    getOwner: () => owner,
    issue: async () => 'test-key',
    ...overrides.manager,
  })
  return {
    state,
    manager,
    calls,
    api,
    setCards: (value) => {
      cards = value
    },
    logout: () => {
      owner = null
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
