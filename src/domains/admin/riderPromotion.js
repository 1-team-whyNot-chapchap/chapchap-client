// 화면 검수용 데이터입니다. 실제 사용자 조회/권한 변경에 사용하지 않습니다.
export function normalizePhone(value) {
  const input = String(value ?? '').trim()
  if (!/^[0-9\s-]+$/.test(input)) return ''
  return input.replace(/[\s-]/g, '')
}

export function isValidPhone(value) {
  return /^(?:010\d{8}|01[16789]\d{7,8})$/.test(normalizePhone(value))
}

export function promotionBlockReason(user) {
  if (!user) return '검색 결과에서 사용자를 선택해 주세요.'
  if (user.status !== 'ACTIVE') return '활성 상태인 사용자만 라이더로 변경할 수 있습니다.'
  if (user.role === 'RIDER') return '이미 라이더로 등록된 사용자입니다.'
  if (user.role !== 'CUSTOMER') return '일반 고객 계정만 라이더로 변경할 수 있습니다.'
  if (user.hasActiveSubscription === true) return '진행 중인 구독을 먼저 정리해 주세요.'
  if (user.hasPendingOrders === true) return '처리 중인 주문을 먼저 정리해 주세요.'
  if (user.hasActiveSubscription !== false || user.hasPendingOrders !== false)
    return '구독·주문 상태를 확인할 수 없어 변경할 수 없습니다.'
  return ''
}

export const promotionExamples = [
  { phone: '010-0000-0001', label: '변경 가능' },
  { phone: '010-0000-0002', label: '구독 진행 중' },
  { phone: '010-0000-0003', label: '번호 중복' },
  { phone: '010-0000-0004', label: '정지 계정' },
  { phone: '010-0000-0005', label: '기존 라이더' },
  { phone: '010-0000-0006', label: '상태 확인 불가' },
  { phone: '010-0000-0007', label: '주문 처리 중' },
  { phone: '010-0000-0000', label: '검색 결과 없음' },
]

const fixture = (id, phone, name, extra = {}) => ({
  id,
  phone,
  name,
  joinedAt: '2026-09-01',
  provider: '카카오',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  hasActiveSubscription: false,
  hasPendingOrders: false,
  ...extra,
})
const previewUsers = [
  fixture('sample-001', '01000000001', '김예시'),
  fixture('sample-002', '01000000002', '이예시', { hasActiveSubscription: true }),
  fixture('sample-003', '01000000003', '박예시'),
  fixture('sample-004', '01000000003', '최예시', { provider: '구글', joinedAt: '2026-09-02' }),
  fixture('sample-005', '01000000004', '정예시', { status: 'SUSPENDED' }),
  fixture('sample-006', '01000000005', '한예시', { role: 'RIDER' }),
  fixture('sample-007', '01000000006', '윤예시', { hasPendingOrders: null }),
  fixture('sample-008', '01000000007', '강예시', { hasPendingOrders: true }),
]

export function searchPreviewUsers(phone) {
  if (!isValidPhone(phone)) return []
  return previewUsers
    .filter((user) => user.phone === normalizePhone(phone))
    .map((user) => ({ ...user }))
}
