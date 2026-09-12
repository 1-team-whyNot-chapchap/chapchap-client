import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'
import { parsePublicDate } from '../publicMenuDate.js'

function requireCalendar(data, status) {
  const invalid = () =>
    new SubscriptionApiError('공휴일 기준정보를 확인할 수 없습니다.', { status })
  if (
    !parsePublicDate(data?.supportedStartDate) ||
    !parsePublicDate(data?.supportedEndDate) ||
    data.supportedStartDate > data.supportedEndDate ||
    !Array.isArray(data.holidays) ||
    !data.holidays.length
  )
    throw invalid()
  let previous = ''
  for (const row of data.holidays) {
    if (
      !parsePublicDate(row?.holidayDate) ||
      row.holidayDate <= previous ||
      row.holidayDate < data.supportedStartDate ||
      row.holidayDate > data.supportedEndDate ||
      typeof row.holidayName !== 'string' ||
      !row.holidayName.trim() ||
      row.holidayName.length > 100 ||
      typeof row.substituteHoliday !== 'boolean'
    )
      throw invalid()
    previous = row.holidayDate
  }
  return data
}

export function createHolidayApi(client) {
  return {
    async getHolidays() {
      try {
        const response = await client.get('/api/subscription/holidays')
        return requireCalendar(
          unwrapSubscriptionResponse(response, '공휴일 응답을 확인할 수 없습니다.'),
          response.status ?? null,
        )
      } catch (error) {
        throw toSubscriptionApiError(error, '공휴일 정보를 불러오지 못했습니다.')
      }
    },
  }
}

export const holidayApi = createHolidayApi(http)
