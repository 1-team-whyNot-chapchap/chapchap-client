const basePath = '/api/delivery/admin'

const numericPath = (path, id, label) => {
  if (!Number.isInteger(Number(id)) || Number(id) < 1)
    throw new Error(`${label} ID를 확인해 주세요.`)
  return `${basePath}/${path}/${id}`
}

const responseData = (response, allowEmpty = false) => {
  if (response.data?.code !== '00' || (!allowEmpty && response.data.data == null))
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createAdminDeliveryAssignmentApi(http) {
  return {
    async listDeliveryGroups(filters = {}) {
      return responseData(
        await http.get(`${basePath}/delivery-groups`, {
          params: query({ page: 0, size: 20, ...filters }),
        }),
      )
    },
    async getDeliveryGroup(deliveryGroupId) {
      return responseData(
        await http.get(numericPath('delivery-groups', deliveryGroupId, '배송 그룹')),
      )
    },
    async runAutoAssignment(deliveryGroupId) {
      return responseData(
        await http.post(
          `${numericPath('delivery-groups', deliveryGroupId, '배송 그룹')}/auto-assignment`,
        ),
      )
    },
    async createManualAssignments(deliveryGroupId, request) {
      return responseData(
        await http.post(
          `${numericPath('delivery-groups', deliveryGroupId, '배송 그룹')}/manual-assignments`,
          request,
        ),
      )
    },
    async confirmDeliveryGroup(deliveryGroupId) {
      return responseData(
        await http.post(
          `${numericPath('delivery-groups', deliveryGroupId, '배송 그룹')}/confirmation`,
        ),
      )
    },
    async replaceRider(assignmentId, request) {
      return responseData(
        await http.post(
          `${numericPath('assignments', assignmentId, '배정')}/emergency-rider-replacement`,
          request,
        ),
      )
    },
    async rejectAssignmentIssue(issueId, request) {
      return responseData(
        await http.post(
          `${numericPath('assignment-issues', issueId, '배정 이슈')}/reject`,
          request,
        ),
        true,
      )
    },
    async reassignAssignmentIssue(issueId, request) {
      return responseData(
        await http.post(
          `${numericPath('assignment-issues', issueId, '배정 이슈')}/reassign`,
          request,
        ),
        true,
      )
    },
  }
}
