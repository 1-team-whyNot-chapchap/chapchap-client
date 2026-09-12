const DELIVERY_METHODS = new Set(['DIRECT', 'DOORSTEP', 'OTHER'])

function nullable(value) {
  const normalized = typeof value === 'string' ? value.trim() : value
  return normalized ? normalized : null
}

export function createAddressForm(address = {}) {
  return {
    name: address.name || '',
    recipientName: address.recipientName || '',
    recipientPhone: address.recipientPhone || '',
    postalCode: address.postalCode || '',
    addressLine1: address.addressLine1 || '',
    addressLine2: address.addressLine2 || '',
    deliveryMethod: DELIVERY_METHODS.has(address.deliveryMethod)
      ? address.deliveryMethod
      : 'DOORSTEP',
    otherDeliveryRequest: address.otherDeliveryRequest || '',
    entrancePassword: '',
    clearEntrancePassword: false,
  }
}

export function toAddressRequest(form, { includeEntrancePassword = true } = {}) {
  const deliveryMethod = DELIVERY_METHODS.has(form.deliveryMethod)
    ? form.deliveryMethod
    : 'DOORSTEP'
  const request = {
    name: form.name.trim(),
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
    postalCode: form.postalCode.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: nullable(form.addressLine2),
    deliveryMethod,
    otherDeliveryRequest: deliveryMethod === 'OTHER' ? nullable(form.otherDeliveryRequest) : null,
  }

  if (includeEntrancePassword) {
    const entrancePassword = nullable(form.entrancePassword)
    if (entrancePassword || form.clearEntrancePassword) {
      request.entrancePassword = form.clearEntrancePassword ? null : entrancePassword
    }
  }

  return request
}

export function formatAddress(address) {
  return [address.addressLine1, address.addressLine2].filter(Boolean).join(' ')
}

export function addressErrorMessage(error) {
  if (error?.code === 'ADDRESS_001') return '배송지를 찾을 수 없습니다. 목록을 새로고침해 주세요.'
  if (error?.code === 'ADDRESS_002')
    return '현재 배송 가능 지역이 아닙니다. 주소를 다시 확인해 주세요.'
  if (error?.code === 'ADDRESS_003')
    return '기본 배송지는 다른 배송지를 기본으로 지정한 뒤 삭제할 수 있어요.'
  if (error?.code === 'ADDRESS_004')
    return '현재 구독 또는 배송 예정 주문에서 사용 중인 배송지예요. 먼저 배송지를 변경해 주세요.'
  return (
    error?.serverMessage ||
    error?.message ||
    '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  )
}
