<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import { useCurrentSubscriptionStore } from '../stores/useCurrentSubscriptionStore.js'
import { useOrderStore } from '../stores/useOrderStore.js'
import {
  currentSubscriptionSummary,
  selectNextDelivery,
  summaryToday,
} from '../mypageSubscriptionSummary.js'

const router = useRouter()
const subscriptionStore = useCurrentSubscriptionStore()
const orderStore = useOrderStore()
const today = ref(summaryToday())
const summary = computed(() => currentSubscriptionSummary(subscriptionStore.subscription))
const nextDelivery = computed(() => selectNextDelivery(orderStore.orders, today.value))
let clockTimer

function refreshSubscription() {
  if (authSession.state.user) return subscriptionStore.fetchCurrentSubscription(true)
}
function refreshOrders() {
  today.value = summaryToday()
  if (authSession.state.user) return orderStore.fetchOrders(true)
}
function openNextOrder() {
  if (orderStore.listStatus !== 'success' || !nextDelivery.value) return
  if (orderStore.selectOrder(nextDelivery.value.orderId)) router.push({ name: 'wf-023' })
}

watch(
  () => authSession.state.user,
  (user, previous) => {
    if (
      user &&
      previous &&
      user.email === previous.email &&
      user.phone === previous.phone &&
      user.role === previous.role
    )
      return
    subscriptionStore.$reset()
    orderStore.clearSelectedOrder()
    orderStore.$reset()
    if (user) {
      refreshSubscription()
      refreshOrders()
    }
  },
  { immediate: true, flush: 'sync' },
)

onMounted(() => {
  // 오래 열어 둔 화면도 KST 날짜가 바뀌면 지난 주문을 제외한다. API를 주기 호출하지 않는다.
  clockTimer = setInterval(() => {
    today.value = summaryToday()
  }, 60_000)
})
onBeforeUnmount(() => clearInterval(clockTimer))
</script>

<template>
  <section class="account-metrics" aria-label="구독 및 배송 예정 요약">
    <div class="metric" aria-live="polite">
      <span class="metric-title">현재 구독</span>
      <p v-if="['idle', 'loading'].includes(subscriptionStore.status)" role="status">
        구독 정보를 불러오고 있어요.
      </p>
      <template v-else-if="subscriptionStore.status === 'error'">
        <p role="alert">구독 정보를 불러오지 못했어요.</p>
        <button type="button" class="text-action" @click="refreshSubscription">
          구독 조회 다시 시도
        </button>
      </template>
      <template v-else>
        <strong>{{
          summary.planName ? `${summary.planName} · ${summary.label}` : summary.label
        }}</strong>
        <small v-if="summary.period">{{ summary.period }}</small>
      </template>
    </div>
    <div class="metric" aria-live="polite">
      <span class="metric-title">다음 배송 예정</span>
      <p v-if="['idle', 'loading'].includes(orderStore.listStatus)" role="status">
        배송 예정을 불러오고 있어요.
      </p>
      <template v-else-if="orderStore.listStatus === 'error'">
        <p role="alert">배송 예정을 불러오지 못했어요.</p>
        <button type="button" class="text-action" @click="refreshOrders">
          배송 조회 다시 시도
        </button>
      </template>
      <template v-else-if="nextDelivery">
        <strong
          ><time :datetime="nextDelivery.deliveryDate">{{
            nextDelivery.deliveryDate
          }}</time></strong
        >
        <button type="button" class="text-action" @click="openNextOrder">주문 상세 보기</button>
      </template>
      <strong v-else>예정된 배송이 없어요.</strong>
    </div>
  </section>
</template>

<style scoped>
.account-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 30px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.metric {
  display: grid;
  gap: 6px;
  padding: 19px;
  min-width: 0;
  min-height: 92px;
  align-content: center;
  overflow-wrap: anywhere;
}
.metric + .metric {
  border-left: 1px solid var(--color-border);
}
.metric-title,
small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
strong,
p {
  font-size: var(--font-body);
}
p {
  margin: 0;
}
.text-action {
  justify-self: start;
  text-align: left;
}
@media (max-width: 480px) {
  .account-metrics {
    grid-template-columns: 1fr;
  }
  .metric + .metric {
    border-left: 0;
    border-top: 1px solid var(--color-border);
  }
}
</style>
