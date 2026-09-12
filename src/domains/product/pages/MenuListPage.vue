<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import { ChevronRight } from 'lucide-vue-next'
import { datePickerPt } from '../../../common/constants/primeUiPt'
import { planApi } from '../../subscription/api/planApi.js'
import { holidayApi } from '../../subscription/api/holidayApi.js'
import {
  canSelectMenuDate,
  canNavigateMenuCalendar,
  formatMenuDate,
  menuDateError,
  menuForDate,
  parseMenuDate,
} from '../utils/menuCalendar.js'

const route = useRoute()
const router = useRouter()
const calendar = ref(null)
const holidayStatus = ref('loading')
const planStatus = ref('idle')
const plans = ref([])
const failedImages = ref({})
let holidayVersion = 0
let planVersion = 0
const selectedDate = computed(() =>
  holidayStatus.value === 'success' && canSelectMenuDate(route.query.date, calendar.value)
    ? route.query.date
    : null,
)
const pickerDate = computed({
  get: () => parseMenuDate(selectedDate.value),
  set: (date) => {
    const value = formatMenuDate(date)
    if (holidayStatus.value === 'success' && canSelectMenuDate(value, calendar.value)) {
      router.replace({ query: { ...route.query, date: value } })
    }
  },
})
const dateError = computed(() =>
  holidayStatus.value === 'success' && Object.hasOwn(route.query, 'date')
    ? menuDateError(route.query.date, calendar.value)
    : '',
)
const disabledDates = computed(
  () => calendar.value?.holidays.map((item) => parseMenuDate(item.holidayDate)) ?? [],
)
const holidayNames = computed(
  () => new Map(calendar.value?.holidays.map((item) => [item.holidayDate, item.holidayName]) ?? []),
)
function dayKey(date) {
  return formatMenuDate(new Date(date.year, date.month, date.day))
}
function isSunday(date) {
  return new Date(date.year, date.month, date.day).getDay() === 0
}
const calendarPt = {
  ...datePickerPt,
  panel: ({ state }) => ({
    class: 'ui-calendar menu-calendar-panel',
    onClickCapture: (event) => guardNavigationClick(event, state),
    onKeydownCapture: (event) => guardNavigationKey(event, state),
  }),
  pcPrevButton: ({ state }) => navigationButton(state, -1),
  pcNextButton: ({ state }) => navigationButton(state, 1),
  day: ({ context }) => ({
    class: 'ui-calendar-day menu-calendar-day',
    'data-menu-cell': 'date',
    'data-menu-disabled': context.disabled,
  }),
  month: ({ context }) => ({
    class: 'ui-calendar-choice',
    'data-menu-cell': 'month',
    'data-menu-disabled': context.disabled,
  }),
  year: ({ context }) => ({
    class: 'ui-calendar-choice',
    'data-menu-cell': 'year',
    'data-menu-disabled': context.disabled,
    hidden: context.disabled,
    style: context.disabled ? 'display: none' : undefined,
  }),
  selectYear: 'ui-calendar-nav menu-calendar-year',
}
function navigationButton(state, direction) {
  return {
    root: {
      class: 'ui-icon-button',
      'data-menu-direction': direction,
      disabled: !canNavigateMenuCalendar(state, direction, calendar.value),
    },
  }
}
function stopNavigation(event) {
  event.preventDefault()
  event.stopPropagation()
}
function guardNavigationClick(event, state) {
  const button = event.target.closest('[data-menu-direction]')
  if (
    button &&
    !canNavigateMenuCalendar(
      state,
      Number(button.dataset.menuDirection),
      calendar.value,
      event.shiftKey,
    )
  )
    stopNavigation(event)
}
function guardNavigationKey(event, state) {
  const cell = event.target.closest('[data-menu-cell]')
  if (!cell) return
  const backward = ['ArrowLeft', 'ArrowUp', 'Home', 'PageUp'].includes(event.code)
  const forward = ['ArrowRight', 'ArrowDown', 'End', 'PageDown'].includes(event.code)
  if (!backward && !forward) return
  const direction = backward ? -1 : 1
  if (canNavigateMenuCalendar(state, direction, calendar.value, event.shiftKey)) return

  // 경계에서 라이브러리의 자동 월/연도 이동을 막되 같은 화면의 유효 셀 간 이동은 유지한다.
  stopNavigation(event)
  if (event.code.startsWith('Page')) return
  const cells = Array.from(event.currentTarget.querySelectorAll('[data-menu-cell]')).filter(
    (item) => !item.hidden,
  )
  const index = cells.indexOf(cell)
  const columns = state.currentView === 'date' ? 7 : state.currentView === 'month' ? 3 : 2
  const step = ['ArrowUp', 'ArrowDown'].includes(event.code) ? direction * columns : direction
  let next = index + step
  if (event.code === 'Home') next = Math.floor(index / columns) * columns
  if (event.code === 'End')
    next = Math.min(cells.length - 1, Math.floor(index / columns) * columns + columns - 1)
  const searchStep = event.code === 'Home' ? 1 : event.code === 'End' ? -1 : step
  while (next >= 0 && next < cells.length && cells[next].dataset.menuDisabled === 'true')
    next += searchStep
  if (next < 0 || next >= cells.length) return
  cell.tabIndex = -1
  cells[next].tabIndex = 0
  cells[next].focus()
}
const selectedDateLabel = computed(() =>
  selectedDate.value ? dayjs(selectedDate.value).format('YYYY년 M월 D일') : '',
)
const cards = computed(() =>
  selectedDate.value
    ? plans.value.map((plan) => ({
        planId: plan.planId,
        planLabel: plan.name,
        menu: menuForDate(plan, selectedDate.value),
      }))
    : [],
)

