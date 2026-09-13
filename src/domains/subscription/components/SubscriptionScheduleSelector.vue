<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Check, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { holidayApi } from '../api/holidayApi.js'
import { DELIVERY_WEEKDAYS } from '../firstSubscriptionForm.js'
import { canSelectMenuDate, menuForDate } from '../../product/utils/menuCalendar.js'
import {
  calculateFirstSubscriptionSchedule,
  subscriptionReference,
} from '../firstSubscriptionSchedule.js'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  plan: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const weekdays = [
  { value: 'SUNDAY', label: '일', disabled: true },
  ...DELIVERY_WEEKDAYS.map((value, index) => ({
    value,
    label: ['월', '화', '수', '목', '금', '토'][index],
  })),
]
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
const now = ref(new Date())
const calendar = ref(null)
const holidayStatus = ref('loading')
const selectedDate = ref('')
const previewMonth = ref(dayjs(subscriptionReference(now.value).today).startOf('month'))
const imageFailed = ref(false)
let requestVersion = 0
let timer
let mounted = false
const schedule = computed(() =>
  calculateFirstSubscriptionSchedule(now.value, props.modelValue, calendar.value),
)
const holidayNames = computed(
  () => new Map(calendar.value?.holidays.map((item) => [item.holidayDate, item.holidayName]) ?? []),
)
const scheduleMessage = computed(() => {
  if (holidayStatus.value !== 'success') return ''
  if (schedule.value.status === 'unselected')
    return '배송 요일을 선택하면 예상 이용 기간과 배송 예정일을 표시합니다.'
  if (schedule.value.status !== 'ready')
    return '공휴일 정보 제공 범위 안에서 예상 28일 일정을 확인할 수 없습니다.'
  return ''
})
const calendarDates = computed(() => {
  const first = previewMonth.value.startOf('month')
  const last = previewMonth.value.endOf('month')
  const start = first.subtract(first.day(), 'day')
  const end = last.add(6 - last.day(), 'day')
  return Array.from({ length: end.diff(start, 'day') + 1 }, (_, index) => {
    const date = start.add(index, 'day')
    const value = date.format('YYYY-MM-DD')
    return {
      value,
      dayNumber: date.date(),
      weekday: date.day(),
      isCurrentMonth: date.month() === previewMonth.value.month(),
      isAvailable: holidayStatus.value === 'success' && canSelectMenuDate(value, calendar.value),
      isDeliveryDay:
        holidayStatus.value === 'success' && schedule.value.deliveryDates.includes(value),
      holidayName: holidayNames.value.get(value),
    }
  })
})

function canChangeMonth(amount) {
  if (holidayStatus.value !== 'success') return false
  const month = previewMonth.value.add(amount, 'month').format('YYYY-MM')
  return (
    month >= calendar.value.supportedStartDate.slice(0, 7) &&
    month <= calendar.value.supportedEndDate.slice(0, 7)
  )
}

function changeMonth(amount) {
  if (!canChangeMonth(amount)) return
  previewMonth.value = previewMonth.value.add(amount, 'month')
  selectedDate.value = ''
}

function dateStatus(date) {
  if (date.holidayName) return `${date.holidayName} · 선택 불가`
  if (date.weekday === 0) return '일요일 · 선택 불가'
  if (!date.isAvailable) return '선택 불가'
  return date.isDeliveryDay ? '배송 예정' : '메뉴 확인용 · 배송 예정일 아님'
}

const selectedDateInfo = computed(() =>
  calendarDates.value.find((date) => date.value === selectedDate.value && date.isAvailable),
)

const selectedDateMenu = computed(() => {
  if (!selectedDateInfo.value) return null

  return menuForDate(props.plan, selectedDate.value)
})

const selectedWeekdayLabel = computed(() =>
  weekdays
    .filter((weekday) => props.modelValue.includes(weekday.value))
    .map((weekday) => weekday.label)
    .join(' · '),
)

function toggleWeekday(weekday) {
  if (!DELIVERY_WEEKDAYS.includes(weekday)) return
  refreshTime()
  const nextWeekdays = props.modelValue.includes(weekday)
    ? props.modelValue.filter((value) => value !== weekday)
    : [...props.modelValue, weekday]

  emit(
    'update:modelValue',
    DELIVERY_WEEKDAYS.filter((value) => nextWeekdays.includes(value)),
  )
}

function selectDate(date) {
  refreshTime()
  if (holidayStatus.value !== 'success' || !canSelectMenuDate(date, calendar.value)) return
  selectedDate.value = date
}

watch(
  () => [props.plan.planId, selectedDate.value, selectedDateMenu.value?.imageUrl],
  () => {
    imageFailed.value = false
  },
)
watch(
  () => props.plan.planId,
  () => {
    selectedDate.value = ''
  },
)

