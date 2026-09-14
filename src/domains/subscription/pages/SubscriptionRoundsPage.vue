<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { holidayApi } from '../api/holidayApi.js'
import { isOrderMonth } from '../api/orderApi.js'
import { useOrderStore } from '../stores/useOrderStore.js'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const month = ref(dayjs().startOf('month'))
const page = ref(1)
const holidayStatus = ref('idle')
const holidayNames = ref(new Map())
let holidayRequest = null
const kstMonthFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
})
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
  for (const order of orderStore.calendarOrders) {
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
    days.push({
      day,
      date,
      orders: ordersByDate.value.get(date) || [],
      holidayName: holidayNames.value.get(date),
      isSunday: first.date(day).day() === 0,
    })
  }
  while (days.length % 7) days.push(null)
  return days
})

function currentKstMonth() {
  const values = Object.fromEntries(
    kstMonthFormatter
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}`
}

function queryMonth(value) {
  return isOrderMonth(value) ? value : currentKstMonth()
}

function queryPage(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return 1
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : 1
}

function queryFor(valueMonth, valuePage) {
  return { month: valueMonth, page: String(valuePage) }
}

function isCurrentQuery(valueMonth, valuePage) {
  return route.query.month === valueMonth && route.query.page === String(valuePage)
}

function loadHolidays() {
  if (holidayStatus.value === 'success') return Promise.resolve(holidayNames.value)
  if (holidayRequest) return holidayRequest

  holidayStatus.value = 'loading'
  holidayRequest = holidayApi
    .getHolidays()
    .then((calendar) => {
      holidayNames.value = new Map(
        calendar.holidays.map((holiday) => [holiday.holidayDate, holiday.holidayName]),
      )
      holidayStatus.value = 'success'
      return holidayNames.value
    })
    .catch(() => {
      holidayNames.value = new Map()
      holidayStatus.value = 'error'
      return holidayNames.value
    })
    .finally(() => {
      holidayRequest = null
    })
  return holidayRequest
}

async function loadSchedule() {
  const targetMonth = queryMonth(route.query.month)
  const targetPage = queryPage(route.query.page)
  if (!isCurrentQuery(targetMonth, targetPage)) {
    await router.replace({ name: 'wf-022', query: queryFor(targetMonth, targetPage) })
    return
  }

  month.value = dayjs(`${targetMonth}-01`)
  page.value = targetPage
  const [, history] = await Promise.all([
    orderStore.fetchCalendarOrders(targetMonth),
    orderStore.fetchOrderHistory(targetMonth, targetPage),
    loadHolidays(),
  ])
  if (!isCurrentQuery(targetMonth, targetPage)) return
  if (
    orderStore.historyStatus !== 'error' &&
    history.totalPages > 0 &&
    targetPage > history.totalPages
  ) {
    await router.replace({ name: 'wf-022', query: queryFor(targetMonth, history.totalPages) })
    return
  }
}

watch(() => [route.query.month, route.query.page], loadSchedule, { immediate: true })

function formatAmount(amount) {
  return `${Number(amount).toLocaleString('ko-KR')}원`
}

function changeMonth(amount) {
  const nextMonth = month.value.add(amount, 'month').format('YYYY-MM')
  router.push({ name: 'wf-022', query: queryFor(nextMonth, 1) })
}

function changePage(nextPage) {
  if (orderStore.historyStatus === 'loading' || nextPage < 1) return
  router.push({ name: 'wf-022', query: queryFor(month.value.format('YYYY-MM'), nextPage) })
}

function openOrder(orderId) {
  if (!orderStore.selectOrder(orderId)) return
  router.push({ name: 'wf-023', query: queryFor(month.value.format('YYYY-MM'), page.value) })
}

function openDateOrders(date) {
  router.push({
    name: 'subscription-round-date-detail',
    query: { ...queryFor(month.value.format('YYYY-MM'), page.value), date },
  })
}
</script>

<template>
  <div class="page order-history workspace-ui design-review-page">
    <PageBackButton to="/subscription" label="내 구독" />
    <header class="page-intro">
      <p class="section-kicker">주문 일정</p>
      <h1>구독 주문 내역</h1>
      <p>월별 주문 일정과 주문 내역을 확인하세요.</p>
    </header>

    <section class="order-calendar" aria-labelledby="order-calendar-title">
      <header class="order-calendar__header">
        <button class="ui-icon-button" type="button" aria-label="이전 달" @click="changeMonth(-1)">
          <ChevronLeft :size="20" aria-hidden="true" />
        </button>
        <h2 id="order-calendar-title">{{ month.format('YYYY년 M월') }}</h2>
        <button class="ui-icon-button" type="button" aria-label="다음 달" @click="changeMonth(1)">
          <ChevronRight :size="20" aria-hidden="true" />
        </button>
      </header>
      <template v-if="orderStore.calendarStatus === 'error'">
        <div class="ui-empty order-calendar__state" role="alert">
          <h3>주문 달력을 불러오지 못했어요.</h3>
          <p>{{ orderStore.calendarError?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
          <button
            class="button button-secondary"
            type="button"
            @click="orderStore.fetchCalendarOrders(month.format('YYYY-MM'), true)"
          >
            다시 시도
          </button>
        </div>
      </template>
      <template v-else>
        <div class="order-calendar__weekdays" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="order-calendar__days" :aria-busy="orderStore.calendarStatus === 'loading'">
          <div
            v-for="(cell, index) in calendarDays"
            :key="cell?.date || `empty-${index}`"
            class="order-calendar__day"
            :class="{
              'is-empty': !cell,
              'is-holiday': cell?.holidayName,
              'is-sunday': cell?.isSunday,
            }"
          >
            <template v-if="cell">
              <button
                v-if="cell.orders.length"
                class="order-calendar__date-button"
                type="button"
                :aria-label="`${cell.date} 주문 상세 보기`"
                @click="openDateOrders(cell.date)"
              >
                <strong>{{ cell.day }}</strong>
                <small v-if="cell.holidayName" class="order-calendar__holiday">
                  {{ cell.holidayName }}
                </small>
                <span class="order-calendar__marker"
                  ><span aria-hidden="true">●</span> 주문 있음</span
                >
              </button>
              <template v-else>
                <strong>{{ cell.day }}</strong>
                <small v-if="cell.holidayName" class="order-calendar__holiday">
                  {{ cell.holidayName }}
                </small>
              </template>
            </template>
          </div>
        </div>
        <p class="order-calendar__notice">
          {{
            orderStore.calendarStatus === 'loading'
              ? '주문 달력을 불러오고 있어요.'
              : '주문 있음 표시가 있는 날짜를 선택하면 주문 상세를 확인할 수 있어요.'
          }}
        </p>
      </template>
    </section>

    <section class="order-list" aria-labelledby="order-list-title">
      <div class="order-list__heading">
        <button
          class="ui-icon-button"
          type="button"
          aria-label="이전 주문 목록 페이지"
          :disabled="orderStore.historyStatus === 'loading' || !orderStore.history.hasPrevious"
          @click="changePage(page - 1)"
        >
          <ChevronLeft :size="20" aria-hidden="true" />
        </button>
        <div>
          <h2 id="order-list-title">주문 목록</h2>
          <span>{{ orderStore.history.totalElements }}건</span>
        </div>
        <button
          class="ui-icon-button"
          type="button"
          aria-label="다음 주문 목록 페이지"
          :disabled="orderStore.historyStatus === 'loading' || !orderStore.history.hasNext"
          @click="changePage(page + 1)"
        >
          <ChevronRight :size="20" aria-hidden="true" />
        </button>
      </div>
      <p v-if="orderStore.history.totalPages" class="order-list__page" aria-live="polite">
        {{ page }} / {{ orderStore.history.totalPages }} 페이지
      </p>
      <div v-if="orderStore.historyStatus === 'loading'" class="ui-empty" aria-busy="true">
        <h3>주문 목록을 불러오고 있어요.</h3>
      </div>
      <div v-else-if="orderStore.historyStatus === 'error'" class="ui-empty" role="alert">
        <h3>주문 목록을 불러오지 못했어요.</h3>
        <p>{{ orderStore.historyError?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
        <button
          class="button button-secondary"
          type="button"
          @click="orderStore.fetchOrderHistory(month.format('YYYY-MM'), page, true)"
        >
          다시 시도
        </button>
      </div>
      <div v-else-if="orderStore.historyStatus === 'empty'" class="ui-empty">
        <h3>이 달에는 주문 내역이 없어요.</h3>
      </div>
      <template v-else>
        <article v-for="order in orderStore.history.orders" :key="order.orderId" class="order-card">
          <div>
            <p>{{ order.deliveryDate }}</p>
            <h3>주문 정보</h3>
            <span class="mini-badge">{{ orderStatuses[order.status] || '상태 확인 필요' }}</span>
          </div>
          <div class="order-card__actions">
            <strong>{{ formatAmount(order.amount) }}</strong>
            <button class="button button-secondary" type="button" @click="openOrder(order.orderId)">
              상세 보기
            </button>
          </div>
        </article>
      </template>
    </section>
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
.order-calendar__day.is-holiday,
.order-calendar__day.is-sunday {
  border-color: transparent;
  background: var(--color-disabled);
  color: var(--color-text-muted);
}
.order-calendar__holiday {
  overflow: hidden;
  color: inherit;
  font-size: 10px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-calendar__date-button {
  width: 100%;
  min-height: 66px;
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}
.order-calendar__date-button > strong {
  font-size: var(--font-caption);
}
.order-calendar__marker {
  width: fit-content;
  padding: 4px 6px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}
.order-calendar__notice {
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.order-list__heading {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}
.order-list__heading > div {
  text-align: center;
}
.order-list__heading span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.order-list__page {
  margin: 14px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  text-align: center;
}
.order-calendar__state {
  margin-top: 20px;
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
  .order-calendar__marker {
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