async function loadHolidays() {
  const version = ++holidayVersion
  holidayStatus.value = 'loading'
  calendar.value = null
  try {
    const data = await holidayApi.getHolidays()
    if (version !== holidayVersion) return
    calendar.value = data
    holidayStatus.value = 'success'
  } catch {
    if (version === holidayVersion) holidayStatus.value = 'error'
  }
}
async function loadPlans() {
  const version = ++planVersion
  planStatus.value = 'loading'
  try {
    const list = await planApi.listPlans()
    const details = await Promise.all(list.map((plan) => planApi.getPlan(plan.planId)))
    if (version !== planVersion) return
    plans.value = details
    planStatus.value = details.length ? 'success' : 'error'
  } catch {
    if (version === planVersion) planStatus.value = 'error'
  }
}
watch(selectedDate, (date) => {
  failedImages.value = {}
  if (date && planStatus.value === 'idle') loadPlans()
})
loadHolidays()
onUnmounted(() => {
  holidayVersion++
  planVersion++
})
</script>

<template>
  <div class="page menu-calendar-page workspace-ui design-review-page">
    <header class="ui-heading">
      <div>
        <h1>날짜별 메뉴</h1>
        <p>날짜를 선택하고 플랜별 메뉴를 확인하세요.</p>
      </div>
    </header>

    <section class="menu-calendar" aria-label="메뉴 날짜 선택">
      <DatePicker
        v-if="calendar"
        v-model="pickerDate"
        inline
        :pt="calendarPt"
        :show-other-months="true"
        :disabled="holidayStatus !== 'success'"
        :disabled-days="[0]"
        :disabled-dates="disabledDates"
        :min-date="calendar ? parseMenuDate(calendar.supportedStartDate) : undefined"
        :max-date="calendar ? parseMenuDate(calendar.supportedEndDate) : undefined"
        aria-label="메뉴 날짜"
      >
        <template #decade="{ years }">
          {{
            years
              .filter((year) => year.selectable)
              .map((year) => year.value)
              .join(' · ')
          }}
        </template>
        <template #date="{ date }">
          <span
            class="calendar-date"
            :class="{ 'calendar-date--holiday': isSunday(date) || holidayNames.has(dayKey(date)) }"
            :title="
              holidayNames.get(dayKey(date)) || (isSunday(date) ? '일요일 · 선택 불가' : undefined)
            "
          >
            <span>{{ date.day }}</span>
            <small v-if="holidayNames.has(dayKey(date))">{{
              holidayNames.get(dayKey(date))
            }}</small>
          </span>
        </template>
      </DatePicker>
      <p v-if="holidayStatus === 'loading'" role="status">공휴일 정보를 불러오는 중입니다.</p>
      <div v-else-if="holidayStatus === 'error'" role="alert">
        <p>공휴일 정보를 불러오지 못해 날짜를 선택할 수 없습니다.</p>
        <button class="button button-outline" @click="loadHolidays">공휴일 다시 불러오기</button>
      </div>
    </section>

    <section
      v-if="holidayStatus === 'success' && (selectedDate || dateError)"
      class="menu-results"
      :aria-label="selectedDate ? `${selectedDateLabel} 메뉴` : '메뉴 날짜 선택 안내'"
    >
      <p v-if="dateError" role="status">{{ dateError }}</p>
      <template v-else>
        <h2>{{ selectedDateLabel }} 메뉴</h2>
        <p v-if="planStatus === 'loading'" role="status">메뉴 정보를 불러오는 중입니다.</p>
        <div v-else-if="planStatus === 'error'" role="alert">
          <p>메뉴 정보를 불러오지 못했습니다.</p>
          <button class="button button-outline" @click="loadPlans">메뉴 다시 불러오기</button>
        </div>
        <div v-else-if="planStatus === 'success'" class="plan-menu-grid">
          <article v-for="card in cards" :key="card.planId" class="plan-menu-card">
            <div class="menu-photo">
              <img
                v-if="card.menu?.imageUrl && !failedImages[card.planId]"
                :src="card.menu.imageUrl"
                :alt="card.menu.name"
                @error="failedImages[card.planId] = true"
              />
              <span v-else>메뉴 이미지 준비 중</span>
            </div>
            <div class="plan-menu-card__body">
              <span class="plan-label">{{ card.planLabel }} 플랜</span>
              <template v-if="card.menu">
                <h3>{{ card.menu.name }}</h3>
                <RouterLink
                  class="button button-outline menu-detail-button"
                  :aria-label="`${card.planLabel} ${card.menu.name} 메뉴 상세`"
                  :to="{
                    name: 'wf-009',
                    query: {
                      planId: card.planId,
                      menuSequence: card.menu.menuSequence,
                      from: 'calendar',
                      date: selectedDate,
                    },
                  }"
                >
                  <span>메뉴 상세</span>
                  <ChevronRight :size="18" aria-hidden="true" />
                </RouterLink>
              </template>
              <p v-else class="menu-empty" role="status">해당 날짜의 메뉴 정보가 없습니다.</p>
            </div>
          </article>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.calendar-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}
