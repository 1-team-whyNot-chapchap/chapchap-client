const ridersPath = '/api/delivery/admin/riders'
const leaveRequestsPath = '/api/delivery/admin/rider-leave-requests'

const numericPath = (path, id, label) => {
  return `${path}/${numericId(id, label)}`
}

const numericId = (id, label) => {
  if (!Number.isInteger(Number(id)) || Number(id) < 1)
    throw new Error(`${label} ID를 확인해 주세요.`)
  return Number(id)
}

const responseData = (response, allowEmpty = false) => {
  if (response.data?.code !== '00' || (!allowEmpty && response.data.data == null))
    throw new Error('배송 서버 응답을 확인할 수 없습니다.')
  return response.data.data
}

const query = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null))

export function createAdminRiderManagementApi(http) {
  return {
    async updateDeliveryActive(riderId, request) {
      return responseData(
        await http.patch(`${numericPath(ridersPath, riderId, '기사')}/delivery-active`, request),
        true,
      )
    },
    async listWeeklySchedules(riderId) {
      return responseData(
        await http.get(`${numericPath(ridersPath, riderId, '기사')}/weekly-schedules`),
      )
    },
    async createWeeklySchedule(riderId, request) {
      return responseData(
        await http.post(`${numericPath(ridersPath, riderId, '기사')}/weekly-schedules`, request),
      )
    },
    async deleteWeeklySchedule(riderId, scheduleId) {
      return responseData(
        await http.delete(
          `${numericPath(ridersPath, riderId, '기사')}/weekly-schedules/${numericId(scheduleId, '주간 일정')}`,
        ),
        true,
      )
    },
    async listScheduleExceptions(riderId, filters) {
      if (!filters?.dateFrom || !filters?.dateTo) throw new Error('일정 조회 기간을 확인해 주세요.')
      return responseData(
        await http.get(`${numericPath(ridersPath, riderId, '기사')}/schedule-exceptions`, {
          params: filters,
        }),
      )
    },
    async createScheduleException(riderId, request) {
      return responseData(
        await http.post(`${numericPath(ridersPath, riderId, '기사')}/schedule-exceptions`, request),
      )
    },
    async updateScheduleException(riderId, exceptionId, request) {
      return responseData(
        await http.patch(
          `${numericPath(ridersPath, riderId, '기사')}/schedule-exceptions/${numericId(exceptionId, '일정 예외')}`,
          request,
        ),
      )
    },
    async deleteScheduleException(riderId, exceptionId) {
      return responseData(
        await http.delete(
          `${numericPath(ridersPath, riderId, '기사')}/schedule-exceptions/${numericId(exceptionId, '일정 예외')}`,
        ),
        true,
      )
    },
    async listDeliveryAreas(riderId) {
      return responseData(
        await http.get(`${numericPath(ridersPath, riderId, '기사')}/delivery-areas`),
      )
    },
    async createDeliveryArea(riderId, request) {
      return responseData(
        await http.post(`${numericPath(ridersPath, riderId, '기사')}/delivery-areas`, request),
      )
    },
    async updateDeliveryArea(riderId, riderAreaId, request) {
      return responseData(
        await http.patch(
          `${numericPath(ridersPath, riderId, '기사')}/delivery-areas/${numericId(riderAreaId, '담당 지역')}`,
          request,
        ),
      )
    },
    async listLeaveRequests(filters = {}) {
      return responseData(
        await http.get(leaveRequestsPath, { params: query({ page: 0, size: 20, ...filters }) }),
      )
    },
    async getLeaveRequest(leaveRequestId) {
      return responseData(
        await http.get(numericPath(leaveRequestsPath, leaveRequestId, '휴무 신청')),
      )
    },
    async approveLeaveRequest(leaveRequestId) {
      return responseData(
        await http.post(`${numericPath(leaveRequestsPath, leaveRequestId, '휴무 신청')}/approval`),
      )
    },
    async rejectLeaveRequest(leaveRequestId, request) {
      return responseData(
        await http.post(
          `${numericPath(leaveRequestsPath, leaveRequestId, '휴무 신청')}/rejection`,
          request,
        ),
      )
    },
  }
}
