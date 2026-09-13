import { defineStore } from 'pinia'
import { currentSubscriptionApi } from '../api/currentSubscriptionApi.js'

export function createCurrentSubscriptionStore(
  api = currentSubscriptionApi,
  storeId = 'current-subscription',
) {
  return defineStore(storeId, {
    state: () => ({
      subscription: null,
      status: 'idle',
      error: null,
      request: null,
    }),

    actions: {
      async fetchCurrentSubscription(force = false) {
        if (!force && ['success', 'empty', 'loading'].includes(this.status))
          return this.subscription

        this.status = 'loading'
        this.error = null
        this.request = {}
        const pending = this.request
        try {
          const subscription = await api.getCurrentSubscription()
          if (this.request !== pending) return null
          this.subscription = subscription
          this.status = this.subscription ? 'success' : 'empty'
        } catch (error) {
          if (this.request !== pending) return null
          this.subscription = null
          this.status = 'error'
          this.error = error
        } finally {
          if (this.request === pending) this.request = null
        }
        return this.subscription
      },
    },
  })
}

export const useCurrentSubscriptionStore = createCurrentSubscriptionStore()
