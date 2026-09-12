import test from 'node:test'
import assert from 'node:assert/strict'
import { createAddressApi } from './addressApi.js'

const ADDRESS_ID = '550e8400-e29b-41d4-a716-446655440000'
const address = {
  name: '집',
  recipientName: '홍길동',
  recipientPhone: '01012345678',
  postalCode: '41911',
  addressLine1: '대구광역시 중구 국채보상로 123',
  addressLine2: null,
  deliveryMethod: 'DOORSTEP',
  otherDeliveryRequest: null,
  entrancePassword: null,
}

function success(data) {
  return { status: 200, data: { code: '00', message: 'SUCCESS', data } }
}

test('배송지 목록은 Gateway 경로와 addresses 응답을 사용한다', async () => {
  const calls = []
  const api = createAddressApi({
    get: async (url) => {
      calls.push(url)
      return success({ addresses: [{ addressId: ADDRESS_ID, ...address, isDefault: true }] })
    },
  })

  const addresses = await api.listAddresses()
  assert.equal(addresses[0].addressId, ADDRESS_ID)
  assert.deepEqual(calls, ['/api/subscription/addresses'])
})

test('등록은 DTO 필드를 그대로 전송하고 서버 결과를 반환한다', async () => {
  let call
  const api = createAddressApi({
    post: async (url, body) => {
      call = { url, body }
      return success({ addressId: ADDRESS_ID, isDefault: true })
    },
  })

  assert.deepEqual(await api.createAddress(address), { addressId: ADDRESS_ID, isDefault: true })
  assert.deepEqual(call, { url: '/api/subscription/addresses', body: address })
})

test('수정은 nullable 필드의 명시적 null을 보존한다', async () => {
  let call
  const api = createAddressApi({
    patch: async (url, body) => {
      call = { url, body }
      return success({ addressId: ADDRESS_ID })
    },
  })
  const request = { addressLine2: null, otherDeliveryRequest: null, entrancePassword: null }

  await api.updateAddress(ADDRESS_ID, request)
  assert.deepEqual(call, { url: `/api/subscription/addresses/${ADDRESS_ID}`, body: request })
})

test('기본 배송지 지정과 삭제는 UUID 경로를 사용한다', async () => {
  const calls = []
  const api = createAddressApi({
    patch: async (url, body) => {
      calls.push({ method: 'patch', url, body })
      return success({ addressId: ADDRESS_ID, isDefault: true })
    },
    delete: async (url) => {
      calls.push({ method: 'delete', url })
      return success({ addressId: ADDRESS_ID })
    },
  })

  await api.setDefaultAddress(ADDRESS_ID)
  await api.deleteAddress(ADDRESS_ID)
  assert.deepEqual(calls, [
    { method: 'patch', url: `/api/subscription/addresses/${ADDRESS_ID}/default`, body: undefined },
    { method: 'delete', url: `/api/subscription/addresses/${ADDRESS_ID}` },
  ])
})

test('UUID가 아닌 배송지 ID는 요청 전에 거절한다', async () => {
  let called = false
  const api = createAddressApi({
    patch: async () => {
      called = true
    },
  })

  await assert.rejects(api.setDefaultAddress('home'), (error) => {
    assert.equal(error.status, 400)
    assert.equal(error.code, 'COMMON_001')
    return true
  })
  assert.equal(called, false)
})

test('주소 사용 중 충돌의 HTTP 상태와 오류 코드를 보존한다', async () => {
  const api = createAddressApi({
    delete: async () => {
      throw {
        response: {
          status: 409,
          data: { code: 'ADDRESS_004', message: '사용 중인 배송지는 삭제할 수 없습니다.' },
        },
      }
    },
  })

  await assert.rejects(api.deleteAddress(ADDRESS_ID), (error) => {
    assert.equal(error.status, 409)
    assert.equal(error.code, 'ADDRESS_004')
    return true
  })
})

test('all address mutations disable authentication replay', async () => {
  const options = []
  const api = createAddressApi({
    post: async (url, body, config) => {
      options.push(config)
      return success({ addressId: ADDRESS_ID })
    },
    patch: async (url, body, config) => {
      options.push(config)
      return success({ addressId: ADDRESS_ID })
    },
    delete: async (url, config) => {
      options.push(config)
      return success({ addressId: ADDRESS_ID })
    },
  })
  await api.createAddress(address)
  await api.updateAddress(ADDRESS_ID, address)
  await api.setDefaultAddress(ADDRESS_ID)
  await api.deleteAddress(ADDRESS_ID)
  assert.deepEqual(
    options,
    Array.from({ length: 4 }, () => ({ skipAuthRetry: true })),
  )
})
