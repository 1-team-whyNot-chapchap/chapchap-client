import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseMenuDate,
  formatMenuDate,
  canSelectMenuDate,
  menuForDate,
  menuDateError,
  canNavigateMenuCalendar,
} from './menuCalendar.js'

const calendar = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: [
    { holidayDate: '2026-01-01', holidayName: '신정' },
    { holidayDate: '2026-03-02', holidayName: '대체공휴일' },
  ],
}
test('날짜는 유효한 yyyy-MM-dd만 허용하고 로컬 날짜로 왕복한다', () => {
  for (const value of [
    null,
    undefined,
    ['2026-09-14'],
    '2026-9-14',
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    'invalid',
  ])
    assert.equal(parseMenuDate(value), null)
  for (const value of ['2026-09-14', '2028-02-29'])
    assert.equal(formatMenuDate(parseMenuDate(value)), value)
  assert.equal(formatMenuDate(new Date('invalid')), null)
})
test('공휴일 정보가 없거나 일요일·공휴일·대체공휴일·범위 밖이면 선택을 막는다', () => {
  for (const value of [
    '2026-09-13',
    '2026-01-01',
    '2026-03-02',
    '2025-12-31',
    '2028-01-01',
    'invalid',
  ])
    assert.equal(canSelectMenuDate(value, calendar), false)
  assert.equal(canSelectMenuDate('2026-09-14', null), false)
  assert.equal(canSelectMenuDate('2026-09-14', calendar), true)
  assert.equal(canSelectMenuDate('2027-12-31', calendar), true)
  assert.equal(canSelectMenuDate('2026-01-01', { ...calendar, holidays: [] }), true)
})
test('월의 N일은 순번 N 메뉴를 선택하며 배열 순서와 무관하다', () => {
  const plan = {
    menus: [
      { menuSequence: 31, name: '31일' },
      { menuSequence: 14, name: '14일' },
    ],
  }
  assert.equal(menuForDate(plan, '2026-09-14').name, '14일')
  assert.equal(menuForDate(plan, '2026-10-31').name, '31일')
  assert.equal(menuForDate(plan, '2026-09-15'), null)
  assert.equal(menuForDate(plan, 'invalid'), null)
})

test('URL 날짜 오류를 형식, 범위, 휴일 순서로 구분한다', () => {
  for (const value of ['', null, ['2026-09-14'], '2026-02-30'])
    assert.match(menuDateError(value, calendar), /올바르지 않은 날짜/)
  for (const value of ['2025-12-28', '2028-01-01'])
    assert.match(menuDateError(value, calendar), /조회 가능한 기간/)
  for (const value of ['2026-09-20', '2026-01-01', '2026-03-02'])
    assert.match(menuDateError(value, calendar), /일요일과 공휴일/)
  assert.equal(menuDateError('2026-09-14', calendar), '')
})

test('날짜 보기의 월 이동과 Shift 연도 이동은 양쪽 경계를 넘지 않는다', () => {
  const state = (year, month) => ({
    currentView: 'date',
    currentYear: year,
    currentMonth: month - 1,
  })
  assert.equal(canNavigateMenuCalendar(state(2026, 1), -1, calendar), false)
  assert.equal(canNavigateMenuCalendar(state(2026, 1), 1, calendar), true)
  assert.equal(canNavigateMenuCalendar(state(2027, 12), 1, calendar), false)
  assert.equal(canNavigateMenuCalendar(state(2027, 12), -1, calendar), true)
  assert.equal(canNavigateMenuCalendar(state(2026, 9), -1, calendar, true), false)
  assert.equal(canNavigateMenuCalendar(state(2026, 9), 1, calendar, true), true)
  assert.equal(canNavigateMenuCalendar(state(2027, 9), 1, calendar, true), false)
  assert.equal(canNavigateMenuCalendar(state(2027, 9), -1, calendar, true), true)
  assert.equal(canNavigateMenuCalendar(state(2026, 9), 1, null), false)
})

test('월·연도 선택 화면도 범위 밖 연도와 10년 구간으로 이동하지 않는다', () => {
  const state = (view, year) => ({ currentView: view, currentYear: year, currentMonth: 8 })
  assert.equal(canNavigateMenuCalendar(state('month', 2026), -1, calendar), false)
  assert.equal(canNavigateMenuCalendar(state('month', 2026), 1, calendar), true)
  assert.equal(canNavigateMenuCalendar(state('month', 2027), 1, calendar), false)
  assert.equal(canNavigateMenuCalendar(state('year', 2026), -1, calendar), false)
  assert.equal(canNavigateMenuCalendar(state('year', 2026), 1, calendar), false)
  const extended = { ...calendar, supportedStartDate: '2019-07-01', supportedEndDate: '2031-03-15' }
  assert.equal(canNavigateMenuCalendar(state('year', 2026), -1, extended), true)
  assert.equal(canNavigateMenuCalendar(state('year', 2026), 1, extended), true)
  assert.equal(canNavigateMenuCalendar(state('date', 2031), -1, extended), false)
  assert.equal(
    canNavigateMenuCalendar({ ...state('date', 2031), currentMonth: 1 }, 1, extended),
    true,
  )
  assert.equal(
    canNavigateMenuCalendar({ ...state('date', 2031), currentMonth: 2 }, 1, extended),
    false,
  )
})
