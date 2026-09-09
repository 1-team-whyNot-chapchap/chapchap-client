const auditHistoriesPath = '/api/delivery/admin/audit-histories'
const integrationEventsPath = '/api/delivery/admin/integration-events'

const responseData = (response) => {
  if (response.data?.code !== '00' || response.data.data == null)
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createAdminAuditAndIntegrationEventsApi(http) {
  return {
    async listAuditHistories(filters = {}) {
      return responseData(
        await http.get(auditHistoriesPath, { params: query({ page: 0, size: 20, ...filters }) }),
      )
    },
    async listIntegrationEvents(filters = {}) {
      return responseData(
        await http.get(integrationEventsPath, {
          params: query({ page: 0, size: 20, ...filters }),
        }),
      )
    },
    async republishIntegrationEvent(integrationEventRecordId) {
      if (
        !Number.isInteger(Number(integrationEventRecordId)) ||
        Number(integrationEventRecordId) < 1
      )
        throw new Error('연동 이벤트 ID를 확인해 주세요.')
      return responseData(
        await http.post(`${integrationEventsPath}/${Number(integrationEventRecordId)}/republish`),
      )
    },
  }
}
