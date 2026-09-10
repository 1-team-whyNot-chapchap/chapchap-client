const KEY = 'chapchap.signup'
const TTL = 15 * 60 * 1000
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// KCP's ordr_idxx accepts alphanumeric IDs up to 40 characters.
export function createIdentityVerificationId(randomUUID = () => crypto.randomUUID()) {
  return randomUUID().replaceAll('-', '')
}

// Short-lived flow and consent draft only; never tokens or identity details.
export function createSignupFlow(storage, now = Date.now) {
  function clear() {
    storage.removeItem(KEY)
  }
  function read() {
    try {
      const value = JSON.parse(storage.getItem(KEY))
      if (
        !value ||
        !uuid.test(value.signupSessionId) ||
        !Number.isFinite(value.expiresAt) ||
        value.expiresAt <= now() ||
        value.expiresAt > now() + TTL
      ) {
        clear()
        return null
      }
      return value
    } catch {
      clear()
      return null
    }
  }
  function save(value) {
    storage.setItem(KEY, JSON.stringify(value))
    return value
  }
  return {
    read,
    clear,
    start(id) {
      clear()
      if (typeof id !== 'string' || !uuid.test(id))
        throw new Error('가입 세션을 확인할 수 없습니다. 다시 로그인해 주세요.')
      return save({ signupSessionId: id, expiresAt: now() + TTL })
    },
    beginVerification(id, policies = [], accepted = []) {
      const value = read()
      if (!value) throw new Error('가입 시간이 만료되었습니다. 다시 로그인해 주세요.')
      return save({
        ...value,
        identityVerificationId: id,
        returned: false,
        consentDraft: policies.map((p) => ({
          policyId: p.policyId,
          version: p.version,
          agreed: accepted.includes(p.policyId),
        })),
      })
    },
    claimSubmission() {
      const value = read()
      if (!value?.returned || value.submitted) return false
      save({ ...value, submitted: true })
      return true
    },
    acceptResult(result) {
      const value = read()
      if (
        !value ||
        !result ||
        result.code !== undefined ||
        !value.identityVerificationId ||
        result.identityVerificationId !== value.identityVerificationId
      )
        return false
      save({ ...value, returned: true })
      return true
    },
  }
}

export function restoreConsent(draft, policies) {
  if (
    !Array.isArray(draft) ||
    !policies.length ||
    draft.length !== policies.length ||
    policies.some(
      (p) =>
        !draft.some(
          (d) =>
            d.policyId === p.policyId &&
            d.version === p.version &&
            typeof d.agreed === 'boolean' &&
            (!p.required || d.agreed),
        ),
    )
  )
    return null
  return draft.filter((d) => d.agreed).map((d) => d.policyId)
}

export function validatePolicies(value) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    !value.some((p) => p.required === true) ||
    value.some(
      (p) =>
        !Number.isSafeInteger(p.policyId) ||
        p.policyId <= 0 ||
        typeof p.required !== 'boolean' ||
        typeof p.title !== 'string' ||
        !p.title.trim() ||
        typeof p.content !== 'string' ||
        !p.content.trim(),
    ) ||
    new Set(value.map((p) => p.policyId)).size !== value.length
  )
    throw new Error('현재 가입 약관을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  return value
}

export function signupError(error) {
  const status = error.response?.status
  if (status === 404 || status === 409)
    return '가입 세션 또는 본인인증 결과를 사용할 수 없습니다. 다시 로그인하여 가입을 진행해 주세요.'
  if (status === 400)
    return '본인인증 정보 또는 약관이 유효하지 않습니다. 다시 로그인하여 최신 약관과 본인인증을 확인해 주세요.'
  return '가입 결과를 확인하지 못했습니다. 이미 가입되었을 수 있으니 먼저 다시 로그인해 주세요.'
}
