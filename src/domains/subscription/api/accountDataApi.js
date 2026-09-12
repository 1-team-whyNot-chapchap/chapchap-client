import { unwrapSubscriptionResponse, toSubscriptionApiError } from './subscriptionApiError.js'

const root = '/api/subscription'
const uuid = (value) => {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(value)))
    throw new Error('올바른 항목을 선택해 주세요.')
  return value
}
export function createAccountDataApi(client) {
  const get = async (path) =>
    unwrapSubscriptionResponse(await client.get(root + path), '조회 결과를 확인할 수 없습니다.')
  const write = async (method, path, data) => {
    try {
      return unwrapSubscriptionResponse(
        await client.request({ method, url: root + path, data, skipAuthRetry: true }),
        '처리 결과를 확인할 수 없습니다.',
      )
    } catch (error) {
      throw toSubscriptionApiError(
        error,
        '변경하지 못했습니다. 결제수단 상태를 확인한 뒤 다시 시도해 주세요.',
      )
    }
  }
  return {
    async history(kind) {
      if (!['payments', 'refunds', 'orders'].includes(kind))
        throw new Error('지원하지 않는 내역입니다.')
      const result = await get('/' + kind)
      if (!Array.isArray(result[kind])) throw new Error('내역을 확인할 수 없습니다.')
      return result[kind]
    },
    detail: (kind, id) => {
      if (!['payments', 'orders'].includes(kind)) throw new Error('지원하지 않는 내역입니다.')
      return get(`/${kind}/${uuid(id)}`)
    },
    async addresses() {
      const result = await get('/addresses')
      if (!Array.isArray(result.addresses)) throw new Error('배송지 목록을 확인할 수 없습니다.')
      return result.addresses.map((a) => ({
        ...a,
        id: a.addressId,
        recipient: a.recipientName,
        phone: a.recipientPhone,
        address: a.addressLine1,
        deliveryRequest: a.otherDeliveryRequest || '',
      }))
    },
    async paymentMethods() {
      const result = await get('/payment-methods')
      if (!Array.isArray(result.paymentMethods))
        throw new Error('결제수단 목록을 확인할 수 없습니다.')
      return result.paymentMethods.map((c) => ({
        id: c.paymentMethodId,
        brand: c.cardCompany,
        maskedCardNumber: c.maskedCardNumber,
        lastFourDigits: c.maskedCardNumber?.slice(-4) || '',
        isDefault: c.isCurrent,
      }))
    },
    defaultPaymentMethod: (id) => write('patch', `/payment-methods/${uuid(id)}/current`),
    async subscription() {
      const response = await client.get(root + '/subscriptions')
      // CurrentSubscriptionQueryService explicitly returns null when no subscription exists.
      if (response?.data?.code === '00' && response.data.data === null) return null
      const result = unwrapSubscriptionResponse(response, '구독 정보를 확인할 수 없습니다.')
      if (!result.subscriptionId || !Array.isArray(result.deliveryConditions))
        throw new Error('구독 정보를 확인할 수 없습니다.')
      return result
    },
  }
}
