import {
  DELIVERY_WEEKDAYS,
  DELIVERY_WEEKDAY_LABELS,
  DELIVERY_TIME_SLOTS,
} from './firstSubscriptionForm.js'

const addressText = (address) =>
  [address.name, address.addressLine1, address.addressLine2].filter(Boolean).join(' · ')
const timeText = (value) => DELIVERY_TIME_SLOTS.find((slot) => slot.value === value)?.label

function field(key, label, before, after, beforeKey = before, afterKey = after) {
  return { key, label, before, after, changed: beforeKey !== afterKey }
}

// 표시용 값만 만들고 현재 구독 원본과 편집 중인 입력은 변경하지 않는다.
export function createSettingChangeComparison(subscription, draft, plans, addresses) {
  if (
    !subscription?.plan?.planId ||
    !Array.isArray(subscription.deliveryConditions) ||
    !draft?.planId ||
    !draft.deliveryConditions?.length
  )
    return null
  const nextPlan = plans.find((plan) => plan.planId === draft.planId)
  if (!subscription.plan.name || !nextPlan?.name) return null
  const beforeByDay = new Map(subscription.deliveryConditions.map((item) => [item.weekday, item]))
  const afterByDay = new Map(draft.deliveryConditions.map((item) => [item.weekday, item]))
  const groups = [
    {
      key: 'plan',
      title: '플랜',
      status: 'kept',
      fields: [
        field(
          'plan',
          '플랜',
          subscription.plan.name,
          nextPlan.name,
          subscription.plan.planId,
          draft.planId,
        ),
      ],
    },
  ]
  for (const weekday of DELIVERY_WEEKDAYS) {
    const before = beforeByDay.get(weekday)
    const after = afterByDay.get(weekday)
    if (!before && !after) continue
    const oldAddress = before?.address
    const newAddress = after && addresses.find((address) => address.addressId === after.addressId)
    if (
      (before &&
        (!oldAddress?.addressId ||
          !oldAddress.addressLine1 ||
          !Number.isInteger(before.mealQuantity) ||
          !timeText(before.deliveryTimeSlot))) ||
      (after &&
        (!newAddress?.addressId ||
          !newAddress.addressLine1 ||
          !Number.isInteger(after.mealQuantity) ||
          !timeText(after.deliveryTimeSlot)))
    )
      return null
    groups.push({
      key: weekday,
      title: DELIVERY_WEEKDAY_LABELS[weekday],
      status: !before ? 'added' : !after ? 'removed' : 'kept',
      fields: [
        field(
          'address',
          '배송지',
          before ? addressText(oldAddress) : null,
          after ? addressText(newAddress) : null,
          oldAddress?.addressId,
          newAddress?.addressId,
        ),
        field(
          'quantity',
          '식사 수량',
          before ? `${before.mealQuantity}식` : null,
          after ? `${after.mealQuantity}식` : null,
        ),
        field(
          'time',
          '배송 시간대',
          before ? timeText(before.deliveryTimeSlot) : null,
          after ? timeText(after.deliveryTimeSlot) : null,
        ),
      ],
    })
  }
  return groups
}
