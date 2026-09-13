import { defineStore } from 'pinia'
import { cancellationApi } from '../api/cancellationApi.js'

export function createSubscriptionCancellationStore(
  api = cancellationApi,
  storeId = 'subscription-cancellation',
) {
  return defineStore(storeId, {
    state: () => ({
      result: null,
      status: 'idle',
      error: null,
    }),

    actions: {
      async cancel() {
        if (this.status === 'loading') return null

        this.status = 'loading'
        this.error = null
        try {
          this.result = await api.cancel()
          this.status = 'success'
          return this.result
        } catch (error) {
          this.result = null
          this.status = 'error'
          this.error = error
          return null
        }
      },
    },
  })
}

export const useSubscriptionCancellationStore = createSubscriptionCancellationStore()
