import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createAddressStore } from './useAddressStore.js'

const ADDRESS_ID = '550e8400-e29b-41d4-a716-446655440000'

test('배송지 변경 성공 뒤에는 서버 목록을 다시 조회한다', async () => {
  const calls = []
  const api = {
    listAddresses: async () => {
      calls.push('list')
      return [{ addressId: ADDRESS_ID, name: '회사', isDefault: true }]
    },
    setDefaultAddress: async (addressId) => {
      calls.push(`default:${addressId}`)
      return { addressId, isDefault: true }
    },
  }
  setActivePinia(createPinia())
  const store = createAddressStore(api, 'subscription-addresses-test')()

  const changed = await store.setDefaultAddress(ADDRESS_ID)

  assert.equal(changed, true)
  assert.deepEqual(calls, [`default:${ADDRESS_ID}`, 'list'])
  assert.equal(store.addresses[0].name, '회사')
  assert.equal(store.listStatus, 'success')
})

test('진행 중인 쓰기 요청은 자동으로 다시 실행하지 않는다', async () => {
  let resolveCreate
  let calls = 0
  const api = {
    createAddress: () => {
      calls += 1
      return new Promise((resolve) => {
        resolveCreate = resolve
      })
    },
    listAddresses: async () => [],
  }
  setActivePinia(createPinia())
  const store = createAddressStore(api, 'subscription-addresses-pending-test')()

  const first = store.createAddress({ name: '집' })
  const second = await store.createAddress({ name: '집' })
  resolveCreate({ addressId: ADDRESS_ID })

  assert.equal(second, false)
  assert.equal(await first, true)
  assert.equal(calls, 1)
})
