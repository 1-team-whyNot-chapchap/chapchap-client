import { defineStore } from 'pinia'
import { createDeliveryCondition, DELIVERY_WEEKDAYS } from '../firstSubscriptionForm.js'
import { settingChangeApi } from '../api/settingChangeApi.js'

export function createSettingChangeStore(api = settingChangeApi, storeId = 'setting-change') {
  return defineStore(storeId, {
    state: () => ({
      baseline: null,
      baselineStatus: 'idle',
      baselineRequest: null,
      calculationRequest: null,
      baselineNeedsRefresh: false,
      planId: '',
      deliveryConditions: [],
      preview: null,
      result: null,
      previewStatus: 'idle',
      submitStatus: 'idle',
      error: null,
    }),

    actions: {
      async fetchBaseline() {
        if (this.baselineStatus === 'loading') return null
        const token = Symbol('baseline')
        this.baselineRequest = token
        this.baselineStatus = 'loading'
        this.error = null
        try {
          const baseline = await api.baseline()
          if (this.baselineRequest !== token) return null
          this.initialize(baseline)
          this.baselineStatus = 'success'
          return baseline
        } catch (error) {
          if (this.baselineRequest !== token) return null
          this.baseline = null
          this.preview = null
          this.baselineStatus = 'error'
          this.error = error
          return null
        }
      },

      initialize(subscription) {
        if (!subscription?.plan?.planId || !Array.isArray(subscription.deliveryConditions))
          return false
        this.baseline = JSON.parse(JSON.stringify(subscription))
        this.baselineStatus = 'success'
        this.baselineNeedsRefresh = false
        this.planId = subscription.plan.planId
        this.deliveryConditions = subscription.deliveryConditions.map((condition) => ({
          weekday: condition.weekday,
          mealQuantity: condition.mealQuantity,
          addressId: condition.address?.addressId || '',
          deliveryTimeSlot: condition.deliveryTimeSlot,
        }))
        this.preview = null
        this.result = null
        this.previewStatus = 'idle'
        this.submitStatus = 'idle'
        this.error = null
        return true
      },

      setPlan(planId) {
        this.planId = planId
        this.clearCalculation()
      },

      setDeliveryWeekdays(weekdays) {
        const previous = new Map(
          this.deliveryConditions.map((condition) => [condition.weekday, condition]),
        )
        const defaultAddressId = this.deliveryConditions[0]?.addressId || ''
        this.deliveryConditions = DELIVERY_WEEKDAYS.filter((weekday) =>
          weekdays.includes(weekday),
        ).map(
          (weekday) =>
            previous.get(weekday) || {
              ...createDeliveryCondition(weekday),
              addressId: defaultAddressId,
            },
        )
        this.clearCalculation()
      },

      updateDeliveryCondition(weekday, changes) {
        this.deliveryConditions = this.deliveryConditions.map((condition) =>
          condition.weekday === weekday ? { ...condition, ...changes } : condition,
        )
        this.clearCalculation()
      },

      clearCalculation() {
        this.calculationRequest = null
        this.preview = null
        this.result = null
        this.previewStatus = 'idle'
        this.submitStatus = 'idle'
        this.error = null
      },

      async requestPreview(request) {
        if (
          this.previewStatus === 'loading' ||
          this.baselineStatus !== 'success' ||
          this.baselineNeedsRefresh
        )
          return null
        const token = Symbol('preview')
        this.calculationRequest = token
        this.previewStatus = 'loading'
        this.error = null
        try {
          const preview = await api.preview(request)
          if (this.calculationRequest !== token) return null
          if (preview.effectiveStartDate !== this.baseline.effectiveStartDate) {
            this.baselineNeedsRefresh = true
            throw new Error(
              '변경 적용일이 달라졌습니다. 최신 기준을 다시 불러온 뒤 변경 내용을 확인해 주세요.',
            )
          }
          this.preview = preview
          this.previewStatus = 'success'
          return this.preview
        } catch (error) {
          if (this.calculationRequest !== token) return null
          this.preview = null
          this.previewStatus = 'error'
          this.error = error
          return null
        }
      },

      async submit(request) {
        if (this.submitStatus === 'loading' || !this.preview || this.baselineNeedsRefresh)
          return null
        const token = Symbol('submit')
        this.calculationRequest = token
        this.submitStatus = 'loading'
        this.error = null
        try {
          const result = await api.change(request)
          if (this.calculationRequest !== token) return null
          this.result = result
          this.submitStatus = 'success'
          return this.result
        } catch (error) {
          if (this.calculationRequest !== token) return null
          this.result = null
          this.submitStatus = 'error'
          this.error = error
          return null
        }
      },
    },
  })
}

export const useSettingChangeStore = createSettingChangeStore()
