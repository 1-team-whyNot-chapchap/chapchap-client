const basePath = '/api/delivery/rider'

const leaveRequestPath = (leaveRequestId = '') => {
  if (!Number.isInteger(Number(leaveRequestId)) || Number(leaveRequestId) < 1)
    throw new Error('휴무 신청 ID를 확인해 주세요.')
  return `${basePath}/leave-requests/${leaveRequestId}`
}

const responseData = (response) => {
  if (response.data?.code !== '00' || response.data.data == null)
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

export function createRiderScheduleApi(http) {
  return {
    async getSchedules({ dateFrom, dateTo }) {
      if (!dateFrom || !dateTo) throw new Error('일정 조회 기간을 확인해 주세요.')
      return responseData(await http.get(`${basePath}/schedules`, { params: { dateFrom, dateTo } }))
    },
    async listLeaveRequests() {
      return responseData(await http.get(`${basePath}/leave-requests`))
    },
    async getLeaveRequest(leaveRequestId) {
      return responseData(await http.get(leaveRequestPath(leaveRequestId)))
    },
    async createLeaveRequest(request) {
      return responseData(await http.post(`${basePath}/leave-requests`, request))
    },
  }
}
