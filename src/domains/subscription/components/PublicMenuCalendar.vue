<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { isSelectableDate, monthDates, shiftMonth } from '../publicMenuDate.js'

const props = defineProps({
  month: { type: String, required: true },
  selectedDate: { type: String, default: '' },
  calendar: { type: Object, default: null },
})
const emit = defineEmits(['select', 'month-change'])
const dates = computed(() => monthDates(props.month))
const names = computed(() =>
  Object.fromEntries(
    (props.calendar?.holidays || []).map((row) => [row.holidayDate, row.holidayName]),
  ),
)
const label = computed(
  () => `${Number(props.month.slice(0, 4))}년 ${Number(props.month.slice(5))}월`,
)
function canMove(delta) {
  if (!props.calendar) return false
  const month = shiftMonth(props.month, delta)
  return delta < 0
    ? month >= props.calendar.supportedStartDate.slice(0, 7)
    : month <= props.calendar.supportedEndDate.slice(0, 7)
}
</script>

<template>
  <section class="public-calendar ui-surface" aria-label="공개 메뉴 날짜 선택">
    <header>
      <button
        type="button"
        class="button button-secondary"
        aria-label="이전 달"
        :disabled="!canMove(-1)"
        @click="emit('month-change', shiftMonth(month, -1))"
      >
        <ChevronLeft :size="18" />
      </button>
      <h2>{{ label }}</h2>
      <button
        type="button"
        class="button button-secondary"
        aria-label="다음 달"
        :disabled="!canMove(1)"
        @click="emit('month-change', shiftMonth(month, 1))"
      >
        <ChevronRight :size="18" />
      </button>
    </header>
    <p class="ui-muted">일요일·공휴일·공휴일 정보 제공 범위 밖 날짜는 선택할 수 없습니다.</p>
    <div class="calendar-grid">
      <span
        v-for="(weekday, index) in ['일', '월', '화', '수', '목', '금', '토']"
        :key="weekday"
        class="weekday"
        :class="{ sunday: index === 0 }"
        >{{ weekday }}</span
      >
      <template v-for="(date, index) in dates" :key="date || `blank-${index}`">
        <span v-if="!date" aria-hidden="true"></span>
        <button
          v-else
          type="button"
          class="calendar-day"
          :class="{
            selected: selectedDate === date,
            holiday: names[date],
            sunday: index % 7 === 0,
          }"
          :disabled="!isSelectableDate(date, calendar)"
          :aria-pressed="selectedDate === date"
          :aria-label="`${date}${names[date] ? ' ' + names[date] : ''}${index % 7 === 0 ? ' 일요일' : ''}${!isSelectableDate(date, calendar) ? ' 선택 불가' : ''}`"
          @click="emit('select', date)"
        >
          <strong>{{ Number(date.slice(-2)) }}</strong
          ><span v-if="names[date]">{{ names[date] }}</span>
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.public-calendar {
  padding: 24px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  margin: 0;
  font-size: var(--font-item-title);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-top: 20px;
}
.weekday {
  padding: 8px 0;
  text-align: center;
  font-weight: 700;
}
.calendar-day {
  min-width: 0;
  min-height: 76px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.calendar-day span {
  font-size: var(--font-caption);
  overflow-wrap: anywhere;
}
.calendar-day:disabled {
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.sunday,
.calendar-day.sunday,
.calendar-day.holiday {
  color: #b42318;
}
.calendar-day.selected {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-soft);
}
.calendar-day:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .public-calendar {
    padding: 12px;
  }
  .calendar-grid {
    gap: 3px;
  }
  .calendar-day {
    min-height: 70px;
  }
}
</style>
