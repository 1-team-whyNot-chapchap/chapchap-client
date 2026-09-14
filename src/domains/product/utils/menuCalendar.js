export function parseMenuDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null
}

export function formatMenuDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function canSelectMenuDate(value, calendar) {
  const date = parseMenuDate(value)
  return Boolean(
    date &&
    calendar &&
    value >= calendar.supportedStartDate &&
    value <= calendar.supportedEndDate &&
    date.getDay() !== 0 &&
    !calendar.holidays.some((holiday) => holiday.holidayDate === value),
  )
}

export function menuDateError(value, calendar) {
  if (!parseMenuDate(value)) return '올바르지 않은 날짜입니다. 달력에서 날짜를 선택해 주세요.'
  if (value < calendar.supportedStartDate || value > calendar.supportedEndDate)
    return '조회 가능한 기간이 아닙니다. 달력에서 날짜를 선택해 주세요.'
  if (!canSelectMenuDate(value, calendar))
    return '일요일과 공휴일은 선택할 수 없습니다. 다른 날짜를 선택해 주세요.'
  return ''
}

// PrimeVue의 공개 PT 상태를 읽어 이동할 월·연도·10년 구간과 제공 범위의 교집합을 확인한다.
export function canNavigateMenuCalendar(state, direction, calendar, shiftYear = false) {
  if (!calendar) return false
  const start = parseMenuDate(calendar.supportedStartDate)
  const end = parseMenuDate(calendar.supportedEndDate)
  const firstMonth = start.getFullYear() * 12 + start.getMonth()
  const lastMonth = end.getFullYear() * 12 + end.getMonth()
  if (state.currentView === 'year') {
    const year = Math.floor(state.currentYear / 10) * 10 + direction * 10
    return year * 12 <= lastMonth && (year + 10) * 12 - 1 >= firstMonth
  }
  if (state.currentView === 'month') {
    const year = state.currentYear + direction
    return year * 12 <= lastMonth && year * 12 + 11 >= firstMonth
  }
  const month = state.currentYear * 12 + state.currentMonth + direction * (shiftYear ? 12 : 1)
  return month >= firstMonth && month <= lastMonth
}

export function menuForDate(plan, value) {
  const date = parseMenuDate(value)
  return date ? (plan.menus.find((menu) => menu.menuSequence === date.getDate()) ?? null) : null
}