async function loadHolidays() {
  const version = ++requestVersion
  calendar.value = null
  selectedDate.value = ''
  holidayStatus.value = 'loading'
  try {
    const data = await holidayApi.getHolidays()
    if (!mounted || version !== requestVersion) return
    calendar.value = data
    holidayStatus.value = 'success'
    const month = previewMonth.value.format('YYYY-MM')
    if (month < data.supportedStartDate.slice(0, 7))
      previewMonth.value = dayjs(data.supportedStartDate).startOf('month')
    if (month > data.supportedEndDate.slice(0, 7))
      previewMonth.value = dayjs(data.supportedEndDate).startOf('month')
  } catch {
    if (mounted && version === requestVersion) holidayStatus.value = 'error'
  }
}

function refreshTime() {
  now.value = new Date()
}
function refreshOnVisible() {
  if (document.visibilityState === 'visible') refreshTime()
}
function scheduleClock() {
  refreshTime()
  // Wake at the next wall-clock minute, including exactly 14:00 and midnight.
  timer = window.setTimeout(scheduleClock, 60000 - (Date.now() % 60000))
}
onMounted(() => {
  mounted = true
  loadHolidays()
  scheduleClock()
  window.addEventListener('focus', refreshTime)
  document.addEventListener('visibilitychange', refreshOnVisible)
})
onBeforeUnmount(() => {
  mounted = false
  requestVersion++
  window.clearTimeout(timer)
  window.removeEventListener('focus', refreshTime)
  document.removeEventListener('visibilitychange', refreshOnVisible)
})

function formatDate(date) {
  return dayjs(date).format('M월 D일')
}
</script>

