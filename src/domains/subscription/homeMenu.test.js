import test from 'node:test'
import assert from 'node:assert/strict'
import { getHomeMenuDate, resolveHomeMenuDate, selectHomeMenu } from './homeMenu.js'

const calendar = {
  supportedStartDate: '2026-01-01',
  supportedEndDate: '2027-12-31',
  holidays: [
    { holidayDate: '2026-09-24', holidayName: '추석 연휴' },
    { holidayDate: '2026-09-25', holidayName: '추석' },
    { holidayDate: '2026-09-26', holidayName: '추석 연휴' },
    { holidayDate: '2027-01-01', holidayName: '신정' },
  ],
}

test('KST 자정 전후의 일자를 구분한다', () => {
  assert.equal(getHomeMenuDate(new Date('2026-09-12T14:59:59Z')).day, 12)
  assert.equal(getHomeMenuDate(new Date('2026-09-12T15:00:00Z')).day, 13)
})

test('월말·월초와 연도 경계도 한국 날짜로 선택한다', () => {
  for (const [instant, year, month, day] of [
    ['2026-01-31T14:59:59Z', 2026, 1, 31],
    ['2026-01-31T15:00:00Z', 2026, 2, 1],
    ['2026-02-28T15:00:00Z', 2026, 3, 1],
    ['2028-02-28T15:00:00Z', 2028, 2, 29],
    ['2026-12-31T15:00:00Z', 2027, 1, 1],
  ]) {
    assert.deepEqual(getHomeMenuDate(new Date(instant)), {
      year,
      month,
      day,
      label: `${year}년 ${month}월 ${day}일`,
    })
  }
})

test('메뉴 배열 위치가 아닌 순번으로 선택하며 응답의 모든 안내 필드를 보존한다', () => {
  const menu = {
    menuSequence: 12,
    name: '실제 메뉴',
    description: '메뉴 설명',
    imageUrl: null,
    nutritionInfo: '영양 정보',
    allergenInfo: '대두',
  }
  const detail = { menus: [menu, { menuSequence: 1, name: '다른 날짜' }] }
  assert.equal(selectHomeMenu(detail, 12), menu)
})

test('메뉴 또는 오늘 순번 누락 시 다른 날짜 메뉴를 대신 반환하지 않는다', () => {
  for (const detail of [null, {}, { menus: [] }, { menus: [{ menuSequence: 1 }] }]) {
    assert.equal(selectHomeMenu(detail, 12), null)
  }
  for (const day of [0, 32, 1.5, '1']) {
    assert.equal(selectHomeMenu({ menus: [{ menuSequence: 1 }] }, day), null)
  }
})

test('평일과 공휴일이 아닌 토요일은 오늘 메뉴를 표시한다', () => {
  for (const [date, label] of [
    ['2026-09-11', '9월 11일(금)'],
    ['2026-09-12', '9월 12일(토)'],
  ]) {
    const selected = resolveHomeMenuDate(calendar, new Date(`${date}T12:00:00+09:00`))
    assert.equal(selected.isoDate, date)
    assert.equal(selected.label, label)
  }
})

test('일요일은 다음 월요일로, 연속 공휴일과 일요일은 모두 건너뛴다', () => {
  assert.deepEqual(resolveHomeMenuDate(calendar, new Date('2026-09-13T12:00:00+09:00')), {
    isoDate: '2026-09-14',
    day: 14,
    label: '9월 14일(월)',
  })
  for (const date of ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']) {
    assert.equal(
      resolveHomeMenuDate(calendar, new Date(`${date}T12:00:00+09:00`)).isoDate,
      '2026-09-28',
    )
  }
})

test('선택된 날짜의 순번을 모든 플랜에 동일하게 적용한다', () => {
  const selected = resolveHomeMenuDate(calendar, new Date('2026-09-13T12:00:00+09:00'))
  for (const name of ['가정식', '간편식', '든든식']) {
    const menu = { menuSequence: 14, name }
    assert.equal(selectHomeMenu({ menus: [{ menuSequence: 13 }, menu] }, selected.day), menu)
  }
  assert.equal(selectHomeMenu({ menus: [{ menuSequence: 13 }] }, selected.day), null)
})

test('휴일 탐색은 월말·연말·윤년 경계를 넘되 날짜 표시도 함께 바뀐다', () => {
  const extended = {
    ...calendar,
    supportedEndDate: '2028-12-31',
    holidays: [...calendar.holidays, { holidayDate: '2026-12-31' }, { holidayDate: '2028-02-28' }],
  }
  for (const [now, date, label] of [
    ['2026-05-31', '2026-06-01', '6월 1일(월)'],
    ['2026-12-31', '2027-01-02', '1월 2일(토)'],
    ['2028-02-27', '2028-02-29', '2월 29일(화)'],
  ]) {
    const selected = resolveHomeMenuDate(extended, new Date(`${now}T12:00:00+09:00`))
    assert.equal(selected.isoDate, date)
    assert.equal(selected.label, label)
  }
})

test('오늘이 제공 범위 밖이면 범위의 첫 날짜나 과거 날짜로 대체하지 않는다', () => {
  for (const date of ['2025-12-31', '2028-01-01'])
    assert.equal(resolveHomeMenuDate(calendar, new Date(`${date}T12:00:00+09:00`)), null)
  assert.equal(resolveHomeMenuDate(null), null)
})

test('범위 끝에 유효 날짜가 없으면 null, 마지막 날이 유효하면 그대로 선택한다', () => {
  const closed = { ...calendar, supportedEndDate: '2026-09-27' }
  assert.equal(resolveHomeMenuDate(closed, new Date('2026-09-24T12:00:00+09:00')), null)
  assert.equal(
    resolveHomeMenuDate(calendar, new Date('2027-12-31T12:00:00+09:00')).isoDate,
    '2027-12-31',
  )
})

test('휴일 선택도 브라우저 시간대가 아닌 KST 자정을 기준으로 한다', () => {
  assert.equal(
    resolveHomeMenuDate(calendar, new Date('2026-09-12T14:59:59Z')).isoDate,
    '2026-09-12',
  )
  assert.equal(
    resolveHomeMenuDate(calendar, new Date('2026-09-12T15:00:00Z')).isoDate,
    '2026-09-14',
  )
})
