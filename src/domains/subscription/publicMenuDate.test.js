import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parsePublicDate,
  getKstDate,
  isSelectableDate,
  findMenuDate,
  monthDates,
  shiftMonth,
  publicDateLabel,
} from './publicMenuDate.js'

const calendar = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: ['2026-09-24', '2026-09-25', '2026-09-26', '2026-12-31', '2027-01-01'].map(
    (holidayDate) => ({ holidayDate }),
  ),
}
test('URL 날짜는 실제 존재하는 yyyy-MM-dd 문자열만 허용한다', () => {
  for (const value of [
    null,
    undefined,
    ['2026-09-12'],
    '2026-2-01',
    '2026-02-30',
    '2026-02-29',
    '2026-13-01',
    '2026-00-01',
    'bad',
  ])
    assert.equal(parsePublicDate(value), null)
  assert.ok(parsePublicDate('2028-02-29'))
  assert.equal(publicDateLabel('2026-09-12'), '2026년 9월 12일')
  assert.equal(publicDateLabel('bad'), '')
})
test('KST 자정과 월·연 경계', () => {
  assert.equal(getKstDate(new Date('2026-09-12T14:59:59Z')), '2026-09-12')
  assert.equal(getKstDate(new Date('2026-09-12T15:00:00Z')), '2026-09-13')
  assert.equal(getKstDate(new Date('2026-12-31T15:00:00Z')), '2027-01-01')
})
test('토요일·과거 유효 날짜는 허용하고 일요일·공휴일·범위 밖은 차단한다', () => {
  assert.equal(isSelectableDate('2026-09-12', calendar), true)
  assert.equal(isSelectableDate('2026-01-01', calendar), true)
  assert.equal(isSelectableDate('2027-12-31', calendar), true)
  for (const date of ['2026-09-13', '2026-09-24', '2025-12-31', '2028-01-01', 'bad'])
    assert.equal(isSelectableDate(date, calendar), false)
  assert.equal(isSelectableDate('2026-09-12', null), false)
})
test('연속 공휴일과 일요일을 건너뛰며 월·연 경계를 계산한다', () => {
  assert.equal(findMenuDate('2026-09-24', calendar), '2026-09-28')
  assert.equal(findMenuDate('2026-12-31', calendar), '2027-01-02')
  assert.equal(findMenuDate('2026-09-12', calendar), '2026-09-12')
})
test('오늘이 범위 밖이거나 다음 유효 날짜가 없으면 임의 날짜로 대체하지 않는다', () => {
  for (const date of ['2025-12-31', '2028-01-01', 'bad'])
    assert.equal(findMenuDate(date, calendar), null)
  assert.equal(findMenuDate('2026-09-12', null), null)
  assert.equal(findMenuDate('2026-09-13', { ...calendar, supportedEndDate: '2026-09-13' }), null)
})
test('달력의 월 이동과 일요일 시작 배열·윤년·짧은 달을 계산한다', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(shiftMonth('2027-01', -1), '2026-12')
  assert.equal(shiftMonth('bad', 1), null)
  assert.deepEqual(monthDates('bad'), [])
  assert.equal(monthDates('2026-09')[0], null)
  assert.equal(monthDates('2026-09')[2], '2026-09-01')
  assert.equal(monthDates('2026-09').at(-1), '2026-09-30')
  assert.equal(monthDates('2026-02').filter(Boolean).length, 28)
  assert.equal(monthDates('2028-02').filter(Boolean).length, 29)
})
