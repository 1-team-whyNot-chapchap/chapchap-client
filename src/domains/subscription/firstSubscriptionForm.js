import { SubscriptionApiError } from './api/subscriptionApiError.js'

export const DELIVERY_WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export const DELIVERY_WEEKDAY_LABELS = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
}

export const DELIVERY_TIME_SLOTS = [
  { value: 'TIME_1100_1300', label: '11:00 ~ 13:00' },
  { value: 'TIME_1700_1900', label: '17:00 ~ 19:00' },
]

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function invalid(message) {
  throw new SubscriptionApiError(message, { status: 400, code: 'COMMON_001' })
}

export function createDeliveryCondition(weekday) {
  return {
    weekday,
    addressId: '',
    mealQuantity: 1,
    deliveryTimeSlot: 'TIME_1100_1300',
  }
}

export function createFirstSubscriptionRequest(planId, deliveryConditions) {
  if (typeof planId !== 'string' || !UUID_V4.test(planId)) invalid('올바른 플랜을 선택해 주세요.')
  if (!Array.isArray(deliveryConditions) || !deliveryConditions.length) {
    invalid('배송 요일을 한 개 이상 선택해 주세요.')
  }
  if (deliveryConditions.length > DELIVERY_WEEKDAYS.length)
    invalid('배송 요일은 최대 6개까지 선택할 수 있어요.')

  const weekdays = new Set()
  const conditions = deliveryConditions.map((condition) => {
    if (!DELIVERY_WEEKDAYS.includes(condition?.weekday) || weekdays.has(condition.weekday)) {
      invalid('월요일부터 토요일까지 서로 다른 배송 요일을 선택해 주세요.')
    }
    weekdays.add(condition.weekday)
    if (typeof condition.addressId !== 'string' || !UUID_V4.test(condition.addressId)) {
      invalid(`${DELIVERY_WEEKDAY_LABELS[condition.weekday]} 배송지를 선택해 주세요.`)
    }
    if (
      !Number.isInteger(condition.mealQuantity) ||
      condition.mealQuantity < 1 ||
      condition.mealQuantity > 6
    ) {
      invalid(`${DELIVERY_WEEKDAY_LABELS[condition.weekday]} 식사 수량은 1~6개로 설정해 주세요.`)
    }
    if (!DELIVERY_TIME_SLOTS.some((slot) => slot.value === condition.deliveryTimeSlot)) {
      invalid(`${DELIVERY_WEEKDAY_LABELS[condition.weekday]} 배송 시간대를 선택해 주세요.`)
    }
    return {
      weekday: condition.weekday,
      mealQuantity: condition.mealQuantity,
      addressId: condition.addressId,
      deliveryTimeSlot: condition.deliveryTimeSlot,
    }
  })

  return { planId, deliveryConditions: conditions }
}
