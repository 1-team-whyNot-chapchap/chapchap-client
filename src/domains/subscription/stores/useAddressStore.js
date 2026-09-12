import { defineStore } from 'pinia'
import { addressApi } from '../api/addressApi.js'

export function createAddressStore(api = addressApi, storeId = 'subscription-addresses') {
  return defineStore(storeId, {
    state: () => ({
      epoch: 0,
      requestId: 0,
      addresses: [],
      listStatus: 'idle',
      listError: null,
      mutationStatus: 'idle',
      mutationError: null,
    }),

    getters: {
      isMutating: (state) => state.mutationStatus === 'loading',
    },

    actions: {
      invalidate() {
        const epoch = this.epoch + 1
        this.$reset()
        this.epoch = epoch
      },
      async fetchAddresses(force = false) {
        if (!force && ['success', 'empty', 'loading'].includes(this.listStatus))
          return this.addresses
        const epoch = this.epoch,
          requestId = ++this.requestId
        this.listStatus = 'loading'
        this.listError = null
        try {
          const rows = await api.listAddresses()
          if (epoch !== this.epoch || requestId !== this.requestId) return []
          this.addresses = rows
          this.listStatus = this.addresses.length ? 'success' : 'empty'
        } catch (error) {
          if (epoch !== this.epoch || requestId !== this.requestId) return []
          this.addresses = []
          this.listStatus = 'error'
          this.listError = error
        }
        return this.addresses
      },

      async runMutation(action) {
        if (this.isMutating) return false
        const epoch = this.epoch
        this.mutationStatus = 'loading'
        this.mutationError = null
        try {
          await action()
          if (epoch !== this.epoch) return false
          await this.fetchAddresses(true)
          if (epoch !== this.epoch) return false
          this.mutationStatus = 'success'
          return true
        } catch (error) {
          if (epoch !== this.epoch) return false
          this.mutationStatus = 'error'
          this.mutationError = error
          return false
        }
      },

      createAddress(request) {
        return this.runMutation(() => api.createAddress(request))
      },

      updateAddress(addressId, request) {
        return this.runMutation(() => api.updateAddress(addressId, request))
      },

      setDefaultAddress(addressId) {
        return this.runMutation(() => api.setDefaultAddress(addressId))
      },

      deleteAddress(addressId) {
        return this.runMutation(() => api.deleteAddress(addressId))
      },
    },
  })
}

export const useAddressStore = createAddressStore()
