import { defineStore } from 'pinia'
import { firstSubscriptionApi } from '../api/firstSubscriptionApi.js'
import {
  createDeliveryCondition,
  createFirstSubscriptionRequest,
} from '../firstSubscriptionForm.js'

export function createFirstSubscriptionStore(
  api = firstSubscriptionApi,
  storeId = 'first-subscription',
) {
  return defineStore(storeId, {
    state: () => ({
      planId: '',
      deliveryConditions: [],
      requiredTerms: [],
      agreedTerms: {},
      session: {},
      termsRequest: null,
      agreementRequest: null,
      termsConfirmed: false,
      mobileAcceptedTerms: null,
      pendingDraftTerms: null,
      preview: null,
      previewRequest: null,
      result: null,
      termsStatus: 'idle',
      previewStatus: 'idle',
      submitStatus: 'idle',
      error: null,
      errorStep: null,
      errorKind: null,
      activeStep: null,
    }),
    actions: {
      restoreSavedDraft(draft) {
        this.$reset()
        this.planId = draft.planId
        this.deliveryConditions = draft.deliveryConditions
        this.pendingDraftTerms = { terms: draft.terms, confirmed: draft.confirmed }
      },
      restoreMobileDraft(draft) {
        // A live or regularly restored draft is newer than a pending provider round trip.
        if (this.planId) return
        const request = createFirstSubscriptionRequest(draft.planId, draft.deliveryConditions)
        this.$reset()
        this.planId = request.planId
        this.deliveryConditions = request.deliveryConditions
        this.mobileAcceptedTerms = Array.isArray(draft.acceptedTerms) ? draft.acceptedTerms : []
      },
      clearError() {
        this.error = null
        this.errorStep = null
        this.errorKind = null
      },
      setError(error, step, kind = 'request') {
        this.error = error
        this.errorStep = step
        this.errorKind = kind
      },
      enterStep(step) {
        // URL 접근 제한의 안내만 목적지까지 전달하고, 일반 오류는 단계 이동 시 비운다.
        if (this.errorKind === 'redirect' && (step === null || step === this.errorStep)) {
          if (step !== null) this.errorKind = 'validation'
        } else {
          this.clearError()
        }
        if (this.activeStep !== step) {
          if (this.termsStatus === 'loading') {
            this.termsRequest = null
            this.termsStatus = 'idle'
          }
          this.agreementRequest = null
        }
        this.activeStep = step
      },
      invalidatePreview() {
        this.previewRequest = null
        this.preview = null
        this.previewStatus = 'idle'
      },
      begin(planId) {
        if (this.planId === planId) return
        this.$reset()
        this.planId = planId
      },
      setDeliveryWeekdays(weekdays) {
        const previous = new Map(
          this.deliveryConditions.map((condition) => [condition.weekday, condition]),
        )
        this.deliveryConditions = weekdays.map(
          (weekday) => previous.get(weekday) || createDeliveryCondition(weekday),
        )
        this.invalidatePreview()
        this.result = null
      },
      updateDeliveryCondition(weekday, changes) {
        this.deliveryConditions = this.deliveryConditions.map((condition) =>
          condition.weekday === weekday ? { ...condition, ...changes } : condition,
        )
        this.invalidatePreview()
        this.result = null
      },
      applyDefaultAddress(addressId) {
        if (!addressId) return
        this.deliveryConditions = this.deliveryConditions.map((condition) =>
          condition.addressId ? condition : { ...condition, addressId },
        )
      },
      async fetchRequiredTerms(force = false) {
        if (!force && ['success', 'loading'].includes(this.termsStatus)) return this.requiredTerms
        this.invalidatePreview()
        this.termsConfirmed = false
        this.agreementRequest = null
        this.termsRequest = {}
        const pending = this.termsRequest
        this.termsStatus = 'loading'
        this.clearError()
        try {
          const terms = await api.getRequiredTerms()
          if (this.termsRequest !== pending) return []
          if (!terms.length) throw new Error('필수 약관을 확인할 수 없습니다. 다시 시도해 주세요.')
          this.requiredTerms = terms
          this.agreedTerms = Object.fromEntries(
            this.requiredTerms.map((term) => [term.termsType, false]),
          )
          this.termsStatus = 'success'
          if (this.pendingDraftTerms) {
            const saved = this.pendingDraftTerms
            this.agreedTerms = Object.fromEntries(
              terms.map((term) => [
                term.termsType,
                saved.terms.some(
                  (old) =>
                    old.termsType === term.termsType && old.version === term.version && old.checked,
                ),
              ]),
            )
            this.termsConfirmed =
              saved.confirmed &&
              saved.terms.length === terms.length &&
              terms.every((term) => this.agreedTerms[term.termsType])
            this.pendingDraftTerms = null
          }
          if (this.mobileAcceptedTerms) {
            const accepted = this.mobileAcceptedTerms
            this.mobileAcceptedTerms = null
            if (
              accepted.length === terms.length &&
              terms.every((term) =>
                accepted.some(
                  (old) => old.termsType === term.termsType && old.version === term.version,
                ),
              )
            ) {
              this.agreedTerms = Object.fromEntries(terms.map((term) => [term.termsType, true]))
              this.termsConfirmed = true
            }
          }
        } catch (error) {
          if (this.termsRequest !== pending) return []
          this.requiredTerms = []
          this.termsStatus = 'error'
          this.setError(error, 4)
        }
        return this.requiredTerms
      },
      setTermAgreement(termsType, agreed) {
        this.termsConfirmed = false
        this.agreementRequest = null
        this.agreedTerms = { ...this.agreedTerms, [termsType]: agreed }
        this.invalidatePreview()
      },
      async agreeRequiredTerms() {
        if (
          this.termsStatus !== 'success' ||
          !this.requiredTerms.length ||
          this.requiredTerms.some((term) => !this.agreedTerms[term.termsType])
        ) {
          throw new Error('모든 필수 약관에 동의해 주세요.')
        }
        this.termsConfirmed = false
        this.agreementRequest = {}
        const pending = this.agreementRequest
        try {
          await Promise.all(
            this.requiredTerms.map((term) =>
              api.agreeRequiredTerms({ termsType: term.termsType, version: term.version }),
            ),
          )
          if (this.agreementRequest !== pending) return false
          this.termsConfirmed = true
          return true
        } catch (error) {
          if (this.agreementRequest !== pending) return false
          throw error
        }
      },
      async requestPreview(request) {
        this.invalidatePreview()
        this.previewRequest = {}
        const pending = this.previewRequest
        this.previewStatus = 'loading'
        this.clearError()
        try {
          const preview = await api.preview(request)
          if (this.previewRequest !== pending) return null
          this.preview = preview
          this.previewStatus = 'success'
          return this.preview
        } catch (error) {
          if (this.previewRequest !== pending) return null
          this.previewStatus = 'error'
          this.setError(error, 5)
          return null
        }
      },
      async submit(request) {
        if (this.submitStatus === 'loading') return null
        this.submitStatus = 'loading'
        this.clearError()
        const session = this.session
        try {
          const result = await api.subscribe(request)
          if (this.session !== session) return null
          this.result = result
          this.submitStatus = 'success'
          return this.result
        } catch (error) {
          if (this.session !== session) return null
          this.submitStatus = 'error'
          this.setError(error, 5)
          return null
        }
      },
    },
  })
}

export const useFirstSubscriptionStore = createFirstSubscriptionStore()
