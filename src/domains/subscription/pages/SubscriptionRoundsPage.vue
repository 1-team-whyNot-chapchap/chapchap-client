<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { useOrderStore } from '../stores/useOrderStore.js'

const router = useRouter()
const orderStore = useOrderStore()
const month = ref(dayjs().startOf('month'))
const orderStatuses = {
  AWAITING_CONFIRMATION: '확정 대기',
  CHANGE_PENDING: '변경 대기',
  ACTIVE: '주문 확정',
  INACTIVE: '비활성',
  PAYMENT_FAILED: '결제 실패',
  CHANGE_NOT_APPLIED: '변경 미적용',
  CANCELED_BEFORE_START: '시작 전 취소',
}
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
const ordersByDate = computed(() => {
  const grouped = new Map()
  for (const order of orderStore.orders) {
    const entries = grouped.get(order.deliveryDate) || []
    entries.push(order)
    grouped.set(order.deliveryDate, entries)
  }
  return grouped
})
const calendarDays = computed(() => {
  const first = month.value.startOf('month')
  const days = Array.from({ length: first.day() }, () => null)
  for (let day = 1; day <= first.daysInMonth(); day++) {
    const date = first.date(day).format('YYYY-MM-DD')
    days.push({ day, date, orders: ordersByDate.value.get(date) || [] })
  }
  while (days.length % 7) days.push(null)
  return days
})

onMounted(() => orderStore.fetchOrders())

function formatAmount(amount) {
  return `${Number(amount).toLocaleString('ko-KR')}원`
}

function changeMonth(amount) {
  month.value = month.value.add(amount, 'month').startOf('month')
}

function openOrder(orderId) {
  if (!orderStore.selectOrder(orderId)) return
  router.push({ name: 'wf-023' })
}
</script>

<template>
  <div class="page order-history workspace-ui design-review-page">
    <PageBackButton to="/subscription" label="내 구독" />
    <header class="page-intro">
      <p class="section-kicker">주문 일정</p>
      <h1>구독 주문 내역</h1>
      <p>서버에서 확정한 배송 예정 주문만 표시합니다.</p>
    </header>

    <section
      v-if="['idle', 'loading'].includes(orderStore.listStatus)"
      class="ui-empty"
      aria-busy="true"
    >
      <h2>주문 내역을 불러오고 있어요.</h2>
    </section>
    <section v-else-if="orderStore.listStatus === 'error'" class="ui-empty" role="alert">
      <h2>주문 내역을 불러오지 못했어요.</h2>
      <p>{{ orderStore.listError?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
      <button class="button button-secondary" type="button" @click="orderStore.fetchOrders(true)">
        다시 시도
      </button>
    </section>
    <section v-else-if="orderStore.listStatus === 'empty'" class="ui-empty">
      <h2>표시할 주문이 없어요.</h2>
      <p>구독이 시작되면 서버가 생성한 주문 일정이 이곳에 표시됩니다.</p>
    </section>
    <template v-else>
      <section class="order-calendar" aria-labelledby="order-calendar-title">
        <header class="order-calendar__header">
          <button
            class="ui-icon-button"
            type="button"
            aria-label="이전 달"
            @click="changeMonth(-1)"
          >
            <ChevronLeft :size="20" aria-hidden="true" />
          </button>
          <h2 id="order-calendar-title">{{ month.format('YYYY년 M월') }}</h2>
          <button class="ui-icon-button" type="button" aria-label="다음 달" @click="changeMonth(1)">
            <ChevronRight :size="20" aria-hidden="true" />
          </button>
        </header>
        <div class="order-calendar__weekdays" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="order-calendar__days">
          <div
            v-for="(cell, index) in calendarDays"
            :key="cell?.date || `empty-${index}`"
            class="order-calendar__day"
            :class="{ 'is-empty': !cell }"
          >
            <template v-if="cell">
              <strong>{{ cell.day }}</strong>
              <button
                v-for="order in cell.orders"
                :key="order.orderId"
                class="order-calendar__item"
                type="button"
                :aria-label="`${order.deliveryDate} 주문 상세 보기`"
                @click="openOrder(order.orderId)"
              >
                {{ orderStatuses[order.status] || '상태 확인' }}
              </button>
            </template>
          </div>
        </div>
        <p class="order-calendar__notice">표시가 있는 날짜만 서버가 생성한 실제 주문입니다.</p>
      </section>

      <section class="order-list" aria-labelledby="order-list-title">
        <div class="order-list__heading">
          <h2 id="order-list-title">주문 목록</h2>
          <span>{{ orderStore.orders.length }}건</span>
        </div>
        <article v-for="order in orderStore.orders" :key="order.orderId" class="order-card">
          <div>
            <p>{{ order.deliveryDate }}</p>
            <h3>배송 예정 주문</h3>
            <span class="mini-badge">{{ orderStatuses[order.status] || '상태 확인 필요' }}</span>
          </div>
          <div class="order-card__actions">
            <strong>{{ formatAmount(order.amount) }}</strong>
            <button class="button button-secondary" type="button" @click="openOrder(order.orderId)">
              상세 보기
            </button>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.order-history {
  max-width: 880px;
  margin-inline: auto;
}
.page-intro {
  margin: 24px 0 32px;
}
.page-intro h1 {
  margin: 6px 0 10px;
  font-size: var(--font-page-title);
}
.page-intro p:last-child {
  color: var(--color-text-muted);
}
.order-calendar,
.order-list {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.order-calendar__header {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.order-calendar__header h2,
.order-list__heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.order-calendar__weekdays,
.order-calendar__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}
.order-calendar__weekdays {
  margin-top: 20px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}
.order-calendar__day {
  min-height: 82px;
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 7px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}
.order-calendar__day.is-empty {
  border-color: transparent;
  background: var(--color-surface-subtle);
}
.order-calendar__day > strong {
  font-size: var(--font-caption);
}
.order-calendar__item {
  overflow: hidden;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-calendar__notice {
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.order-list__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}
.order-list__heading span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.order-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}
.order-card:last-child {
  padding-bottom: 0;
  border: 0;
}
.order-card p,
.order-card h3 {
  margin: 0;
}
.order-card p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.order-card h3 {
  margin-top: 5px;
  font-size: var(--font-item-title);
}
.order-card .mini-badge {
  display: inline-block;
  margin-top: 7px;
}
.order-card__actions {
  display: grid;
  justify-items: end;
  gap: 10px;
}
@media (max-width: 560px) {
  .order-calendar,
  .order-list {
    padding: 14px;
  }
  .order-calendar__day {
    min-height: 64px;
    padding: 4px;
  }
  .order-calendar__item {
    font-size: 9px;
  }
  .order-card {
    align-items: flex-start;
    flex-direction: column;
  }
  .order-card__actions {
    width: 100%;
    justify-items: stretch;
  }
}
</style>
