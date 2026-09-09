<script setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { Check, X } from 'lucide-vue-next'
import { subscriptionMenuOptions } from '../../product/data/subscriptionMenuOptions'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  deliveryDays: { type: Array, default: () => [] },
  deliveryTime: { type: String, default: '' },
  weeklyMenuQuantities: { type: Object, required: true },
})

const emit = defineEmits(['close'])
const selectedDate = ref('')
const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일']
const sortedDeliveryDays = computed(() => [...props.deliveryDays].sort())

// computed는 연결된 값이 바뀌면 결과를 자동으로 다시 계산하는 Vue 문법입니다.
// 이 화면에서는 배송일과 선택 수량을 바탕으로 날짜별 메뉴 목록을 만듭니다.
const scheduledDays = computed(() => {
  if (!sortedDeliveryDays.value.length) return []

  const firstDeliveryDate = dayjs(sortedDeliveryDays.value[0])

  return sortedDeliveryDays.value.map((date) => {
    const weekId = dayjs(date).diff(firstDeliveryDate, 'day') < 7 ? 'week1' : 'week2'
    const menus = subscriptionMenuOptions
      .map((menu) => ({
        ...menu,
        quantity: props.weeklyMenuQuantities[weekId]?.[menu.id] || 0,
      }))
      .filter((menu) => menu.quantity > 0)

    return { date, weekId, menus }
  })
})

const selectedSchedule = computed(
  () => scheduledDays.value.find((schedule) => schedule.date === selectedDate.value) || null,
)

const calendarDays = computed(() => {
  if (!sortedDeliveryDays.value.length) return []

  const firstDeliveryDate = dayjs(sortedDeliveryDays.value[0]).startOf('day')
  const calendarStart = firstDeliveryDate.subtract((firstDeliveryDate.day() + 6) % 7, 'day')
  const lastDeliveryDate = sortedDeliveryDays.value[sortedDeliveryDays.value.length - 1]
  const lastDeliveryWeekStart = dayjs(lastDeliveryDate)
    .startOf('day')
    .subtract((dayjs(lastDeliveryDate).day() + 6) % 7, 'day')
  const calendarEnd = lastDeliveryWeekStart.add(6, 'day')
  const days = []
  let currentDay = calendarStart

  while (currentDay.isBefore(calendarEnd) || currentDay.isSame(calendarEnd, 'day')) {
    const date = currentDay.format('YYYY-MM-DD')
    days.push({
      date,
      dayNumber: currentDay.date(),
      isDeliveryDay: sortedDeliveryDays.value.includes(date),
    })
    currentDay = currentDay.add(1, 'day')
  }

  return days
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) selectedDate.value = sortedDeliveryDays.value[0] || ''
  },
)

function closeModal() {
  emit('close')
}

function selectDeliveryDate(date) {
  selectedDate.value = date
}

function formatDate(date) {
  return dayjs(date).locale('ko').format('M월 D일 (ddd)')
}
</script>

