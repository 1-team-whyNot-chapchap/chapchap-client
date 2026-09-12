import test from 'node:test'
import assert from 'node:assert/strict'
import { createHolidayApi } from './holidayApi.js'

const data = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: [{ holidayDate: '2026-01-01', holidayName: '신정', substituteHoliday: false }],
}
const response = (value) => ({ status: 200, data: { code: '00', data: value } })
test('공개 공휴일 API를 query 없이 한 번 호출하고 범위·이름을 반환한다', async () => {
  const calls = []
  const api = createHolidayApi({
    get: async (...args) => {
      calls.push(args)
      return response(data)
    },
  })
  assert.deepEqual(await api.getHolidays(), data)
  assert.deepEqual(calls, [['/api/subscription/holidays']])
})
test('빈 목록·잘못된 범위·잘못된 공휴일 응답을 정상으로 사용하지 않는다', async () => {
  for (const value of [
    null,
    {},
    { ...data, holidays: [] },
    { ...data, supportedStartDate: '2028-01-01' },
    { ...data, supportedEndDate: '2027-02-30' },
    { ...data, holidays: [null] },
    { ...data, holidays: [{ ...data.holidays[0], holidayName: '' }] },
    { ...data, holidays: [{ ...data.holidays[0], holidayDate: '2028-01-01' }] },
  ]) {
    await assert.rejects(createHolidayApi({ get: async () => response(value) }).getHolidays())
  }
})
test('서버 오류 코드를 보존하며 실패 후 재조회할 수 있다', async () => {
  let count = 0
  const api = createHolidayApi({
    get: async () => {
      if (!count++) throw { response: { status: 500, data: { code: 'COMMON_099' } } }
      return response(data)
    },
  })
  await assert.rejects(
    api.getHolidays(),
    (error) => error.status === 500 && error.code === 'COMMON_099',
  )
  assert.deepEqual(await api.getHolidays(), data)
})
