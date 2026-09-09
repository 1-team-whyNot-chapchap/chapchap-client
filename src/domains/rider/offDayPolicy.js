export const offDayReasons = ['연차', '병가', '기타']

// 한국 날짜 기준 5일 전까지 신청 가능 (영업일이 아닌 달력 날짜).
export function earliestOffDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type).value)
  return new Date(value('year'), value('month') - 1, value('day') + 5)
}

export function isOffDayAllowed(date, now = new Date()) {
  return date instanceof Date && !Number.isNaN(date.getTime()) && date >= earliestOffDay(now)
}
