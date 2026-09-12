import { defineStore } from 'pinia'
import { ref } from 'vue'
import { holidayApi } from '../api/holidayApi.js'

export const useHolidayStore = defineStore('subscription-holidays', () => {
  const calendar = ref(null)
  const status = ref('idle')
  const error = ref(null)
  // 같은 앱의 메인·목록·상세가 동시에 요청해도 한 요청을 공유한다. 영구 저장하지 않는다.
  let pending = null

  function fetchHolidays(force = false) {
    if (pending) return pending
    if (!force && status.value === 'success') return Promise.resolve(calendar.value)
    calendar.value = null
    status.value = 'loading'
    error.value = null
    pending = holidayApi
      .getHolidays()
      .then((data) => {
        calendar.value = data
        status.value = 'success'
        return data
      })
      .catch((cause) => {
        error.value = cause
        status.value = 'error'
        return null
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { calendar, status, error, fetchHolidays }
})
