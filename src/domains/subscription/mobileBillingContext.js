import { createFirstSubscriptionRequest } from './firstSubscriptionForm.js'

export const BILLING_CALLBACK_PATH = '/subscription/payment-methods/callback'
export const BILLING_CONTEXT_KEY = 'subscription.mobile-billing.v1'
export const BILLING_CONTEXT_TTL = 30 * 60 * 1000
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const billingUserId = (user) =>
  user?.role === 'CUSTOMER' && typeof user.userId === 'string' && /^\d+$/.test(user.userId)
    ? user.userId
    : null

// Only whitelisted input is copied. No billing key, token, card or address text is persisted.
export function billingDraft(application) {
  const request = createFirstSubscriptionRequest(application.planId, application.deliveryConditions)
  return {
    ...request,
    acceptedTerms:
      application.termsConfirmed && application.requiredTerms?.length
        ? application.requiredTerms
            .filter((term) => application.agreedTerms[term.termsType])
            .map(({ termsType, version }) => ({ termsType, version }))
        : [],
  }
}

function cleanDraft(draft) {
  if (!draft) return null
  const request = createFirstSubscriptionRequest(draft.planId, draft.deliveryConditions)
  const acceptedTerms = Array.isArray(draft.acceptedTerms)
    ? draft.acceptedTerms
        .filter((term) => typeof term?.termsType === 'string' && typeof term.version === 'string')
        .map(({ termsType, version }) => ({ termsType, version }))
    : []
  return { ...request, acceptedTerms }
}

export function createMobileBillingContext(
  storage,
  now = Date.now,
  randomId = () => crypto.randomUUID(),
) {
  const clear = () => storage.removeItem(BILLING_CONTEXT_KEY)
  function read() {
    try {
      const record = JSON.parse(storage.getItem(BILLING_CONTEXT_KEY))
      if (!record) return null
      if (
        record.version !== 1 ||
        !uuid.test(record.id) ||
        typeof record.userId !== 'string' ||
        !/^\d+$/.test(record.userId) ||
        !['pending', 'consumed'].includes(record.status) ||
        !Number.isFinite(record.createdAt) ||
        now() < record.createdAt ||
        now() - record.createdAt >= BILLING_CONTEXT_TTL ||
        !['methods', 'subscription'].includes(record.source)
      )
        throw new Error('invalid context')
      const draft = record.draft ? cleanDraft(record.draft) : null
      if (record.source === 'subscription' && record.status === 'pending' && !draft)
        throw new Error('missing draft')
      return {
        version: 1,
        id: record.id,
        userId: record.userId,
        source: record.source,
        createdAt: record.createdAt,
        status: record.status,
        draft,
      }
    } catch {
      clear()
      return null
    }
  }
  return {
    read,
    clear,
    begin({ userId, source, draft, origin }) {
      if (
        typeof userId !== 'string' ||
        !/^\d+$/.test(userId) ||
        !['methods', 'subscription'].includes(source)
      )
        throw new Error('로그인과 등록 시작 화면을 확인해 주세요.')
      const site = new URL(origin)
      if (!['http:', 'https:'].includes(site.protocol) || site.origin !== origin)
        throw new Error('카드 등록 복귀 주소를 확인할 수 없습니다.')
      if (read()?.status === 'pending')
        throw new Error('진행 중인 카드 등록이 있습니다. 원래 화면에서 다시 확인해 주세요.')
      const record = {
        version: 1,
        id: randomId(),
        userId,
        source,
        createdAt: now(),
        status: 'pending',
        draft: source === 'subscription' ? cleanDraft(draft) : null,
      }
      if (!uuid.test(record.id) || (source === 'subscription' && !record.draft))
        throw new Error('신청 정보를 보관하지 못했습니다. 다시 확인해 주세요.')
      storage.setItem(BILLING_CONTEXT_KEY, JSON.stringify(record))
      if (read()?.id !== record.id) throw new Error('등록 시작 정보를 보관하지 못했습니다.')
      const url = new URL(BILLING_CALLBACK_PATH, origin)
      url.searchParams.set('billingRequest', record.id)
      return { id: record.id, redirectUrl: url.href }
    },
    claim(id, userId) {
      const record = read()
      if (!record || record.status !== 'pending' || record.id !== id || record.userId !== userId)
        return null
      // Persist before POST: reload/back cannot replay an uncertain write.
      storage.setItem(
        BILLING_CONTEXT_KEY,
        JSON.stringify({ ...record, status: 'consumed', draft: null }),
      )
      if (read()?.status !== 'consumed') throw new Error('등록 처리 상태를 보관하지 못했습니다.')
      return record
    },
  }
}

export function billingReturnTarget(record) {
  return record?.source === 'subscription' && record.draft
    ? { path: '/subscribe/payment', query: { planId: record.draft.planId } }
    : { path: '/mypage/payment-methods' }
}