<template>
  <section class="subscription-schedule" aria-labelledby="subscription-schedule-title">
    <div class="subscription-schedule__intro">
      <div>
        <h2 id="subscription-schedule-title">배송 요일</h2>
        <p>월요일부터 토요일 중 1~6개 요일을 선택해 주세요.</p>
      </div>
      <strong v-if="selectedWeekdayLabel">{{ selectedWeekdayLabel }} 배송</strong>
    </div>

    <div
      class="subscription-schedule__weekday-picker"
      role="group"
      aria-label="반복 배송 요일 선택"
    >
      <button
        v-for="weekday in weekdays"
        :key="weekday.value"
        class="subscription-schedule__weekday"
        :class="{ 'is-selected': modelValue.includes(weekday.value) }"
        :disabled="weekday.disabled"
        type="button"
        :aria-pressed="modelValue.includes(weekday.value)"
        :aria-label="`${weekday.label} ${weekday.disabled ? '휴무' : modelValue.includes(weekday.value) ? '선택됨' : '선택'}`"
        @click="toggleWeekday(weekday.value)"
      >
        <strong>{{ weekday.label }}</strong>
        <small aria-hidden="true">{{
          weekday.disabled ? '휴무' : modelValue.includes(weekday.value) ? '선택됨' : '선택'
        }}</small>
        <span class="subscription-schedule__weekday-mark" aria-hidden="true">
          <Check v-if="modelValue.includes(weekday.value)" :size="14" />
          <span v-else-if="weekday.disabled">휴무</span>
        </span>
      </button>
    </div>

    <div class="subscription-schedule__preview">
      <section class="subscription-schedule__calendar" aria-label="날짜별 배송 메뉴 미리보기">
        <header class="subscription-schedule__month-navigation">
          <button
            class="ui-icon-button"
            type="button"
            aria-label="이전 달"
            :disabled="!canChangeMonth(-1)"
            @click="changeMonth(-1)"
          >
            <ChevronLeft :size="20" aria-hidden="true" />
          </button>
          <h2 aria-live="polite">{{ previewMonth.format('YYYY년 M월') }}</h2>
          <button
            class="ui-icon-button"
            type="button"
            aria-label="다음 달"
            :disabled="!canChangeMonth(1)"
            @click="changeMonth(1)"
          >
            <ChevronRight :size="20" aria-hidden="true" />
          </button>
        </header>
        <p v-if="schedule.status === 'ready'" class="subscription-schedule__period">
          예상 이용 기간 · {{ schedule.periodStartDate }} ~ {{ schedule.periodEndDate }} · 28일
        </p>
        <p v-else-if="scheduleMessage" role="status">{{ scheduleMessage }}</p>
        <p>
          현재 한국 시간 기준 예상 일정이며, 신청 시각에 따라 달라질 수 있습니다. 결제 단계에서
          일정을 다시 확인해 주세요.
        </p>
        <p v-if="holidayStatus === 'loading'" role="status">공휴일 정보를 불러오는 중입니다.</p>
        <div v-else-if="holidayStatus === 'error'" role="alert">
          <p>공휴일 정보를 불러오지 못해 날짜를 선택할 수 없습니다.</p>
          <button type="button" class="button button-secondary" @click="loadHolidays">
            다시 시도
          </button>
        </div>
        <div class="subscription-schedule__calendar-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="subscription-schedule__calendar-days">
          <button
            v-for="date in calendarDates"
            :key="date.value"
            type="button"
            :disabled="!date.isAvailable"
            :class="{
              'is-delivery-day': date.isDeliveryDay,
              'is-current': selectedDate === date.value,
              'is-outside-month': !date.isCurrentMonth,
              'is-before-start': !date.isAvailable,
            }"
            :aria-pressed="selectedDate === date.value"
            :aria-label="`${formatDate(date.value)} ${dateStatus(date)} 메뉴 확인`"
            @click="selectDate(date.value)"
          >
            <strong>{{ date.dayNumber }}</strong>
            <small v-if="date.holidayName" class="subscription-schedule__holiday">{{
              date.holidayName
            }}</small>
            <span class="subscription-schedule__day-marker" aria-hidden="true"></span>
          </button>
        </div>
        <div class="subscription-schedule__legend" aria-label="달력 표시 안내">
          <span><i class="delivery-marker" aria-hidden="true"></i>배송 예정</span>
          <span><i class="selected-marker" aria-hidden="true"></i>확인 중인 날짜</span>
        </div>
      </section>

      <aside v-if="selectedDateInfo" class="subscription-schedule__detail" aria-live="polite">
        <div class="subscription-schedule__menu-meta">
          <p class="section-kicker">
            {{ formatDate(selectedDateInfo.value) }} ·
            {{ weekdayLabels[selectedDateInfo.weekday] }}요일
          </p>
          <span>{{ selectedDateInfo.isDeliveryDay ? '배송 예정 메뉴' : '날짜별 메뉴 안내' }}</span>
        </div>
        <div v-if="selectedDateMenu" class="subscription-schedule__menu-layout">
          <img
            v-if="selectedDateMenu.imageUrl && !imageFailed"
            :key="`${plan.planId}:${selectedDate}`"
            class="subscription-schedule__image"
            :src="selectedDateMenu.imageUrl"
            :alt="selectedDateMenu.name"
            @error="imageFailed = true"
          />
          <div v-else class="subscription-schedule__image-placeholder">메뉴 이미지 준비 중</div>
          <div class="subscription-schedule__menu-title">
            <p class="section-kicker">{{ plan.name }}</p>
            <h2>{{ selectedDateMenu.name }}</h2>
          </div>
          <p class="subscription-schedule__menu-description">
            {{ selectedDateMenu.description || '등록된 정보 없음' }}
          </p>
          <dl>
            <div>
              <dt>영양 정보</dt>
              <dd>{{ selectedDateMenu.nutritionInfo || '등록된 정보 없음' }}</dd>
            </div>
            <div>
              <dt>알레르기</dt>
              <dd>{{ selectedDateMenu.allergenInfo || '등록된 정보 없음' }}</dd>
            </div>
            <div>
              <dt>원재료</dt>
              <dd>{{ selectedDateMenu.ingredientInfo || '등록된 정보 없음' }}</dd>
            </div>
          </dl>
        </div>
        <p v-else role="alert">해당 날짜의 메뉴 정보를 확인할 수 없습니다.</p>
        <p v-if="selectedDateMenu && !selectedDateInfo.isDeliveryDay">
          배송 예정일이 아닌 날짜의 메뉴를 확인 중입니다.
        </p>
      </aside>
      <p v-else-if="holidayStatus === 'success'" class="subscription-schedule__detail">
        날짜를 누르면 선택 플랜의 메뉴를 확인할 수 있습니다.
      </p>
    </div>
  </section>
</template>

