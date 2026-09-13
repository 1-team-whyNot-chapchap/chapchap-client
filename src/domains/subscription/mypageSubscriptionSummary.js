import { subscriptionStatusLabel } from './currentSubscriptionDisplay.js'

const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function summaryToday(now = new Date()) {
  const parts = Object.fromEntries(
    kstDateFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

// 서버가 만든 주문 중 가까운 날짜를 고를 뿐, 배송일이나 배송 완료 상태를 계산하지 않는다.
export function selectNextDelivery(orders, today = summaryToday()) {
  if (!Array.isArray(orders) || !isDate(today)) return null
  return orders.reduce((next, order) => {
    if (order?.status !== 'ACTIVE' || !isDate(order.deliveryDate) || order.deliveryDate < today)
      return next
    return !next || order.deliveryDate < next.deliveryDate ? order : next
  }, null)
}

export function currentSubscriptionSummary(subscription) {
  if (!subscription) return { label: '구독 내역이 없어요.', planName: '', period: '' }
  return {
    label: subscriptionStatusLabel(subscription.subscriptionStatus),
    planName: subscription.plan?.name || '',
    period:
      isDate(subscription.periodStartDate) && isDate(subscription.periodEndDate)
        ? `${subscription.periodStartDate} ~ ${subscription.periodEndDate}`
        : '',
  }
}
