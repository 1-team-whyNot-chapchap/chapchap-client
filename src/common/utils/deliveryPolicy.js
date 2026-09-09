import dayjs from 'dayjs'

export const MINIMUM_DELIVERY_DATE_COUNT = 3
export const SUBSCRIPTION_PERIOD_DAYS = 28

export function getSubscriptionPeriod(now = dayjs()) {
  const start = getNextMonday(now)
  return { start, end: start.add(SUBSCRIPTION_PERIOD_DAYS - 1, 'day') }
}

export function getSubscriptionCalendarDates(month, weekdays, now = dayjs()) {
  const { start, end } = getSubscriptionPeriod(now)
  const monthStart = dayjs(month).startOf('month')
  const monthEnd = monthStart.endOf('month')
  const gridStart = monthStart.subtract(monthStart.day(), 'day')
  const gridEnd = monthEnd.add(6 - monthEnd.day(), 'day')
  return Array.from({ length: gridEnd.diff(gridStart, 'day') + 1 }, (_, index) => {
    const date = gridStart.add(index, 'day')
    const isAvailable = !date.isBefore(start, 'day') && !date.isAfter(end, 'day')
    return {
      value: date.format('YYYY-MM-DD'),
      dayNumber: date.date(),
      weekday: date.day(),
      isCurrentMonth: date.isSame(monthStart, 'month'),
      isAvailable,
      isAfterPeriod: date.isAfter(end, 'day'),
      isDeliveryDay: isAvailable && date.day() !== 0 && weekdays.includes(date.day()),
    }
  })
}

// 신청일과 관계없이 다음 주 월요일을 첫 배송 선택 가능일로 계산합니다.
// day()은 일요일 0, 월요일 1을 반환하므로 월요일에 신청해도 7일 뒤를 반환합니다.
export function getNextMonday(now = dayjs()) {
  const applicationDate = dayjs(now).startOf('day')
  const daysUntilNextMonday = (8 - applicationDate.day()) % 7 || 7

  return applicationDate.add(daysUntilNextMonday, 'day')
}

export function formatDeliveryDateList(deliveryDates) {
  return deliveryDates.map((date) => dayjs(date).format('M월 D일')).join(' · ')
}

export function isDeliveryDateAvailable(deliveryDate, now = dayjs()) {
  const date = dayjs(deliveryDate).startOf('day')
  const firstAvailableDate = getNextMonday(now)

  return !date.isBefore(firstAvailableDate, 'day') && date.day() !== 0
}

// 반복 배송 요일은 신청 화면의 기준 값이고, 날짜 목록은 달력 미리보기와 기존 화면 호환을 위해 파생합니다.
// dayjs의 요일 값은 일요일 0, 월요일 1 ... 토요일 6입니다.
export function getDeliveryDatesForWeekdays(weekdays, now = dayjs()) {
  const selectedWeekdays = new Set(weekdays)
  const firstAvailableDate = getNextMonday(now)

  return Array.from({ length: SUBSCRIPTION_PERIOD_DAYS }, (_, index) =>
    firstAvailableDate.add(index, 'day'),
  )
    .filter((date) => date.day() !== 0 && selectedWeekdays.has(date.day()))
    .map((date) => date.format('YYYY-MM-DD'))
}

export function hasMinimumDeliveryDates(deliveryDates, now = dayjs()) {
  return (
    deliveryDates.filter((deliveryDate) => isDeliveryDateAvailable(deliveryDate, now)).length >=
    MINIMUM_DELIVERY_DATE_COUNT
  )
}

export function getDeliveryWeekSelectionCounts(deliveryDates, now = dayjs()) {
  const cycleStart = getNextMonday(now)
  const firstWeekEnd = cycleStart.add(6, 'day')
  const secondWeekEnd = cycleStart.add(13, 'day')

  return deliveryDates.reduce(
    (counts, deliveryDate) => {
      const date = dayjs(deliveryDate).startOf('day')

      if (!isDeliveryDateAvailable(date, now)) {
        return counts
      }

      if (!date.isBefore(cycleStart, 'day') && !date.isAfter(firstWeekEnd, 'day')) {
        counts.week1 += 1
      }

      if (date.isAfter(firstWeekEnd, 'day') && !date.isAfter(secondWeekEnd, 'day')) {
        counts.week2 += 1
      }

      return counts
    },
    { week1: 0, week2: 0 },
  )
}

export function hasMinimumDeliveryDatesForEachWeek(deliveryDates, now = dayjs()) {
  const counts = getDeliveryWeekSelectionCounts(deliveryDates, now)

  return counts.week1 >= MINIMUM_DELIVERY_DATE_COUNT && counts.week2 >= MINIMUM_DELIVERY_DATE_COUNT
}

export function getDeliveryChangeDeadline(deliveryDate) {
  return dayjs(deliveryDate).startOf('day').subtract(3, 'day').hour(18)
}

export function isDeliveryChangeAllowed(deliveryDate, now = dayjs()) {
  return dayjs(now).isBefore(getDeliveryChangeDeadline(deliveryDate))
}

export function formatDeliveryChangeDeadline(deliveryDate) {
  return getDeliveryChangeDeadline(deliveryDate).format('YYYY-MM-DD HH:mm')
}
