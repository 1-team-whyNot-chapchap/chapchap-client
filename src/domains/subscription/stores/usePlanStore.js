import { defineStore } from 'pinia'
import { planApi } from '../api/planApi.js'

export const usePlanStore = defineStore('subscription-plans', {
  state: () => ({
    plans: [],
    listStatus: 'idle',
    listError: null,
    details: {},
    detailStatuses: {},
    detailErrors: {},
  }),

  getters: {
    planById: (state) => (planId) =>
      state.details[planId] || state.plans.find((plan) => plan.planId === planId) || null,
  },

  actions: {
    async fetchPlans(force = false) {
      if (!force && ['success', 'empty'].includes(this.listStatus)) return this.plans
      this.listStatus = 'loading'
      this.listError = null
      try {
        this.plans = await planApi.listPlans()
        this.listStatus = this.plans.length ? 'success' : 'empty'
      } catch (error) {
        this.plans = []
        this.listStatus = 'error'
        this.listError = error
      }
      return this.plans
    },

    async fetchPlan(planId, force = false) {
      if (!force && this.detailStatuses[planId] === 'success') return this.details[planId]
      this.detailStatuses[planId] = 'loading'
      this.detailErrors[planId] = null
      try {
        const plan = await planApi.getPlan(planId)
        this.details[planId] = plan
        this.detailStatuses[planId] = 'success'
        return plan
      } catch (error) {
        delete this.details[planId]
        this.detailStatuses[planId] = 'error'
        this.detailErrors[planId] = error
        return null
      }
    },
  },
})
