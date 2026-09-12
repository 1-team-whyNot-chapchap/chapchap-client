import test from 'node:test'
import assert from 'node:assert/strict'
import { getHomeMenuDate, getHomeMenuDisplayDate, selectHomeMenu } from './homeMenu.js'

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

test('메인은 평일에는 오늘, 일요일·공휴일에는 이후 유효 날짜 메뉴를 선택한다', () => {
  const calendar = {
    supportedStartDate: '2026-01-01',
    supportedEndDate: '2027-12-31',
    holidays: [{ holidayDate: '2026-10-09' }],
  }
  assert.equal(
    getHomeMenuDisplayDate(calendar, new Date('2026-09-12T12:00:00+09:00')),
    '2026-09-12',
  )
  assert.equal(
    getHomeMenuDisplayDate(calendar, new Date('2026-09-13T12:00:00+09:00')),
    '2026-09-14',
  )
  assert.equal(
    getHomeMenuDisplayDate(calendar, new Date('2026-10-09T12:00:00+09:00')),
    '2026-10-10',
  )
  assert.equal(getHomeMenuDisplayDate(null), null)
})
