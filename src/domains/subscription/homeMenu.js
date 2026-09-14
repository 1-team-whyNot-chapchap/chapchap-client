import { canSelectMenuDate, formatMenuDate, parseMenuDate } from '../product/utils/menuCalendar.js'

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

/** 공휴일 API의 제공 범위 안에서 오늘 또는 가장 가까운 이후 유효 날짜를 선택한다. */
export function resolveHomeMenuDate(calendar, now = new Date()) {
  if (!calendar) return null
  const today = getHomeMenuDate(now)
  const cursor = new Date(today.year, today.month - 1, today.day)
  let isoDate = formatMenuDate(cursor)
  if (isoDate < calendar.supportedStartDate || isoDate > calendar.supportedEndDate) return null

  while (isoDate <= calendar.supportedEndDate) {
    if (canSelectMenuDate(isoDate, calendar)) {
      const date = parseMenuDate(isoDate)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
      return { isoDate, day, label: `${month}월 ${day}일(${weekday})` }
    }
    cursor.setDate(cursor.getDate() + 1)
    isoDate = formatMenuDate(cursor)
  }
  return null
}

export function selectHomeMenu(detail, day) {
  if (!Number.isInteger(day) || day < 1 || day > 31 || !Array.isArray(detail?.menus)) {
    return null
  }
  return detail.menus.find((menu) => menu.menuSequence === day) ?? null
}
