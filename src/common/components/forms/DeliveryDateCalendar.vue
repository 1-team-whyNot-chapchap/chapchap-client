<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import dayjs from 'dayjs'
import {
  MINIMUM_DELIVERY_DATE_COUNT,
  getNextMonday,
  isDeliveryDateAvailable,
} from '../../../common/utils/deliveryPolicy'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])
const weekDays = ['월', '화', '수', '목', '금', '토', '일']
const today = dayjs().startOf('day')
const firstAvailableDate = getNextMonday(today)
const visibleCycleStart = ref(firstAvailableDate)

const cycleLabel = computed(() => {
  const cycleEnd = visibleCycleStart.value.add(13, 'day')
  const startsAndEndsInSameMonth = visibleCycleStart.value.isSame(cycleEnd, 'month')

  return startsAndEndsInSameMonth
    ? `${visibleCycleStart.value.format('YYYY년 M월')} · 2주 배송 주기`
    : `${visibleCycleStart.value.format('M월 D일')} ~ ${cycleEnd.format('M월 D일')}`
})
const canMovePreviousCycle = computed(() =>
  visibleCycleStart.value.isAfter(firstAvailableDate, 'day'),
)
const calendarWeeks = computed(() =>
  [0, 1].map((weekIndex) => {
    const startDate = visibleCycleStart.value.add(weekIndex * 7, 'day')

    const dates = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = startDate.add(dayIndex, 'day')
      const value = date.format('YYYY-MM-DD')

      return {
        value,
        label: date.format('M월 D일'),
        day: date.date(),
        isUnavailable: !isDeliveryDateAvailable(date, today),
        unavailableReason:
          date.day() === 0 ? '일요일은 배송 불가' : '다음 주 월요일 전 날짜는 선택 불가',
      }
    })

    return {
      id: `week-${startDate.format('YYYY-MM-DD')}`,
      title: `${weekIndex + 1}주차`,
      period: `${startDate.format('M월 D일')} ~ ${startDate.add(6, 'day').format('M월 D일')}`,
      dates,
      selectedCount: dates.filter(
        (date) => !date.isUnavailable && props.modelValue.includes(date.value),
      ).length,
    }
  }),
)

function moveCycle(amount) {
  const nextCycleStart = visibleCycleStart.value.add(amount * 2, 'week')

  if (nextCycleStart.isBefore(firstAvailableDate, 'day')) {
    return
  }

  visibleCycleStart.value = nextCycleStart
}

function toggleDate(date) {
  if (date.isUnavailable) {
    return
  }

  if (props.modelValue.includes(date.value)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((value) => value !== date.value),
    )
    return
  }

  emit('update:modelValue', [...props.modelValue, date.value].sort())
}
</script>

<template>
  <section class="delivery-date-calendar" aria-label="배송 희망일 선택">
    <header>
      <button
        type="button"
        :disabled="!canMovePreviousCycle"
        aria-label="이전 2주 보기"
        @click="moveCycle(-1)"
      >
        <ChevronLeft :size="18" aria-hidden="true" />
      </button>
      <strong>{{ cycleLabel }}</strong>
      <button type="button" aria-label="다음 2주 보기" @click="moveCycle(1)">
        <ChevronRight :size="18" aria-hidden="true" />
      </button>
    </header>

    <div class="delivery-date-calendar__legend" aria-label="날짜 선택 상태 안내">
      <span><i class="is-available" aria-hidden="true"></i>선택 가능</span>
      <span
        ><i class="is-unavailable" aria-hidden="true"></i>일요일·다음 주 월요일 전 날짜는 선택
        불가</span
      >
    </div>
    <div class="delivery-date-calendar__weeks">
      <section v-for="week in calendarWeeks" :key="week.id" class="delivery-date-calendar__week">
        <header>
          <strong
            >{{ week.title }} · {{ week.selectedCount }} /
            {{ MINIMUM_DELIVERY_DATE_COUNT }}개</strong
          >
          <span>{{ week.period }}</span>
        </header>
        <div class="delivery-date-calendar__weekdays" aria-hidden="true">
          <span v-for="weekDay in weekDays" :key="weekDay">{{ weekDay }}</span>
        </div>
        <div class="delivery-date-calendar__days">
          <button
            v-for="date in week.dates"
            :key="date.value"
            type="button"
            :disabled="date.isUnavailable"
            :class="{ 'is-selected': modelValue.includes(date.value) }"
            :aria-pressed="modelValue.includes(date.value)"
            :aria-label="`${date.label} ${date.isUnavailable ? date.unavailableReason : modelValue.includes(date.value) ? '선택 해제' : '선택'}`"
            @click="toggleDate(date)"
          >
            {{ date.day }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.delivery-date-calendar {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.delivery-date-calendar header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.delivery-date-calendar header button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
}

.delivery-date-calendar__legend {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.delivery-date-calendar__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.delivery-date-calendar__legend i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.delivery-date-calendar__legend .is-available {
  border: 1px solid var(--color-primary);
  background: var(--color-primary-soft);
}

.delivery-date-calendar__legend .is-unavailable {
  background: var(--color-disabled);
}

.delivery-date-calendar__weeks {
  display: grid;
  gap: 14px;
}

.delivery-date-calendar__week {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 12px;
  background: var(--color-surface-subtle);
}

.delivery-date-calendar__week header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.delivery-date-calendar__week header strong {
  color: var(--color-primary-pressed);
  font-size: var(--font-body);
}

.delivery-date-calendar__week header span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.delivery-date-calendar__weekdays,
.delivery-date-calendar__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.delivery-date-calendar__weekdays span {
  padding-bottom: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}

.delivery-date-calendar__days button {
  min-height: 42px;
  border: 1px solid var(--color-primary-soft);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
}

.delivery-date-calendar__days button:hover:not(:disabled),
.delivery-date-calendar__days button:focus-visible {
  border-color: var(--color-primary);
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 2px;
}

.delivery-date-calendar__days button:disabled {
  border-color: var(--color-disabled);
  background: var(--color-disabled);
  color: var(--color-text-muted);
  text-decoration: line-through;
}
</style>

<style scoped>
.delivery-date-calendar__days button.is-selected {
  background: var(--color-primary);
  color: #ffffff;
}
</style>
