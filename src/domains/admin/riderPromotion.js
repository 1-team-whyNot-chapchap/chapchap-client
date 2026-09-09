export function normalizePhone(value) {
  const input = String(value ?? '').trim()
  if (!/^[0-9 -]+$/.test(input)) return ''
  return input.replace(/[ -]/g, '')
}

export function isValidPhone(value) {
  return (
    String(value ?? '').length <= 30 &&
    /^(?:010\d{8}|01[16789]\d{7,8})$/.test(normalizePhone(value))
  )
}

export function promotionBlockReason(user) {
  if (!user) return '검색 결과에서 사용자를 선택해 주세요.'
  if (user.status !== 'ACTIVE') return '활성 상태인 사용자만 라이더로 변경할 수 있습니다.'
  if (user.role === 'RIDER') return '이미 라이더로 등록된 사용자입니다.'
  if (user.role !== 'CUSTOMER') return '일반 고객 계정만 라이더로 변경할 수 있습니다.'
  return ''
}

export function promotionErrorMessage(error) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 관리자 계정으로 다시 로그인해 주세요.'
  if (status === 403) return '관리자 권한이 필요합니다.'
  if (status === 404) return '사용자를 찾을 수 없습니다. 다시 검색해 주세요.'
  if (status === 409 || error?.code === 'USER_CHANGED')
    return '계정 상태가 변경되었습니다. 다시 검색하고 본인을 확인해 주세요.'
  if (status === 400) return '입력 정보를 확인한 뒤 다시 검색해 주세요.'
  return '요청 결과를 확인하지 못했습니다. 다시 검색해 현재 역할을 확인해 주세요.'
}

export async function promoteConfirmedUser(api, selected, confirmed) {
  if (!confirmed || promotionBlockReason(selected)) throw new Error('본인 확인이 필요합니다.')
  const current = await api.getUser(selected.userId)
  if (
    current.userId !== selected.userId ||
    current.name !== selected.name ||
    promotionBlockReason(current)
  ) {
    const error = new Error('계정 상태가 변경되었습니다.')
    error.code = 'USER_CHANGED'
    throw error
  }
  return api.promote(selected.userId)
}
