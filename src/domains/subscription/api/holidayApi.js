import http from '../../../common/api/http.js'
import {
  SubscriptionApiError,
  toSubscriptionApiError,
  unwrapSubscriptionResponse,
} from './subscriptionApiError.js'
import { parseMenuDate } from '../../product/utils/menuCalendar.js'

export function createHolidayApi(client) {
  return {
    async getHolidays() {
      try {
        const response = await client.get('/api/subscription/holidays')
        const data = unwrapSubscriptionResponse(response, '공휴일 정보를 확인할 수 없습니다.')
        if (
          !parseMenuDate(data.supportedStartDate) ||
          !parseMenuDate(data.supportedEndDate) ||
          data.supportedStartDate > data.supportedEndDate ||
          !Array.isArray(data.holidays) ||
          !data.holidays.length ||
          data.holidays.some(
            (holiday) =>
              !holiday ||
              !parseMenuDate(holiday.holidayDate) ||
              holiday.holidayDate < data.supportedStartDate ||
              holiday.holidayDate > data.supportedEndDate ||
              typeof holiday.holidayName !== 'string' ||
              !holiday.holidayName.trim() ||
              typeof holiday.substituteHoliday !== 'boolean',
          )
        ) {
          throw new SubscriptionApiError('공휴일 정보를 확인할 수 없습니다.', {
            status: response.status,
          })
        }
        return data
      } catch (error) {
        throw toSubscriptionApiError(error, '공휴일 정보를 불러오지 못했습니다.')
      }
    },
  }
}

export const holidayApi = createHolidayApi(http)
