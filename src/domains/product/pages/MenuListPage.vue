<script setup>
import { computed, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import { ChevronRight, SlidersHorizontal } from 'lucide-vue-next'
import { datePickerPt } from '../../../common/constants/primeUiPt'
import {
  menuCalendarPreview,
  previewMenuDate,
  selectedPreviewMenuId,
} from '../data/menuCalendarPreview'

const emit = defineEmits(['navigate'])
const showFilters = ref(false)
const excludedAllergens = ref([])
const allergens = [
  ...new Set(menuCalendarPreview.flatMap(({ menu }) => menu.allergens.split(', '))),
]
const calendarPt = {
  ...datePickerPt,
  panel: 'ui-calendar menu-calendar-panel',
  day: 'ui-calendar-day menu-calendar-day',
  selectYear: 'ui-calendar-nav menu-calendar-year',
}
const selectedDateLabel = computed(() => dayjs(previewMenuDate.value).format('YYYY년 M월 D일'))
const cards = computed(() =>
  menuCalendarPreview.map((entry) => ({
    ...entry,
    matches: !excludedAllergens.value.some((allergen) =>
      entry.menu.allergens.split(', ').includes(allergen),
    ),
  })),
)
function openMenu(menu) {
  selectedPreviewMenuId.value = menu.id
  emit('navigate', 'wf-009')
}
</script>

<template>
  <div class="page menu-calendar-page workspace-ui design-review-page">
    <header class="ui-heading">
      <div>
        <h1>날짜별 메뉴</h1>
        <p>날짜를 선택하고 건강식·영양식·든든식 메뉴를 확인하세요.</p>
      </div>
    </header>

    <section class="menu-calendar" aria-label="메뉴 날짜 선택">
      <DatePicker
        v-model="previewMenuDate"
        inline
        :pt="calendarPt"
        :show-other-months="true"
        aria-label="메뉴 날짜"
      />
    </section>

    <section class="menu-results" :aria-label="`${selectedDateLabel} 메뉴`">
      <div class="plan-menu-grid">
        <article v-for="card in cards" :key="card.planId" class="plan-menu-card">
          <div class="menu-photo">[사진이 필요한 곳입니다.]</div>
          <div class="plan-menu-card__body">
            <span class="plan-label">{{ card.planLabel }} 플랜</span>
            <template v-if="card.matches">
              <h3>{{ card.menu.name }}</h3>
              <p>{{ card.menu.description }}</p>
              <strong class="menu-nutrition">{{ card.menu.nutrition }}</strong>
              <button class="button button-outline" type="button" @click="openMenu(card.menu)">
                <span>{{ card.planLabel }} 메뉴 상세</span>
                <ChevronRight :size="18" aria-hidden="true" />
              </button>
            </template>
            <p v-else class="menu-empty" role="status">필터 조건에 맞는 메뉴가 없어요.</p>
          </div>
        </article>
      </div>

      <div class="menu-results__heading">
        <button
          class="button button-outline"
          type="button"
          :aria-expanded="showFilters"
          aria-controls="menu-allergen-filters"
          @click="showFilters = !showFilters"
        >
          <SlidersHorizontal :size="18" aria-hidden="true" />
          알레르기 필터
        </button>
      </div>

      <div v-if="showFilters" id="menu-allergen-filters" class="allergen-filters">
        <fieldset>
          <legend>제외할 알레르기 성분</legend>
          <label v-for="allergen in allergens" :key="allergen">
            <input v-model="excludedAllergens" type="checkbox" :value="allergen" />
            {{ allergen }}
          </label>
        </fieldset>
        <p>예시 표기 기준 필터입니다. 실제 원재료와 교차오염 정보는 상품 라벨을 확인해주세요.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
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
.menu-results__heading {
  margin-top: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
}
.allergen-filters p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.allergen-filters {
  margin-top: var(--space-4);
}
.allergen-filters fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.allergen-filters label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
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
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
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
  font-size: var(--font-item-title);
}
.plan-menu-card p {
  color: var(--color-text-muted);
}
.menu-nutrition {
  margin-top: auto;
  font-size: var(--font-caption);
}
.plan-menu-card .button {
  width: 100%;
  min-width: 0;
  white-space: normal;
}
@media (max-width: 760px) {
  .menu-calendar :deep(.menu-calendar-panel) {
    padding: var(--space-2);
  }
  .menu-calendar :deep(.menu-calendar-day) {
    min-height: 44px;
  }
  .menu-results__heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .plan-menu-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
}
</style>
