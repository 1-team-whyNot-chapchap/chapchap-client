import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { holidayApi } from '../api/holidayApi.js'
import { useHolidayStore } from './useHolidayStore.js'

test('동시 조회를 합치고 성공 결과를 재사용하며 강제 조회는 갱신한다', async (t) => {
  setActivePinia(createPinia())
  let resolve
  const mock = t.mock.method(
    holidayApi,
    'getHolidays',
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const store = useHolidayStore()
  const first = store.fetchHolidays()
  const second = store.fetchHolidays()
  assert.equal(mock.mock.callCount(), 1)
  assert.equal(store.status, 'loading')
  assert.equal(store.calendar, null)
  resolve({ holidays: [{ holidayDate: '2026-01-01' }] })
  await Promise.all([first, second])
  assert.equal(store.status, 'success')
  await store.fetchHolidays()
  assert.equal(mock.mock.callCount(), 1)
  const retry = store.fetchHolidays(true)
  assert.equal(store.calendar, null)
  assert.equal(mock.mock.callCount(), 2)
  resolve({ holidays: [{ holidayDate: '2027-01-01' }] })
  await retry
  assert.equal(store.calendar.holidays[0].holidayDate, '2027-01-01')
})
test('실패 후 선택에 사용할 데이터를 남기지 않으며 재시도로 복구한다', async (t) => {
  setActivePinia(createPinia())
  const cause = new Error('offline')
  const mock = t.mock.method(holidayApi, 'getHolidays', async () => {
    throw cause
  })
  const store = useHolidayStore()
  assert.equal(await store.fetchHolidays(), null)
  assert.equal(store.status, 'error')
  assert.equal(store.calendar, null)
  assert.equal(store.error, cause)
  mock.mock.mockImplementation(async () => ({ holidays: [] }))
  await store.fetchHolidays(true)
  assert.equal(store.status, 'success')
  assert.equal(store.error, null)
})
