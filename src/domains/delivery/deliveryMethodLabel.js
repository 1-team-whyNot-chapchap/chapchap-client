const deliveryMethodLabels = {
  DIRECT: '직접 전달',
  DOORSTEP: '문 앞 비대면 배송',
  DOOR: '문 앞 전달',
  GUARD: '경비실 전달',
  OTHER: '기타 요청',
}

export function deliveryMethodLabel(value) {
  return deliveryMethodLabels[value] || '확인 중'
}
