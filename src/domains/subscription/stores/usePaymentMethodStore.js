import { defineStore } from 'pinia'
import { paymentMethodApi } from '../api/paymentMethodApi.js'

export function createPaymentMethodStore(
  api = paymentMethodApi,
  storeId = 'subscription-payment-methods',
) {
  return defineStore(storeId, {
    state: () => ({
      paymentMethods: [],
      status: 'idle',
      mutationStatus: 'idle',
      error: null,
      mutationError: null,
    }),
    getters: {
      currentPaymentMethod: (state) =>
        state.paymentMethods.find((paymentMethod) => paymentMethod.isCurrent) || null,
    },
    actions: {
      async fetchPaymentMethods(force = false) {
        if (this.status === 'loading' || (!force && this.status === 'success'))
          return this.paymentMethods
        this.status = 'loading'
        this.error = null
        try {
          this.paymentMethods = await api.list()
          this.status = 'success'
        } catch (error) {
          this.paymentMethods = []
          this.status = 'error'
          this.error = error
        }
        return this.paymentMethods
      },
      async mutate(action, value) {
        if (this.mutationStatus === 'loading') return null
        this.mutationStatus = 'loading'
        this.mutationError = null
        try {
          const result = await api[action](value)
          await this.fetchPaymentMethods(true)
          if (this.status === 'error') throw this.error
          this.mutationStatus = 'success'
          return result
        } catch (error) {
          this.mutationStatus = 'error'
          this.mutationError = error
          return null
        }
      },
      register(billingKey) {
        return this.mutate('register', billingKey)
      },
      selectCurrent(paymentMethodId) {
        return this.mutate('selectCurrent', paymentMethodId)
      },
      remove(paymentMethodId) {
        return this.mutate('remove', paymentMethodId)
      },
    },
  })
}

export const usePaymentMethodStore = createPaymentMethodStore()