<style scoped>
.subscription-schedule__image,
.subscription-schedule__image-placeholder {
  grid-area: image;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 12px;
  align-self: start;
}
.subscription-schedule__image-placeholder {
  display: grid;
  place-items: center;
  background: var(--color-disabled);
  padding: 12px;
  box-sizing: border-box;
  text-align: center;
  font-size: var(--font-caption);
}
.subscription-schedule__menu-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.subscription-schedule__menu-meta > span {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}
.subscription-schedule__menu-layout {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  grid-template-areas: 'image title' 'image description' 'image facts';
  gap: 12px 20px;
  align-items: start;
}
.subscription-schedule__menu-title {
  grid-area: title;
  min-width: 0;
}
.subscription-schedule__menu-description {
  grid-area: description;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.subscription-schedule__holiday {
  font-size: 10px;
  overflow-wrap: anywhere;
  color: var(--color-text-muted);
}
.subscription-schedule__calendar-days button:disabled {
  cursor: not-allowed;
  background: var(--color-disabled);
}
.subscription-schedule {
  word-break: keep-all;
  display: grid;
  gap: 20px;
}
.subscription-schedule__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.subscription-schedule__month-navigation {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.subscription-schedule__calendar .subscription-schedule__period {
  margin-top: 12px;
  text-align: center;
  font-size: var(--font-caption);
}
.subscription-schedule__intro h2,
.subscription-schedule__calendar h2,
.subscription-schedule__detail h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.subscription-schedule__intro p,
.subscription-schedule__calendar p,
.subscription-schedule__detail > p:last-child {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.subscription-schedule__intro > strong,
.subscription-schedule__calendar header > span {
  flex: 0 0 auto;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.subscription-schedule__weekday-picker {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}
.subscription-schedule__weekday {
  min-height: 68px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
}
.subscription-schedule__weekday small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-schedule__weekday-mark {
  display: none;
}
.subscription-schedule__weekday.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.subscription-schedule__weekday.is-selected small {
  color: inherit;
}
.subscription-schedule__weekday:disabled {
  cursor: not-allowed;
  color: var(--color-text-muted);
  background: var(--color-disabled);
}
.subscription-schedule__preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.subscription-schedule__calendar,
.subscription-schedule__detail {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.subscription-schedule__calendar-weekdays,
.subscription-schedule__calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}
.subscription-schedule__calendar-weekdays {
  margin-top: 20px;
}
.subscription-schedule__calendar-weekdays span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}
.subscription-schedule__calendar-days {
  margin-top: 8px;
}
.subscription-schedule__calendar-days button {
  min-height: 56px;
  min-width: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  padding: 5px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-body);
}
.subscription-schedule__day-marker {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
}
.is-delivery-day .subscription-schedule__day-marker {
  background: currentColor;
}
.subscription-schedule__calendar-days button.is-before-start,
.subscription-schedule__calendar-days button.is-outside-month {
  color: var(--color-text-muted);
  font-weight: 400;
}
.subscription-schedule__calendar-days button.is-before-start strong,
.subscription-schedule__calendar-days button.is-outside-month strong {
  font-weight: 400;
}
.subscription-schedule__calendar-days button.is-delivery-day {
  border-color: var(--color-primary-soft);
  color: var(--color-text);
  background: var(--color-primary-soft);
}
.subscription-schedule__calendar-days button.is-current {
  border-color: var(--color-primary-pressed);
  color: var(--color-surface);
  background: var(--color-primary-pressed);
}
.subscription-schedule__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-schedule__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.delivery-marker {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary-pressed);
}
.selected-marker {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--color-primary-pressed);
}
.subscription-schedule__detail {
  min-width: 0;
  align-self: start;
}
.subscription-schedule__detail .section-kicker {
  margin: 0 0 7px;
}
.subscription-schedule__menu-meta .section-kicker {
  margin: 0;
}
.subscription-schedule__menu-title h2 {
  font-size: 20px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.subscription-schedule__detail dl {
  grid-area: facts;
  display: grid;
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.subscription-schedule__detail dl div {
  min-width: 0;
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  line-height: 1.6;
}
.subscription-schedule__detail dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-schedule__detail dd {
  margin: 0;
  font-size: var(--font-caption);
  overflow-wrap: anywhere;
}
.subscription-schedule__weekday:focus-visible,
.subscription-schedule__calendar-days button:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.5);
  outline-offset: -3px;
}
@media (max-width: 640px) {
  .subscription-schedule__menu-layout {
    grid-template-columns: 110px minmax(0, 1fr);
    grid-template-areas: 'image title' 'description description' 'facts facts';
    gap: 12px 16px;
  }
  .subscription-schedule__menu-title {
    align-self: center;
  }
  .subscription-schedule__menu-title h2 {
    font-size: 18px;
  }
}
@media (max-width: 430px) {
  .subscription-schedule__intro {
    align-items: flex-start;
    flex-direction: column;
  }
  .subscription-schedule__calendar,
  .subscription-schedule__detail {
    padding: 16px;
  }
  .subscription-schedule__weekday-picker {
    gap: 5px;
  }
  .subscription-schedule__weekday {
    min-height: 60px;
    padding: 4px 0;
    border-radius: 10px;
  }
  .subscription-schedule__weekday small {
    display: none;
  }
  .subscription-schedule__weekday-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    font-size: var(--font-caption);
  }
  .subscription-schedule__calendar-days button {
    min-height: 48px;
  }
}
</style>
