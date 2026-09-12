import { findMenuDate, getKstDate } from './publicMenuDate.js'

/** 공개 메뉴 소개의 기준일이며, 고객의 실제 배송일을 계산하지 않는다. */
export function getHomeMenuDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const part = (type) => Number(parts.find((item) => item.type === type).value)
  const year = part('year')
  const month = part('month')
  const day = part('day')
  return { year, month, day, label: `${year}년 ${month}월 ${day}일` }
}

export function getHomeMenuDisplayDate(calendar, now = new Date()) {
  return findMenuDate(getKstDate(now), calendar)
}

export function selectHomeMenu(detail, day) {
  if (!Number.isInteger(day) || day < 1 || day > 31 || !Array.isArray(detail?.menus)) {
    return null
  }
  return detail.menus.find((menu) => menu.menuSequence === day) ?? null
}
