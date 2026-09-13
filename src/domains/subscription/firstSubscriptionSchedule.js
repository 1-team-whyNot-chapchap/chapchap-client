import { DELIVERY_WEEKDAYS } from './firstSubscriptionForm.js'
import { canSelectMenuDate } from '../product/utils/menuCalendar.js'

const kstFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

// Date-only arithmetic uses UTC so browser timezone/DST never changes a calendar day.
export function shiftScheduleDate(value, days) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function subscriptionReference(now = new Date()) {
  const parts = Object.fromEntries(
    kstFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  )
  const today = `${parts.year}-${parts.month}-${parts.day}`
  let reflectionDate = shiftScheduleDate(today, Number(parts.hour) < 14 ? 1 : 2)
  if (new Date(`${reflectionDate}T00:00:00Z`).getUTCDay() === 0)
    reflectionDate = shiftScheduleDate(reflectionDate, 1)
  return { today, reflectionDate }
}

export function calculateFirstSubscriptionSchedule(now, weekdays, calendar) {
  const { today, reflectionDate } = subscriptionReference(now)
  const empty = {
    today,
    reflectionDate,
    periodStartDate: null,
    periodEndDate: null,
    deliveryDates: [],
  }
  if (!weekdays.length) return { ...empty, status: 'unselected' }
  if (!calendar) return { ...empty, status: 'unavailable' }
  if (weekdays.some((weekday) => !DELIVERY_WEEKDAYS.includes(weekday)))
    return { ...empty, status: 'invalid' }
  if (reflectionDate < calendar.supportedStartDate || reflectionDate > calendar.supportedEndDate)
    return { ...empty, status: 'out-of-range' }

  const matches = (date) =>
    weekdays.includes(DELIVERY_WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay() - 1])
  for (let offset = 0; offset <= 366; offset++) {
    const start = shiftScheduleDate(reflectionDate, offset)
    if (start > calendar.supportedEndDate) break
    if (!matches(start) || !canSelectMenuDate(start, calendar)) continue
    const end = shiftScheduleDate(start, 27)
    if (end > calendar.supportedEndDate) break
    const deliveryDates = Array.from({ length: 28 }, (_, day) =>
      shiftScheduleDate(start, day),
    ).filter((date) => matches(date) && canSelectMenuDate(date, calendar))
    return {
      today,
      reflectionDate,
      status: 'ready',
      periodStartDate: start,
      periodEndDate: end,
      deliveryDates,
    }
  }
  return { ...empty, status: 'out-of-range' }
}
