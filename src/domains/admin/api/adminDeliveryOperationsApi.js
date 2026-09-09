const deliveriesPath = '/api/delivery/admin/deliveries'
const operationsPath = '/api/delivery/admin/delivery-operations'

const deliveryPath = (deliveryId) => {
  if (!String(deliveryId || '').trim()) throw new Error('배송 ID를 확인해 주세요.')
  return `${deliveriesPath}/${encodeURIComponent(deliveryId)}`
}

const responseData = (response) => {
  if (response.data?.code !== '00' || response.data.data == null)
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createAdminDeliveryOperationsApi(http) {
  return {
    async getOperationCounts(filters = {}) {
      return responseData(await http.get(`${operationsPath}/counts`, { params: query(filters) }))
    },
    async listOperations(filters) {
      if (!filters?.type) throw new Error('운영 유형을 선택해 주세요.')
      return responseData(
        await http.get(operationsPath, { params: query({ page: 0, size: 20, ...filters }) }),
      )
    },
    async getDelivery(deliveryId) {
      return responseData(await http.get(deliveryPath(deliveryId)))
    },
    async getCompletionPhotoAccess(deliveryId) {
      return responseData(await http.post(`${deliveryPath(deliveryId)}/completion-photo/access`))
    },
    async recoverDelivery(deliveryId, request, photo) {
      const form = new FormData()
      form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
      if (photo) form.append('photo', photo)
      return responseData(await http.post(`${deliveryPath(deliveryId)}/recovery`, form))
    },
    async failDelivery(deliveryId, request) {
      return responseData(await http.post(`${deliveryPath(deliveryId)}/fail`, request))
    },
    async correctCompletion(deliveryId, request) {
      return responseData(
        await http.post(`${deliveryPath(deliveryId)}/completion-corrections`, request),
      )
    },
    async correctFailure(deliveryId, request) {
      return responseData(
        await http.post(`${deliveryPath(deliveryId)}/failure-corrections`, request),
      )
    },
  }
}
