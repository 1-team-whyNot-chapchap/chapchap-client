import { defineStore } from 'pinia'
import { paymentRefundHistoryApi } from '../api/paymentRefundHistoryApi.js'

const initial = () => ({
  payments: [],
  refunds: [],
  paymentDetail: null,
  refundDetail: null,
  paymentListStatus: 'idle',
  refundListStatus: 'idle',
  paymentDetailStatus: 'idle',
  refundDetailStatus: 'idle',
  paymentListError: null,
  refundListError: null,
  paymentDetailError: null,
  refundDetailError: null,
})

export function createPaymentRefundHistoryStore(
  api = paymentRefundHistoryApi,
  storeId = 'payment-refund-history',
) {
  return defineStore(storeId, {
    state: initial,
    actions: {
      async fetchPayments(force = false) {
        if (
          this.paymentListStatus === 'loading' ||
          (!force && this.paymentListStatus === 'success')
        )
          return
        this.paymentListStatus = 'loading'
        this.paymentListError = null
        try {
          this.payments = await api.listPayments()
          this.paymentListStatus = 'success'
        } catch (error) {
          this.paymentListStatus = 'error'
          this.paymentListError = error
        }
      },
      async fetchRefunds(force = false) {
        if (this.refundListStatus === 'loading' || (!force && this.refundListStatus === 'success'))
          return
        this.refundListStatus = 'loading'
        this.refundListError = null
        try {
          this.refunds = await api.listRefunds()
          this.refundListStatus = 'success'
        } catch (error) {
          this.refundListStatus = 'error'
          this.refundListError = error
        }
      },
      async fetchPayment(paymentId) {
        this.paymentDetailStatus = 'loading'
        this.paymentDetailError = null
        this.paymentDetail = null
        try {
          this.paymentDetail = await api.getPayment(paymentId)
          this.paymentDetailStatus = 'success'
        } catch (error) {
          this.paymentDetailStatus = 'error'
          this.paymentDetailError = error
        }
      },
      async fetchRefund(refundId) {
        this.refundDetailStatus = 'loading'
        this.refundDetailError = null
        this.refundDetail = null
        try {
          this.refundDetail = await api.getRefund(refundId)
          this.refundDetailStatus = 'success'
        } catch (error) {
          this.refundDetailStatus = 'error'
          this.refundDetailError = error
        }
      },
    },
  })
}

export const usePaymentRefundHistoryStore = createPaymentRefundHistoryStore()
