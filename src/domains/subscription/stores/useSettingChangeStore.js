import { defineStore } from 'pinia'
import { createDeliveryCondition, DELIVERY_WEEKDAYS } from '../firstSubscriptionForm.js'
import { settingChangeApi } from '../api/settingChangeApi.js'

export function createSettingChangeStore(api = settingChangeApi, storeId = 'setting-change') {
  return defineStore(storeId, {
    state: () => ({
      planId: '',
      deliveryConditions: [],
      preview: null,
      result: null,
      previewStatus: 'idle',
      submitStatus: 'idle',
      error: null,
    }),

    actions: {
      initialize(subscription) {
        if (!subscription?.plan?.planId || !Array.isArray(subscription.deliveryConditions))
          return false
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
        this.preview = null
        this.result = null
        this.previewStatus = 'idle'
        this.submitStatus = 'idle'
        this.error = null
      },

      async requestPreview(request) {
        if (this.previewStatus === 'loading') return null
        this.previewStatus = 'loading'
        this.error = null
        try {
          this.preview = await api.preview(request)
          this.previewStatus = 'success'
          return this.preview
        } catch (error) {
          this.preview = null
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
          this.result = await api.change(request)
          this.submitStatus = 'success'
          return this.result
        } catch (error) {
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