.calendar-date small {
  font-size: 11px;
  line-height: 1.2;
  white-space: normal;
  overflow-wrap: anywhere;
}
.calendar-date--holiday {
  color: #b42318;
}
.menu-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}
.menu-detail-button {
  width: 100%;
  min-width: 0;
  margin-top: auto;
  white-space: normal;
  text-decoration: none;
}
.menu-detail-button:focus-visible {
  outline: 3px solid var(--color-primary-pressed);
  outline-offset: 2px;
}
.menu-calendar,
.menu-results {
  margin-top: var(--space-5);
}
.menu-calendar :deep(.ui-datepicker) {
  display: block;
  width: 100%;
}
.menu-calendar :deep(.menu-calendar-panel) {
  max-width: 100%;
  padding: var(--space-5);
}
.menu-calendar :deep(.ui-calendar-header) {
  display: grid;
  grid-template-columns: 44px auto 44px;
  justify-content: center;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
}
.menu-calendar :deep(.ui-calendar-title) {
  justify-content: center;
}
.menu-calendar :deep(.ui-calendar-nav) {
  font-size: var(--font-section-title);
}
.menu-calendar :deep(.menu-calendar-year) {
  order: -1;
}
.menu-calendar :deep(.menu-calendar-year)::after {
  content: '년';
}
.menu-calendar :deep(.menu-calendar-day) {
  aspect-ratio: 1;
  min-height: 44px;
  font-size: var(--font-section-title);
  font-weight: var(--font-weight-bold);
}
.menu-calendar :deep(.ui-calendar-table th + th),
.menu-calendar :deep(.ui-calendar-table td + td) {
  border-left: 1px solid var(--color-border);
}
.menu-calendar :deep(.ui-calendar-table tbody tr) {
  border-top: 1px solid var(--color-border);
}
.plan-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}
.plan-menu-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.menu-photo {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.plan-menu-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  word-break: keep-all;
  overflow-wrap: anywhere;
}
.plan-label {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}
.plan-menu-card h3 {
  margin: 0;
  font-size: var(--font-item-title);
  line-height: var(--line-height-compact);
}
.plan-menu-card p {
  color: var(--color-text-muted);
}
@media (max-width: 760px) {
  .menu-calendar :deep(.menu-calendar-panel) {
    padding: var(--space-2);
  }
  .menu-calendar :deep(.menu-calendar-day) {
    min-height: 44px;
  }
  .plan-menu-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
}
</style>
