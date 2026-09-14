<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { isOrderMonth } from '../api/orderApi.js'
import OrderDetailSections from '../components/OrderDetailSections.vue'
import { useOrderStore } from '../stores/useOrderStore.js'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const order = computed(() => orderStore.detail)
const orderStatuses = {
  AWAITING_CONFIRMATION: '확정 대기',
  CHANGE_PENDING: '변경 대기',
  ACTIVE: '주문 확정',
  INACTIVE: '비활성',
  PAYMENT_FAILED: '결제 실패',
  CHANGE_NOT_APPLIED: '변경 미적용',
  CANCELED_BEFORE_START: '시작 전 취소',
}

onMounted(async () => {
  if (!orderStore.restoreSelectedOrder()) {
    router.replace({ name: 'wf-022' })
    return
  }
  await orderStore.fetchSelectedOrder()
})

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString('ko-KR')}원`
}

function backToOrders() {
  orderStore.clearSelectedOrder()
  const page = Number(route.query.page)
  const query =
    isOrderMonth(route.query.month) && Number.isSafeInteger(page) && page > 0
      ? { month: route.query.month, page: String(page) }
      : {}
  router.push({ name: 'wf-022', query })
}
</script>

<template>
  <div class="page order-detail workspace-ui design-review-page">
    <PageBackButton label="주문 일정" @back="backToOrders" />

    <section
      v-if="orderStore.detailStatus === 'loading' || orderStore.detailStatus === 'idle'"
      class="ui-empty"
      aria-busy="true"
    >
      <h1>주문 상세를 불러오고 있어요.</h1>
    </section>
    <section v-else-if="orderStore.detailStatus === 'error'" class="ui-empty" role="alert">
      <h1>주문 상세를 확인할 수 없어요.</h1>
      <p>
        {{
          orderStore.detailError?.serverMessage || '삭제됐거나 확인 권한이 없는 주문일 수 있습니다.'
        }}
      </p>
      <button class="button button-primary" type="button" @click="backToOrders">
        주문 내역으로
      </button>
    </section>
    <template v-else-if="order">
      <header class="order-detail__header">
        <p class="section-kicker">{{ order.deliveryDate }}</p>
        <div>
          <h1>주문 상세</h1>
          <span class="mini-badge">{{ orderStatuses[order.status] || '상태 확인 필요' }}</span>
        </div>
        <strong>{{ formatAmount(order.amount) }}</strong>
      </header>

      <OrderDetailSections :order="order" />
    </template>
  </div>
</template>

<style scoped>
.order-detail {
  max-width: 760px;
  margin-inline: auto;
}
.order-detail__header {
  display: grid;
  gap: 8px;
  margin: 28px 0;
}
.order-detail__header > div {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.order-detail__header h1 {
  margin: 0;
  font-size: var(--font-page-title);
}
.order-detail__header strong {
  font-size: var(--font-section-title);
}
</style>
