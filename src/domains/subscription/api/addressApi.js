import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'

const ROOT = '/api/subscription/addresses'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function addressId(value) {
  if (typeof value !== 'string' || !UUID_V4.test(value)) {
    throw new SubscriptionApiError('올바른 배송지를 선택해 주세요.', {
      status: 400,
      code: 'COMMON_001',
    })
  }
  return value
}

function requireAddressList(data, status) {
  if (!Array.isArray(data?.addresses)) {
    throw new SubscriptionApiError('배송지 목록 응답을 확인할 수 없습니다.', { status })
  }
  return data.addresses
}

function requireAddressResult(data, status, fallbackMessage) {
  if (!data || typeof data.addressId !== 'string') {
    throw new SubscriptionApiError(fallbackMessage, { status })
  }
  return data
}

export function createAddressApi(client) {
  return {
    async listAddresses() {
      try {
        const response = await client.get(ROOT)
        return requireAddressList(
          unwrapSubscriptionResponse(response, '배송지 목록 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '배송지 목록을 불러오지 못했습니다.')
      }
    },

    async createAddress(request) {
      try {
        const response = await client.post(ROOT, request)
        return requireAddressResult(
          unwrapSubscriptionResponse(response, '배송지 등록 응답을 확인할 수 없습니다.'),
          response.status ?? null,
          '배송지 등록 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '배송지를 등록하지 못했습니다.')
      }
    },

    async updateAddress(value, request) {
      try {
        const id = addressId(value)
        const response = await client.patch(`${ROOT}/${id}`, request)
        return requireAddressResult(
          unwrapSubscriptionResponse(response, '배송지 수정 응답을 확인할 수 없습니다.'),
          response.status ?? null,
          '배송지 수정 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '배송지를 수정하지 못했습니다.')
      }
    },

    async setDefaultAddress(value) {
      try {
        const id = addressId(value)
        const response = await client.patch(`${ROOT}/${id}/default`)
        return requireAddressResult(
          unwrapSubscriptionResponse(response, '기본 배송지 변경 응답을 확인할 수 없습니다.'),
          response.status ?? null,
          '기본 배송지 변경 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '기본 배송지를 변경하지 못했습니다.')
      }
    },

    async deleteAddress(value) {
      try {
        const id = addressId(value)
        const response = await client.delete(`${ROOT}/${id}`)
        return requireAddressResult(
          unwrapSubscriptionResponse(response, '배송지 삭제 응답을 확인할 수 없습니다.'),
          response.status ?? null,
          '배송지 삭제 응답을 확인할 수 없습니다.',
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '배송지를 삭제하지 못했습니다.')
      }
    },
  }
}

export const addressApi = createAddressApi(http)
