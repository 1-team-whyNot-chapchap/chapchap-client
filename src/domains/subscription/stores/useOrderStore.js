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

function emptyHistory(month = '', page = 1) {
  return {
    month,
    orders: [],
    page,
    size: 3,
    totalElements: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
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
      listRequest: null,
      calendarMonth: '',
      calendarOrders: [],
      calendarStatus: 'idle',
      calendarError: null,
      calendarRequest: null,
      history: emptyHistory(),
      historyStatus: 'idle',
      historyError: null,
      historyRequest: null,
      selectedOrderId: '',
      detail: null,
      detailStatus: 'idle',
      detailError: null,
      detailRequest: null,
    }),

    actions: {
      clearSelectedOrder() {
        this.detailRequest = null
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
          this.detailRequest = null
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
        this.listRequest = {}
        const pending = this.listRequest
        try {
          const orders = await api.listOrders()
          if (this.listRequest !== pending) return []
          this.orders = orders
          this.listStatus = this.orders.length ? 'success' : 'empty'
        } catch (error) {
          if (this.listRequest !== pending) return []
          this.orders = []
          this.listStatus = 'error'
          this.listError = error
        } finally {
          if (this.listRequest === pending) this.listRequest = null
        }
        return this.orders
      },

      async fetchCalendarOrders(month, force = false) {
        if (
          !force &&
          this.calendarMonth === month &&
          ['success', 'empty', 'loading'].includes(this.calendarStatus)
        ) {
          return this.calendarOrders
        }
        this.calendarMonth = month
        this.calendarOrders = []
        this.calendarStatus = 'loading'
        this.calendarError = null
        this.calendarRequest = {}
        const pending = this.calendarRequest
        try {
          const response = await api.listCalendarOrders(month)
          if (this.calendarRequest !== pending) return []
          this.calendarMonth = response.month
          this.calendarOrders = response.orders
          this.calendarStatus = this.calendarOrders.length ? 'success' : 'empty'
        } catch (error) {
          if (this.calendarRequest !== pending) return []
          this.calendarOrders = []
          this.calendarStatus = 'error'
          this.calendarError = error
        } finally {
          if (this.calendarRequest === pending) this.calendarRequest = null
        }
        return this.calendarOrders
      },

      async fetchOrderHistory(month, page, force = false) {
        if (
          !force &&
          this.history.month === month &&
          this.history.page === page &&
          ['success', 'empty', 'loading'].includes(this.historyStatus)
        ) {
          return this.history
        }
        this.history = emptyHistory(month, page)
        this.historyStatus = 'loading'
        this.historyError = null
        this.historyRequest = {}
        const pending = this.historyRequest
        try {
          const response = await api.listOrderHistory(month, page)
          if (this.historyRequest !== pending) return this.history
          this.history = response
          this.historyStatus = response.orders.length ? 'success' : 'empty'
        } catch (error) {
          if (this.historyRequest !== pending) return this.history
          this.historyStatus = 'error'
          this.historyError = error
        } finally {
          if (this.historyRequest === pending) this.historyRequest = null
        }
        return this.history
      },

      async fetchSelectedOrder(force = false) {
        const orderId = this.selectedOrderId || this.restoreSelectedOrder()
        if (!orderId) return null
        if (!force && ['success', 'loading'].includes(this.detailStatus)) return this.detail
        this.detailStatus = 'loading'
        this.detailError = null
        this.detailRequest = {}
        const pending = this.detailRequest
        try {
          const detail = await api.getOrder(orderId)
          if (this.detailRequest !== pending) return null
          this.detail = detail
          this.detailStatus = 'success'
        } catch (error) {
          if (this.detailRequest !== pending) return null
          this.detail = null
          this.detailStatus = 'error'
          this.detailError = error
        } finally {
          if (this.detailRequest === pending) this.detailRequest = null
        }
        return this.detail
      },
    },
  })
}

export const useOrderStore = createOrderStore()
