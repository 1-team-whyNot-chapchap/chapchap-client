/** 공개 메뉴 안내용 날짜 계산. 실제 구독 시작일·주문 생성 정책에는 사용하지 않는다. */
export function parsePublicDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export function getKstDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type) => parts.find((item) => item.type === type).value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function publicDateLabel(value) {
  const date = parsePublicDate(value)
  return date ? `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일` : ''
}

export function isSelectableDate(value, calendar) {
  const date = parsePublicDate(value)
  return Boolean(
    date &&
    calendar &&
    value >= calendar.supportedStartDate &&
    value <= calendar.supportedEndDate &&
    date.getUTCDay() !== 0 &&
    !calendar.holidays.some((holiday) => holiday.holidayDate === value),
  )
}

export function findMenuDate(today, calendar) {
  const date = parsePublicDate(today)
  if (
    !date ||
    !calendar ||
    today < calendar.supportedStartDate ||
    today > calendar.supportedEndDate
  )
    return null
  while (date.toISOString().slice(0, 10) <= calendar.supportedEndDate) {
    const value = date.toISOString().slice(0, 10)
    if (isSelectableDate(value, calendar)) return value
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return null
}

export function shiftMonth(month, delta) {
  const date = parsePublicDate(`${month}-01`)
  if (!date || !Number.isInteger(delta)) return null
  date.setUTCMonth(date.getUTCMonth() + delta)
  return date.toISOString().slice(0, 7)
}

export function monthDates(month) {
  const date = parsePublicDate(`${month}-01`)
  if (!date) return []
  const days = Array.from({ length: date.getUTCDay() }, () => null)
  while (date.toISOString().startsWith(month)) {
    days.push(date.toISOString().slice(0, 10))
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return days
}
