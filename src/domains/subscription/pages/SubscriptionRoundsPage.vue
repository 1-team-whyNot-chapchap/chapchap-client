<script setup>
import { computed, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import dayjs from 'dayjs'
import { CalendarDays } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { datePickerPt, selectButtonPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const mode = ref('달력')
const date = ref(dayjs(store.subscriptionRounds[0]?.deliveryDate).toDate())
const selected = computed(() =>
  store.subscriptionRounds.filter((r) => dayjs(r.deliveryDate).isSame(date.value, 'day')),
)
const shown = computed(() => (mode.value === '목록' ? store.subscriptionRounds : selected.value))
function hasOrder(day) {
  return store.subscriptionRounds.some(
    (r) => r.deliveryDate === dayjs(new Date(day.year, day.month, day.day)).format('YYYY-MM-DD'),
  )
}
function open(id) {
  store.selectRound(id)
  emit('navigate', 'wf-023')
}
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton label="내 구독으로" @back="emit('navigate', 'subscription')" />
    <header class="ui-heading">
      <div>
        <h1>주문 일정</h1>
        <p>주문이 있는 날을 선택해 식사 구성을 확인하세요.</p>
      </div>
      <SelectButton
        v-model="mode"
        :options="['달력', '목록']"
        :allow-empty="false"
        :pt="selectButtonPt"
        aria-label="주문 보기 방식"
      />
    </header>
    <DesignPreview title="주문 일정" empty="생성된 주문이 없어요.">
      <div :class="mode === '달력' ? 'ui-grid' : 'ui-stack'">
        <section v-if="mode === '달력'" class="ui-stack">
          <DatePicker v-model="date" inline :pt="datePickerPt" aria-label="주문 날짜">
            <template #date="slotProps"
              ><span class="order-day"
                >{{ slotProps.date.day
                }}<i v-if="hasOrder(slotProps.date)" aria-label="주문 있음" /></span
            ></template>
          </DatePicker>
          <p class="ui-muted">● 주문이 있는 날 · 날짜 선택 후 상세를 확인하세요.</p>
        </section>
        <section class="ui-surface">
          <h2 :class="{ 'order-list-heading': mode === '목록' }">
            {{ mode === '달력' ? dayjs(date).format('M월 D일') : '전체 주문' }}
          </h2>
          <article v-for="round in shown" :key="round.id" class="ui-list-item">
            <div>
              <h3>{{ round.deliveryDate }}</h3>
              <p>{{ round.menuItems.map((m) => m.name).join(' · ') }}</p>
              <StatusBadge :status="round.status" />
            </div>
            <button
              class="button button-secondary"
              :aria-label="`${round.deliveryDate} 주문 상세`"
              @click="open(round.id)"
            >
              상세 보기
            </button>
          </article>
          <div v-if="!shown.length" class="ui-empty">
            <CalendarDays :size="32" aria-hidden="true" />
            <h3>이 날짜에는 주문이 없어요.</h3>
            <button class="button button-secondary" @click="mode = '목록'">전체 주문 보기</button>
          </div>
        </section>
      </div>
    </DesignPreview>
  </div>
</template>
<style scoped>
.order-list-heading {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.order-day {
  display: grid;
  justify-items: center;
  gap: 3px;
  padding-block: 3px;
}
.order-day i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
</style>
