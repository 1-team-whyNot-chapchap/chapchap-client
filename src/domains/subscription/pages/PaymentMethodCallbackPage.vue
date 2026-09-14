<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import http, { authSession } from '../../../common/api/http.js'
import { createAccountDataApi } from '../api/accountDataApi.js'
import { billingReturnTarget, billingUserId } from '../mobileBillingContext.js'
import {
  clearMobileBilling,
  completeMobileBilling,
  mobileBillingContext,
  setBillingReturnNotice,
  takeMobileBillingResult,
} from '../mobileBillingReturn.js'
import { useFirstSubscriptionStore } from '../stores/useFirstSubscriptionStore.js'

const router = useRouter()
const application = useFirstSubscriptionStore()
const busy = ref(true)
const message = ref('카드 등록 결과를 확인하고 있어요.')
let active = true
onBeforeUnmount(() => {
  active = false
})
onMounted(async () => {
  const owner = billingUserId(authSession.state.user)
  const result = takeMobileBillingResult()
  try {
    const outcome = await completeMobileBilling({
      result,
      context: mobileBillingContext(),
      getUser: () => (active ? authSession.state.user : null),
      register: createAccountDataApi(http).registerPaymentMethod,
    })
    if (!active) return
    if (!owner || owner !== billingUserId(authSession.state.user) || !outcome.record) {
      clearMobileBilling()
      message.value = outcome.message
      return
    }
    if (outcome.record.draft) application.restoreMobileDraft(outcome.record.draft)
    setBillingReturnNotice(owner, outcome.message)
    const target = billingReturnTarget(outcome.record)
    if (outcome.record.draft && application.planId) target.query.planId = application.planId
    await router.replace(target)
  } catch {
    if (active)
      message.value =
        '카드 등록 결과를 확인하지 못했습니다. 자동으로 다시 등록하지 않습니다. 목록을 확인해 주세요.'
  } finally {
    if (result) result.billingKey = null
    busy.value = false
  }
})
</script>

<template>
  <section class="workspace-ui ui-stack" :aria-busy="busy">
    <h1>카드 등록 확인</h1>
    <p role="status">{{ message }}</p>
    <RouterLink v-if="!busy" class="button button-primary" to="/mypage/payment-methods"
      >결제수단 목록으로</RouterLink
    >
  </section>
</template>
