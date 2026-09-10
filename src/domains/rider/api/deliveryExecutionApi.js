const basePath = '/api/delivery/rider'

const assignmentPath = (assignmentId) => {
  if (!Number.isInteger(Number(assignmentId)) || Number(assignmentId) < 1)
    throw new Error('배정 ID를 확인해 주세요.')
  return `${basePath}/assignments/${assignmentId}`
}

const deliveryPath = (deliveryId) => {
  if (!String(deliveryId || '').trim()) throw new Error('배송 ID를 확인해 주세요.')
  return `${basePath}/deliveries/${encodeURIComponent(deliveryId)}`
}

const responseData = (response) => {
  if (response.data?.code !== '00' || response.data.data == null)
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createDeliveryExecutionApi(http) {
  return {
    async listAssignments(filters = {}) {
      return responseData(
        await http.get(`${basePath}/assignments`, {
          params: query({ page: 0, size: 20, ...filters }),
        }),
      )
    },
    async getAssignment(assignmentId) {
      return responseData(await http.get(assignmentPath(assignmentId)))
    },
    async acknowledgeAssignment(assignmentId) {
      return responseData(await http.post(`${assignmentPath(assignmentId)}/acknowledgement`))
    },
    async reportAssignmentIssue(assignmentId, request) {
      return responseData(await http.post(`${assignmentPath(assignmentId)}/issues`, request))
    },
    async startDelivery(deliveryId) {
      return responseData(await http.post(`${deliveryPath(deliveryId)}/start`))
    },
    async completeDelivery(deliveryId, request, photo) {
      const form = new FormData()
      form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
      if (photo) form.append('photo', photo)
      return responseData(await http.post(`${deliveryPath(deliveryId)}/complete`, form))
    },
    async failDelivery(deliveryId, request) {
      return responseData(await http.post(`${deliveryPath(deliveryId)}/fail`, request))
    },
    async failRemainingDeliveries(assignmentId, request) {
      return responseData(
        await http.post(`${assignmentPath(assignmentId)}/emergency-failures`, request),
      )
    },
  }
}
