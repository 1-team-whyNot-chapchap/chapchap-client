import { defineStore } from 'pinia'
import { isOrderId, orderApi } from '../api/orderApi.js'

export const ORDER_DETAIL_STORAGE_KEY = 'subscription:selected-order-id'

function storageGet(storage) {
  try {
    return storage?.getItem(ORDER_DETAIL_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function storageSet(storage, value) {
  try {
    storage?.setItem(ORDER_DETAIL_STORAGE_KEY, value)
  } catch {
    /* The selected ID is a convenience only; the route remains usable without storage. */
  }
}

function storageRemove(storage) {
  try {
    storage?.removeItem(ORDER_DETAIL_STORAGE_KEY)
  } catch {
    /* Storage can be disabled by browser policy. */
  }
}

export function createOrderStore(
  api = orderApi,
  storage = typeof window === 'undefined' ? null : window.sessionStorage,
  storeId = 'subscription-orders',
) {
  return defineStore(storeId, {
    state: () => ({
      orders: [],
      listStatus: 'idle',
      listError: null,
      selectedOrderId: '',
      detail: null,
      detailStatus: 'idle',
      detailError: null,
    }),

    actions: {
      clearSelectedOrder() {
        storageRemove(storage)
        this.selectedOrderId = ''
        this.detail = null
        this.detailStatus = 'idle'
        this.detailError = null
      },

      restoreSelectedOrder() {
        const orderId = storageGet(storage)
        if (!isOrderId(orderId)) {
          this.clearSelectedOrder()
          return ''
        }
        this.selectedOrderId = orderId
        return orderId
      },

      selectOrder(orderId) {
        if (!isOrderId(orderId)) return false
        if (this.selectedOrderId !== orderId) {
          this.detail = null
          this.detailStatus = 'idle'
          this.detailError = null
        }
        this.selectedOrderId = orderId
        storageSet(storage, orderId)
        return true
      },

      async fetchOrders(force = false) {
        if (!force && ['success', 'empty', 'loading'].includes(this.listStatus)) return this.orders
        this.listStatus = 'loading'
        this.listError = null
        try {
          this.orders = await api.listOrders()
          this.listStatus = this.orders.length ? 'success' : 'empty'
        } catch (error) {
          this.orders = []
          this.listStatus = 'error'
          this.listError = error
        }
        return this.orders
      },

      async fetchSelectedOrder(force = false) {
        const orderId = this.selectedOrderId || this.restoreSelectedOrder()
        if (!orderId) return null
        if (!force && ['success', 'loading'].includes(this.detailStatus)) return this.detail
        this.detailStatus = 'loading'
        this.detailError = null
        try {
          this.detail = await api.getOrder(orderId)
          this.detailStatus = 'success'
        } catch (error) {
          this.detail = null
          this.detailStatus = 'error'
          this.detailError = error
        }
        return this.detail
      },
    },
  })
}

export const useOrderStore = createOrderStore()
