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
    }),

    actions: {
      async fetchCurrentSubscription(force = false) {
        if (!force && ['success', 'empty', 'loading'].includes(this.status))
          return this.subscription

        this.status = 'loading'
        this.error = null
        try {
          this.subscription = await api.getCurrentSubscription()
          this.status = this.subscription ? 'success' : 'empty'
        } catch (error) {
          this.subscription = null
          this.status = 'error'
          this.error = error
        }
        return this.subscription
      },
    },
  })
}

export const useCurrentSubscriptionStore = createCurrentSubscriptionStore()
