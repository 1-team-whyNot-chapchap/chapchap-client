<script setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Check, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { subscriptionMenuOptions } from '../../product/data/subscriptionMenuOptions'
import {
  getSubscriptionPeriod,
  getSubscriptionCalendarDates,
  SUBSCRIPTION_PERIOD_DAYS,
} from '../../../common/utils/deliveryPolicy'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const weekdays = [
  { value: 0, label: '일', disabled: true },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
]
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
const previewReferenceDate = dayjs()
const { start: firstAvailableDate, end: periodEnd } = getSubscriptionPeriod(previewReferenceDate)
const selectedDate = ref(firstAvailableDate.format('YYYY-MM-DD'))
const previewMonth = ref(firstAvailableDate.startOf('month'))

const calendarDates = computed(() =>
  getSubscriptionCalendarDates(previewMonth.value, props.modelValue, previewReferenceDate),
)

function changeMonth(amount) {
  previewMonth.value = previewMonth.value.add(amount, 'month')
  const visibleDates = calendarDates.value.filter((date) => date.isCurrentMonth)
  selectedDate.value = (
    visibleDates.find((date) => date.isDeliveryDay) ||
    visibleDates.find((date) => date.isAvailable) ||
    visibleDates[0]
  ).value
}

function dateStatus(date) {
  if (date.isAfterPeriod) return '구독 기간 이후'
  if (!date.isAvailable) return '배송 시작 전'
  return date.isDeliveryDay ? '선택 요일 배송' : '배송 없음'
}

const selectedDateInfo = computed(
  () =>
    calendarDates.value.find((date) => date.value === selectedDate.value) || calendarDates.value[0],
)

const selectedDateMenu = computed(() => {
  if (!selectedDateInfo.value) return null

  return subscriptionMenuOptions[selectedDateInfo.value.dayNumber % 3]
})

const selectedWeekdayLabel = computed(() =>
  props.modelValue.map((weekday) => weekdayLabels[weekday]).join(' · '),
)

function toggleWeekday(weekday) {
  const nextWeekdays = props.modelValue.includes(weekday)
    ? props.modelValue.filter((value) => value !== weekday)
    : [...props.modelValue, weekday]

  emit(
    'update:modelValue',
    nextWeekdays.sort((a, b) => a - b),
  )
}

function selectDate(date) {
  selectedDate.value = date
}

watch(
  () => props.modelValue,
  (selectedWeekdays) => {
    const firstDeliveryDate = calendarDates.value.find(
      (date) => date.isAvailable && selectedWeekdays.includes(date.weekday),
    )

    if (firstDeliveryDate && !selectedWeekdays.includes(selectedDateInfo.value?.weekday)) {
      selectedDate.value = firstDeliveryDate.value
    }
  },
)

function formatDate(date) {
  return dayjs(date).format('M월 D일')
}
</script>

<template>
  <section class="subscription-schedule" aria-labelledby="subscription-schedule-title">
    <div class="subscription-schedule__intro">
      <div>
        <h2 id="subscription-schedule-title">배송 요일</h2>
        <p>선택한 요일에 매주 반복 배송됩니다. 일요일은 배송하지 않아요.</p>
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
            @click="changeMonth(-1)"
          >
            <ChevronLeft :size="20" aria-hidden="true" />
          </button>
          <h2 aria-live="polite">{{ previewMonth.format('YYYY년 M월') }}</h2>
          <button class="ui-icon-button" type="button" aria-label="다음 달" @click="changeMonth(1)">
            <ChevronRight :size="20" aria-hidden="true" />
          </button>
        </header>
        <p class="subscription-schedule__period">
          구독 기간 · {{ firstAvailableDate.format('YYYY.MM.DD') }} ~
          {{ periodEnd.format('YYYY.MM.DD') }} · {{ SUBSCRIPTION_PERIOD_DAYS }}일
        </p>
        <div class="subscription-schedule__calendar-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="subscription-schedule__calendar-days">
          <button
            v-for="date in calendarDates"
            :key="date.value"
            type="button"
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
            <span class="subscription-schedule__day-marker" aria-hidden="true"></span>
          </button>
        </div>
        <div class="subscription-schedule__legend" aria-label="달력 표시 안내">
          <span><i class="delivery-marker" aria-hidden="true"></i>배송 예정</span>
          <span><i class="selected-marker" aria-hidden="true"></i>확인 중인 날짜</span>
          <span>점 없는 날은 배송 없음</span>
        </div>
      </section>

      <aside v-if="selectedDateInfo" class="subscription-schedule__detail" aria-live="polite">
        <p class="section-kicker">
          {{ formatDate(selectedDateInfo.value) }} ·
          {{ weekdayLabels[selectedDateInfo.weekday] }}요일
        </p>
        <h2>
          {{
            selectedDateInfo.isDeliveryDay
              ? '배송 예정 메뉴'
              : selectedDateInfo.isAvailable
                ? '배송 없는 날'
                : selectedDateInfo.isAfterPeriod
                  ? '구독 기간 이후'
                  : '배송 시작 전'
          }}
        </h2>
        <template v-if="selectedDateInfo.isDeliveryDay && selectedDateMenu">
          <dl>
            <div>
              <dt>메뉴</dt>
              <dd>{{ selectedDateMenu.name }}</dd>
            </div>
            <div>
              <dt>플랜</dt>
              <dd>선택한 플랜 기준</dd>
            </div>
            <div>
              <dt>배송 조건</dt>
              <dd>다음 단계에서 요일별로 설정</dd>
            </div>
          </dl>
        </template>
        <p v-else>
          {{
            selectedDateInfo.isAvailable
              ? '배송 요일을 선택하면 날짜별 메뉴를 미리 확인할 수 있어요.'
              : selectedDateInfo.isAfterPeriod
                ? '이번 28일 구독 기간에 포함되지 않는 날짜입니다.'
                : '첫 배송 가능일 전에는 배송 일정이 없어요.'
          }}
        </p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
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
.subscription-schedule__detail dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px 0 0;
  margin: 16px 0 0;
  border-top: 1px solid var(--color-border);
}
.subscription-schedule__detail dl div {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.subscription-schedule__detail dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-schedule__detail dd {
  margin: 0;
  font-size: var(--font-body);
  font-weight: 700;
}
.subscription-schedule__weekday:focus-visible,
.subscription-schedule__calendar-days button:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.5);
  outline-offset: -3px;
}
@media (max-width: 640px) {
  .subscription-schedule__detail dl {
    grid-template-columns: minmax(0, 1fr);
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
