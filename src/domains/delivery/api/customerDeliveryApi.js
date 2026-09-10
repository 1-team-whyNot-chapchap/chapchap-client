const deliveryPath = (deliveryId = '') => {
  if (!String(deliveryId).trim()) throw new Error('배송 ID를 확인해 주세요.')
  return `/api/delivery/customer/deliveries/${encodeURIComponent(deliveryId)}`
}

const responseData = (response) => {
  if (response.data?.code !== '00' || response.data.data == null)
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createCustomerDeliveryApi(http) {
  return {
    async list(filters = {}) {
      return responseData(
        await http.get('/api/delivery/customer/deliveries', {
          params: query({ page: 0, size: 20, ...filters }),
        }),
      )
    },
    async get(deliveryId) {
      return responseData(await http.get(deliveryPath(deliveryId)))
    },
    async getCompletionPhotoAccess(deliveryId) {
      return responseData(await http.post(`${deliveryPath(deliveryId)}/completion-photo/access`))
    },
  }
}
