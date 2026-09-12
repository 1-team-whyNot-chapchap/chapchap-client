import test from 'node:test'
import assert from 'node:assert/strict'
import { createHolidayApi } from './holidayApi.js'

const calendar = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: [{ holidayDate: '2026-01-01', holidayName: '신정', substituteHoliday: false }],
}
const response = (data) => ({ status: 200, data: { code: '00', message: 'SUCCESS', data } })
test('공개 Gateway GET만 호출하며 query·body·사용자 헤더를 추가하지 않는다', async () => {
  const calls = []
  const api = createHolidayApi({
    get: async (...args) => {
      calls.push(args)
      return response(calendar)
    },
  })
  assert.deepEqual(await api.getHolidays(), calendar)
  assert.deepEqual(calls, [['/api/subscription/holidays']])
})
test('오류 HTTP 상태·code·서버 메시지를 보존한다', async () => {
  for (const code of ['COMMON_098', 'COMMON_099']) {
    const api = createHolidayApi({
      get: async () => {
        throw { response: { status: 500, data: { code, message: '서버 오류' } } }
      },
    })
    await assert.rejects(
      api.getHolidays(),
      (error) => error.status === 500 && error.code === code && error.serverMessage === '서버 오류',
    )
  }
})
test('HTTP 200의 업무 오류도 빈 목록으로 바꾸지 않는다', async () => {
  const api = createHolidayApi({
    get: async () => ({ status: 200, data: { code: 'COMMON_099', message: '미준비', data: null } }),
  })
  await assert.rejects(api.getHolidays(), (error) => error.code === 'COMMON_099')
})
test('네트워크 실패를 성공으로 위장하지 않는다', async () => {
  const api = createHolidayApi({
    get: async () => {
      throw new Error('offline')
    },
  })
  await assert.rejects(api.getHolidays(), (error) => error.status === null)
})
test('범위·실제 날짜·빈 목록·중복·정렬·이름·boolean 응답을 검증한다', async () => {
  const row = calendar.holidays[0]
  const invalid = [
    null,
    {},
    { ...calendar, supportedStartDate: '2026-02-30' },
    { ...calendar, supportedEndDate: '2025-12-31' },
    { ...calendar, holidays: [] },
    ...[
      null,
      { ...row, holidayDate: '2026-02-30' },
      { ...row, holidayDate: '2028-01-01' },
      { ...row, holidayName: '' },
      { ...row, holidayName: ' '.repeat(3) },
      { ...row, holidayName: '가'.repeat(101) },
      { ...row, substituteHoliday: 'false' },
    ].map((item) => ({ ...calendar, holidays: [item] })),
    { ...calendar, holidays: [row, row] },
    { ...calendar, holidays: [{ ...row, holidayDate: '2026-03-01' }, row] },
  ]
  for (const data of invalid) {
    const api = createHolidayApi({ get: async () => response(data) })
    await assert.rejects(api.getHolidays())
  }
})