<template>
  <!-- Teleport는 모달을 body 바로 아래에 렌더링해 부모 영역의 잘림 영향을 피하는 Vue 기능입니다. -->
  <Teleport to="body">
    <!-- Transition은 모달이 열리고 닫힐 때 CSS 전환 클래스를 연결하는 Vue 기능입니다. -->
    <Transition name="delivery-schedule">
      <div v-if="isOpen" class="delivery-schedule-layer" @click.self="closeModal">
        <section
          class="delivery-schedule-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-schedule-title"
        >
          <header class="delivery-schedule-modal__header">
            <div>
              <h2 id="delivery-schedule-title">배송 일정 상세</h2>
              <p>선택하신 요일에 아래 일정으로 배송됩니다.</p>
            </div>
            <button
              class="delivery-schedule-modal__close"
              type="button"
              aria-label="배송 일정 상세 닫기"
              @click="closeModal"
            >
              <X :size="20" aria-hidden="true" />
            </button>
          </header>

          <div v-if="calendarDays.length" class="delivery-schedule-modal__content">
            <div class="delivery-calendar" aria-label="선택한 배송일 달력">
              <div
                v-for="weekday in weekdayLabels"
                :key="weekday"
                class="delivery-calendar__weekday"
              >
                {{ weekday }}
              </div>
              <button
                v-for="day in calendarDays"
                :key="day.date"
                class="delivery-calendar__day"
                :class="{
                  'is-delivery': day.isDeliveryDay,
                  'is-selected': selectedDate === day.date,
                }"
                :disabled="!day.isDeliveryDay"
                type="button"
                @click="selectDeliveryDate(day.date)"
              >
                <span>{{ day.dayNumber }}</span>
                <small v-if="day.isDeliveryDay">배송</small>
              </button>
            </div>

            <section v-if="selectedSchedule" class="delivery-menu-detail" aria-live="polite">
              <div class="delivery-menu-detail__heading">
                <div>
                  <p class="section-kicker">
                    {{ selectedSchedule.weekId === 'week1' ? '1주차' : '2주차' }}
                  </p>
                  <h3>{{ formatDate(selectedSchedule.date) }} 배송 메뉴</h3>
                  <p v-if="deliveryTime" class="delivery-menu-detail__time">
                    배송 시간 · {{ deliveryTime }}
                  </p>
                </div>
                <Check :size="19" aria-hidden="true" />
              </div>
              <ul v-if="selectedSchedule.menus.length" class="delivery-menu-detail__list">
                <li v-for="menu in selectedSchedule.menus" :key="menu.id">
                  <span>{{ menu.name }}</span>
                  <strong>{{ menu.quantity }}개</strong>
                </li>
              </ul>
              <p v-else class="delivery-menu-detail__empty">
                해당 주차에 선택한 메뉴가 아직 없습니다.
              </p>
            </section>
          </div>

          <p v-else class="delivery-schedule-modal__empty" role="status">
            선택한 배송일이 없습니다. 배송 희망일을 먼저 선택해 주세요.
          </p>

          <footer class="delivery-schedule-modal__footer">
            <p>메뉴·배송지 변경은 배송 3일 전 18:00까지 가능해요.</p>
            <button class="button button-primary" type="button" @click="closeModal">확인</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.delivery-schedule-layer {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(28, 34, 23, 0.46);
  backdrop-filter: blur(4px);
}
.delivery-schedule-modal {
  width: min(100%, 560px);
  max-height: min(760px, calc(100dvh - 48px));
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 24px 64px rgba(28, 34, 23, 0.24);
}
.delivery-schedule-modal__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 24px 24px 18px;
  border-bottom: 1px solid var(--color-border);
}
.delivery-menu-detail__heading > svg {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-primary-pressed);
  background: var(--color-primary-soft);
}
.delivery-schedule-modal h2,
.delivery-schedule-modal h3,
.delivery-schedule-modal p {
  margin: 0;
}
.delivery-schedule-modal h2 {
  font-size: var(--font-section-title);
}
.delivery-schedule-modal__header p:not(.section-kicker) {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.delivery-schedule-modal__close {
  width: 40px;
  min-height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-muted);
  background: var(--color-surface);
}
.delivery-schedule-modal__content {
  display: grid;
  gap: 18px;
  overflow-y: auto;
  padding: 20px 24px;
}
.delivery-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}
.delivery-calendar__weekday {
  padding-bottom: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
  text-align: center;
}
.delivery-calendar__day {
  min-height: 60px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--color-text-muted);
  background: transparent;
  font-size: var(--font-body);
}
.delivery-calendar__day small {
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.delivery-calendar__day.is-delivery {
  border-color: var(--color-primary-soft);
  color: var(--color-text);
  background: var(--color-primary-soft);
}
.delivery-calendar__day.is-selected {
  border-color: var(--color-primary);
  color: var(--color-surface);
  background: var(--color-primary);
  box-shadow: 0 8px 16px rgba(146, 166, 88, 0.22);
}
.delivery-calendar__day.is-selected small {
  color: inherit;
}
.delivery-menu-detail {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-background-alt);
}
.delivery-menu-detail__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.delivery-menu-detail__heading h3 {
  margin-top: 4px;
  font-size: var(--font-item-title);
}
.delivery-menu-detail__time {
  margin-top: 7px !important;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.delivery-menu-detail__heading > svg {
  width: 36px;
  height: 36px;
  padding: 8px;
  border-radius: 50%;
}
.delivery-menu-detail__list {
  display: grid;
  gap: 10px;
  padding: 14px 0 0;
  margin: 14px 0 0;
  border-top: 1px solid var(--color-border);
  list-style: none;
}
.delivery-menu-detail__list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}
.delivery-menu-detail__list strong {
  flex: 0 0 auto;
  color: var(--color-text);
}
.delivery-menu-detail__empty,
.delivery-schedule-modal__empty {
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.delivery-schedule-modal__empty {
  padding: 32px 24px;
}
.delivery-schedule-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 24px;
  border-top: 1px solid var(--color-border);
}
.delivery-schedule-modal__footer p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.delivery-schedule-modal__footer .button {
  flex: 0 0 auto;
}
.delivery-schedule-enter-active,
.delivery-schedule-leave-active {
  transition: opacity 180ms ease;
}
.delivery-schedule-enter-active .delivery-schedule-modal,
.delivery-schedule-leave-active .delivery-schedule-modal {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.delivery-schedule-enter-from,
.delivery-schedule-leave-to {
  opacity: 0;
}
.delivery-schedule-enter-from .delivery-schedule-modal,
.delivery-schedule-leave-to .delivery-schedule-modal {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}
@media (max-width: 640px) {
  .delivery-schedule-layer {
    align-items: end;
    padding: 0;
  }
  .delivery-schedule-modal {
    width: 100%;
    max-height: min(82dvh, 760px);
    border-radius: 24px 24px 0 0;
  }
  .delivery-schedule-modal__header,
  .delivery-schedule-modal__content,
  .delivery-schedule-modal__footer {
    padding-right: 20px;
    padding-left: 20px;
  }
  .delivery-schedule-modal__footer {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }
  .delivery-schedule-modal__footer .button {
    width: 100%;
  }
}
</style>
