import {
  BILLING_CALLBACK_PATH,
  billingUserId,
  createMobileBillingContext,
} from './mobileBillingContext.js'
import { paymentMethodError } from './paymentMethodManager.js'

let capturedResult = null
let returnNotice = null

export const mobileBillingContext = () => createMobileBillingContext(window.sessionStorage)

// Called before the router starts. Sensitive fields never become router query or history state.
export function captureMobileBillingReturn(win = window) {
  const url = new URL(win.location.href)
  const hashPath = url.hash.slice(1).split('?')[0]
  if (url.pathname !== BILLING_CALLBACK_PATH && hashPath !== BILLING_CALLBACK_PATH) return false
  const query =
    url.pathname === BILLING_CALLBACK_PATH
      ? url.searchParams
      : new URLSearchParams(url.hash.split('?')[1] || '')
  const one = (name) => (query.getAll(name).length === 1 ? query.get(name) : null)
  const result = {
    id: one('billingRequest'),
    billingKey: one('billingKey'),
    failed: query.has('code'),
    transactionType: one('transactionType'),
  }
  win.history.replaceState(null, '', `/#${BILLING_CALLBACK_PATH}`)
  capturedResult = result
  return true
}

export function takeMobileBillingResult() {
  const result = capturedResult
  capturedResult = null
  return result
}

export function clearMobileBilling() {
  capturedResult = null
  returnNotice = null
  try {
    mobileBillingContext().clear()
  } catch {
    /* Disabled storage is already fail-closed. */
  }
}

export function setBillingReturnNotice(userId, message) {
  returnNotice = { userId, message }
}
export function takeBillingReturnNotice(userId) {
  const notice = returnNotice
  returnNotice = null
  return notice?.userId === userId ? notice.message : ''
}

// Browser Back without a callback restores input, never invents an issuance success.
export function recoverAbandonedBilling(user, source, planId, context = mobileBillingContext()) {
  const record = context.read()
  if (!record || record.status !== 'pending') return null
  const userId = billingUserId(user)
  if (!userId || record.userId !== userId) {
    context.clear()
    return null
  }
  if (record.source !== source || (source === 'subscription' && record.draft?.planId !== planId))
    return null
  const claimed = context.claim(record.id, userId)
  setBillingReturnNotice(
    userId,
    '카드 등록 완료를 확인하지 못했습니다. 목록을 확인한 뒤 다시 등록해 주세요.',
  )
  return claimed
}

export async function completeMobileBilling({ result, context, getUser, register }) {
  let key = result?.billingKey
  if (result) result.billingKey = null
  const userId = billingUserId(getUser())
  const rejected = {
    record: null,
    message: '유효한 카드 등록 요청이 없습니다. 원래 화면에서 다시 시작해 주세요.',
  }
  if (!userId || !result?.id) return rejected
  const record = context.claim(result.id, userId)
  if (!record) return rejected
  if (
    result.failed ||
    typeof key !== 'string' ||
    !key.trim() ||
    key.length > 4096 ||
    key === 'NEEDS_CONFIRMATION' ||
    (result.transactionType && result.transactionType !== 'ISSUE_BILLING_KEY')
  )
    return {
      record,
      message: '카드 등록이 취소되었거나 발급되지 않았습니다. 기존 결제수단은 유지됩니다.',
    }
  if (billingUserId(getUser()) !== userId) return rejected
  try {
    const saved = await register(key)
    if (billingUserId(getUser()) !== userId) return rejected
    const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!validId.test(saved?.paymentMethodId) || typeof saved?.isCurrent !== 'boolean')
      throw new Error('invalid response')
    return {
      record,
      message: saved.isCurrent
        ? '카드가 등록되어 현재 결제수단으로 선택되었습니다.'
        : '카드가 추가 등록되었습니다. 사용할 카드를 현재 결제수단으로 선택해 주세요.',
    }
  } catch (error) {
    if (billingUserId(getUser()) !== userId) return rejected
    return { record, message: paymentMethodError(error, '카드 등록') }
  } finally {
    // Persisted context is only a consumed marker; never replay this callback.
    result.billingKey = null
    key = null
  }
}
