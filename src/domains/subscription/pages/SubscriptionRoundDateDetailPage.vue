<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { isOrderDate, orderIdsForDate } from '../dateOrderDetails.js'
import { isOrderMonth, orderApi } from '../api/orderApi.js'
import OrderDetailSections from '../components/OrderDetailSections.vue'
import { deliveryTimeSlotLabel } from '../currentSubscriptionDisplay.js'

const router = useRouter()
const route = useRoute()
const status = ref('idle')
const error = ref(null)
const orders = ref([])
const selectedDate = ref('')
let request = null

const orderStatuses = {
  AWAITING_CONFIRMATION: '확정 대기',
  CHANGE_PENDING: '변경 대기',
  ACTIVE: '주문 확정',
  INACTIVE: '비활성',
  PAYMENT_FAILED: '결제 실패',
  CHANGE_NOT_APPLIED: '변경 미적용',
  CANCELED_BEFORE_START: '시작 전 취소',
}

function queryPage(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return 1
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : 1
}

function queryContext() {
  const month = route.query.month
  const date = route.query.date
  if (!isOrderMonth(month) || !isOrderDate(date) || date.slice(0, 7) !== month) return null
  return { month, date, page: queryPage(route.query.page) }
}

async function loadOrders() {
  const context = queryContext()
  if (!context) {
    status.value = 'invalid'
    error.value = null
    orders.value = []
    selectedDate.value = ''
    request = null
    return
  }

  selectedDate.value = context.date
  status.value = 'loading'
  error.value = null
  orders.value = []
  request = {}
  const pending = request
  try {
    const calendar = await orderApi.listCalendarOrders(context.month)
    const orderIds = orderIdsForDate(calendar.orders, context.date)
    if (!orderIds.length) {
      if (request !== pending) return
      status.value = 'empty'
      return
    }
    const details = await Promise.all(orderIds.map((orderId) => orderApi.getOrder(orderId)))
    if (request !== pending) return
    orders.value = details
    status.value = 'success'
  } catch (cause) {
    if (request !== pending) return
    status.value = 'error'
    error.value = cause
  } finally {
    if (request === pending) request = null
  }
}

function backToOrders() {
  const context = queryContext()
  router.push({
    name: 'wf-022',
    query: context ? { month: context.month, page: String(context.page) } : {},
  })
}

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString('ko-KR')}원`
}

watch(() => [route.query.month, route.query.date, route.query.page], loadOrders, {
  immediate: true,
})

onBeforeUnmount(() => {
  request = null
})
</script>

<template>
  <div class="page date-order-detail workspace-ui design-review-page">
    <PageBackButton label="주문 내역" @back="backToOrders" />

    <header v-if="selectedDate" class="date-order-detail__header">
      <p class="section-kicker">{{ dayjs(selectedDate).format('YYYY년 M월 D일') }}</p>
      <h1>주문 상세</h1>
      <p>해당 날짜의 주문 {{ orders.length }}건을 확인하세요.</p>
    </header>

    <section v-if="status === 'loading' || status === 'idle'" class="ui-empty" aria-busy="true">
      <h1>주문 상세를 불러오고 있어요.</h1>
    </section>
    <section v-else-if="status === 'invalid'" class="ui-empty" role="alert">
      <h1>조회할 주문 날짜를 확인할 수 없어요.</h1>
      <button class="button button-primary" type="button" @click="backToOrders">
        주문 내역으로
      </button>
    </section>
    <section v-else-if="status === 'empty'" class="ui-empty">
      <h1>이 날짜에는 주문 내역이 없어요.</h1>
      <button class="button button-primary" type="button" @click="backToOrders">
        주문 내역으로
      </button>
    </section>
    <section v-else-if="status === 'error'" class="ui-empty" role="alert">
      <h1>주문 상세를 불러오지 못했어요.</h1>
      <p>{{ error?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
      <button class="button button-secondary" type="button" @click="loadOrders">다시 시도</button>
    </section>
    <section v-else class="date-order-detail__list" aria-label="날짜별 주문 목록">
      <details v-for="order in orders" :key="order.orderId" class="date-order-detail__item">
        <summary>
          <div>
            <span class="mini-badge">{{ orderStatuses[order.status] || '상태 확인 필요' }}</span>
            <strong>{{ order.menuName }}</strong>
            <small
              >{{ order.mealQuantity }}식 ·
              {{ deliveryTimeSlotLabel(order.deliveryTimeSlot) }}</small
            >
          </div>
          <strong>{{ formatAmount(order.amount) }}</strong>
        </summary>
        <OrderDetailSections :order="order" />
      </details>
    </section>
  </div>
</template>

<style scoped>
.date-order-detail {
  max-width: 760px;
  margin-inline: auto;
}
.date-order-detail__header {
  margin: 28px 0;
}
.date-order-detail__header p,
.date-order-detail__header h1 {
  margin: 0;
}
.date-order-detail__header h1 {
  margin-top: 6px;
  font-size: var(--font-page-title);
}
.date-order-detail__header p:last-child {
  margin-top: 8px;
  color: var(--color-text-muted);
}
.date-order-detail__list {
  display: grid;
  gap: 12px;
}
.date-order-detail__item {
  padding: 0 16px 16px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.date-order-detail__item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  cursor: pointer;
  list-style: none;
}
.date-order-detail__item summary::-webkit-details-marker {
  display: none;
}
.date-order-detail__item summary > div {
  display: grid;
  gap: 6px;
}
.date-order-detail__item summary .mini-badge {
  width: fit-content;
}
.date-order-detail__item summary small {
  color: var(--color-text-muted);
}
</style>
