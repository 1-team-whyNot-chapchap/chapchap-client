const WEEKDAY_LABELS = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
}

const TIME_SLOT_LABELS = {
  TIME_1100_1300: '11:00 ~ 13:00',
  TIME_1700_1900: '17:00 ~ 19:00',
}

const STATUS_LABELS = {
  AWAITING_CONFIRMATION: '확정 대기',
  SCHEDULED: '이용 예정',
  IN_PROGRESS: '이용 중',
  CANCELLATION_SCHEDULED: '해지 예정',
  PAYMENT_FAILED: '결제 실패',
  CANCELED_BEFORE_START: '시작 전 해지',
  ENDED: '이용 종료',
}

export function subscriptionStatusLabel(status) {
  return STATUS_LABELS[status] || '상태 확인 필요'
}

export function deliveryWeekdayLabel(weekday) {
  return WEEKDAY_LABELS[weekday] || '요일 확인 필요'
}

export function deliveryTimeSlotLabel(timeSlot) {
  return TIME_SLOT_LABELS[timeSlot] || '시간대 확인 필요'
}

export function formatSubscriptionAddress(address) {
  return [address?.addressLine1, address?.addressLine2].filter(Boolean).join(' ')
}
