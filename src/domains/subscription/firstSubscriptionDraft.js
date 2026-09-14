import { watch } from 'vue'
import { billingUserId, validTermsVersion } from './mobileBillingContext.js'
import { DELIVERY_WEEKDAYS, DELIVERY_TIME_SLOTS } from './firstSubscriptionForm.js'

export const FIRST_SUBSCRIPTION_DRAFT_KEY = 'subscription.application-draft.v1'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Incomplete input is valid here. The existing step guards still validate submission.
export function cleanFirstSubscriptionDraft(value) {
  if (!value || typeof value.planId !== 'string' || !uuid.test(value.planId)) return null
  if (!Array.isArray(value.deliveryConditions) || value.deliveryConditions.length > 6) return null
  const seen = new Set()
  const deliveryConditions = []
  for (const c of value.deliveryConditions) {
    if (
      !c ||
      !DELIVERY_WEEKDAYS.includes(c.weekday) ||
      seen.has(c.weekday) ||
      typeof c.addressId !== 'string' ||
      (c.addressId !== '' && !uuid.test(c.addressId)) ||
      !Number.isInteger(c.mealQuantity) ||
      c.mealQuantity < 1 ||
      c.mealQuantity > 6 ||
      !DELIVERY_TIME_SLOTS.some((s) => s.value === c.deliveryTimeSlot)
    )
      return null
    seen.add(c.weekday)
    deliveryConditions.push({
      weekday: c.weekday,
      addressId: c.addressId,
      mealQuantity: c.mealQuantity,
      deliveryTimeSlot: c.deliveryTimeSlot,
    })
  }
  if (
    !Array.isArray(value.terms) ||
    value.terms.length > 20 ||
    typeof value.confirmed !== 'boolean'
  )
    return null
  const types = new Set()
  const terms = []
  for (const term of value.terms) {
    if (
      !term ||
      typeof term.termsType !== 'string' ||
      !term.termsType ||
      term.termsType.length > 100 ||
      types.has(term.termsType) ||
      !validTermsVersion(term.version) ||
      typeof term.checked !== 'boolean'
    )
      return null
    types.add(term.termsType)
    terms.push({ termsType: term.termsType, version: term.version, checked: term.checked })
  }
  return { planId: value.planId, deliveryConditions, terms, confirmed: value.confirmed }
}

export function bindFirstSubscriptionDraft(
  application,
  getUser,
  getStorage = () => window.sessionStorage,
) {
  let owner = null
  let restoring = false
  const remove = () => {
    try {
      getStorage().removeItem(FIRST_SUBSCRIPTION_DRAFT_KEY)
    } catch {
      /* Storage may be disabled. */
    }
  }
  const stopOwner = watch(
    () => billingUserId(getUser()),
    (next, previous) => {
      restoring = true
      owner = next
      if (previous && previous !== next) {
        remove()
        application.$reset()
      }
      if (!next) remove()
      else {
        try {
          const record = JSON.parse(getStorage().getItem(FIRST_SUBSCRIPTION_DRAFT_KEY))
          if (record) {
            const draft =
              record.version === 1 && record.userId === next
                ? cleanFirstSubscriptionDraft(record.draft)
                : null
            if (draft) application.restoreSavedDraft(draft)
            else remove()
          }
        } catch {
          remove()
        }
      }
      restoring = false
    },
    { immediate: true, flush: 'sync' },
  )
  const stopSave = watch(
    () => ({
      planId: application.planId,
      deliveryConditions: application.deliveryConditions,
      terms:
        application.pendingDraftTerms?.terms ??
        application.mobileAcceptedTerms?.map((t) => ({ ...t, checked: true })) ??
        application.requiredTerms.map((t) => ({
          termsType: t.termsType,
          version: t.version,
          checked: !!application.agreedTerms[t.termsType],
        })),
      confirmed:
        application.pendingDraftTerms?.confirmed ??
        (application.mobileAcceptedTerms?.length ? true : application.termsConfirmed),
      result: application.result,
    }),
    (value) => {
      if (restoring) return
      if (!owner || value.result || !value.planId) return remove()
      const draft = cleanFirstSubscriptionDraft(value)
      if (!draft) return remove()
      try {
        getStorage().setItem(
          FIRST_SUBSCRIPTION_DRAFT_KEY,
          JSON.stringify({ version: 1, userId: owner, draft }),
        )
      } catch {
        /* Keep in-memory input usable when storage is unavailable. */
      }
    },
    { deep: true, flush: 'sync' },
  )
  return () => {
    stopOwner()
    stopSave()
  }
}
