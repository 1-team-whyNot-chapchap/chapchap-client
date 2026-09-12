import { defineStore } from 'pinia'
import { firstSubscriptionApi } from '../api/firstSubscriptionApi.js'
import { createDeliveryCondition } from '../firstSubscriptionForm.js'

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
      preview: null,
      result: null,
      termsStatus: 'idle',
      previewStatus: 'idle',
      submitStatus: 'idle',
      error: null,
    }),
    actions: {
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
        this.preview = null
        this.result = null
      },
      updateDeliveryCondition(weekday, changes) {
        this.deliveryConditions = this.deliveryConditions.map((condition) =>
          condition.weekday === weekday ? { ...condition, ...changes } : condition,
        )
        this.preview = null
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
        this.termsStatus = 'loading'
        this.error = null
        try {
          this.requiredTerms = await api.getRequiredTerms()
          this.agreedTerms = Object.fromEntries(
            this.requiredTerms.map((term) => [term.termsType, false]),
          )
          this.termsStatus = 'success'
        } catch (error) {
          this.requiredTerms = []
          this.termsStatus = 'error'
          this.error = error
        }
        return this.requiredTerms
      },
      setTermAgreement(termsType, agreed) {
        this.agreedTerms = { ...this.agreedTerms, [termsType]: agreed }
        this.preview = null
      },
      async agreeRequiredTerms() {
        if (
          !this.requiredTerms.length ||
          this.requiredTerms.some((term) => !this.agreedTerms[term.termsType])
        ) {
          throw new Error('모든 필수 약관에 동의해 주세요.')
        }
        await Promise.all(
          this.requiredTerms.map((term) =>
            api.agreeRequiredTerms({ termsType: term.termsType, version: term.version }),
          ),
        )
      },
      async requestPreview(request) {
        this.previewStatus = 'loading'
        this.error = null
        try {
          this.preview = await api.preview(request)
          this.previewStatus = 'success'
          return this.preview
        } catch (error) {
          this.previewStatus = 'error'
          this.error = error
          return null
        }
      },
      async submit(request) {
        if (this.submitStatus === 'loading') return null
        this.submitStatus = 'loading'
        this.error = null
        try {
          this.result = await api.subscribe(request)
          this.submitStatus = 'success'
          return this.result
        } catch (error) {
          this.submitStatus = 'error'
          this.error = error
          return null
        }
      },
    },
  })
}

export const useFirstSubscriptionStore = createFirstSubscriptionStore()
