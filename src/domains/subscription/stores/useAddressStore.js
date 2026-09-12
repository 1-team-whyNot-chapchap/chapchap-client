import { defineStore } from 'pinia'
import { addressApi } from '../api/addressApi.js'

export function createAddressStore(api = addressApi, storeId = 'subscription-addresses') {
  return defineStore(storeId, {
    state: () => ({
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
      async fetchAddresses(force = false) {
        if (!force && ['success', 'empty', 'loading'].includes(this.listStatus))
          return this.addresses
        this.listStatus = 'loading'
        this.listError = null
        try {
          this.addresses = await api.listAddresses()
          this.listStatus = this.addresses.length ? 'success' : 'empty'
        } catch (error) {
          this.addresses = []
          this.listStatus = 'error'
          this.listError = error
        }
        return this.addresses
      },

      async runMutation(action) {
        if (this.isMutating) return false
        this.mutationStatus = 'loading'
        this.mutationError = null
        try {
          await action()
          await this.fetchAddresses(true)
          this.mutationStatus = 'success'
          return true
        } catch (error) {
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
