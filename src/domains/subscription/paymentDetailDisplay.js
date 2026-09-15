const ORIGINAL_TYPES = new Set([
  'FIRST_SUBSCRIPTION_PAYMENT',
  'REGULAR_PAYMENT',
  'SETTING_CHANGE_PAYMENT',
])

export function showsOriginalAmounts(item) {
  return item?.status === 'SUCCESS' && ORIGINAL_TYPES.has(item.paymentType)
}

export function displayHistoryAmount(value) {
  return value == null ? '금액 확인 필요' : `${Number(value).toLocaleString('ko-KR')}원`
}

export function paymentCardLabel(item) {
  const attempts = [...(item?.attempts || [])].sort((a, b) => b.attemptSequence - a.attemptSequence)
  const attempt =
    item?.status === 'SUCCESS' ? attempts.find((value) => value.result === 'SUCCESS') : attempts[0]
  return [attempt?.cardCompany, attempt?.maskedCardNumber].filter(Boolean).join(' · ')
}
