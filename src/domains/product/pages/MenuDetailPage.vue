<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHolidayStore } from '../../subscription/stores/useHolidayStore.js'
import { usePlanStore } from '../../subscription/stores/usePlanStore.js'
import { isSelectableDate, publicDateLabel } from '../../subscription/publicMenuDate.js'
import { selectHomeMenu } from '../../subscription/homeMenu.js'

const route = useRoute()
const holidays = useHolidayStore()
const plans = usePlanStore()
const broken = ref(false)
const date = computed(() =>
  isSelectableDate(route.query.date, holidays.calendar) ? route.query.date : '',
)
const planId = computed(() =>
  typeof route.query.planId === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(route.query.planId)
    ? route.query.planId
    : '',
)
const plan = computed(() => plans.details[planId.value])
const status = computed(() => plans.detailStatuses[planId.value] || 'idle')
const menu = computed(() => selectHomeMenu(plan.value, Number(date.value.slice(-2))))
const backTo = computed(() => ({ name: 'menu', query: date.value ? { date: date.value } : {} }))
async function retry() {
  broken.value = false
  await plans.fetchPlan(planId.value, true)
}
watch(
  [date, planId],
  ([value, id]) => {
    broken.value = false
    if (value && id) plans.fetchPlan(id)
  },
  { immediate: true },
)
onMounted(() => holidays.fetchHolidays())
</script>

<template>
  <div class="page workspace-ui design-review-page">
    <header class="ui-heading">
      <div>
        <h1>메뉴 상세</h1>
        <p v-if="date">{{ publicDateLabel(date) }} 메뉴 안내</p>
      </div>
      <RouterLink class="button button-secondary" :to="backTo">날짜별 메뉴로 돌아가기</RouterLink>
    </header>
    <p v-if="['idle', 'loading'].includes(holidays.status)" role="status">
      공휴일 정보를 불러오는 중입니다.
    </p>
    <div v-else-if="holidays.status === 'error'" class="ui-note" role="alert">
      <p>공휴일 정보를 불러오지 못해 메뉴 날짜를 확인할 수 없습니다.</p>
      <button type="button" class="button button-secondary" @click="holidays.fetchHolidays(true)">
        공휴일 다시 시도
      </button>
    </div>
    <p v-else-if="!date || !planId" class="ui-note" role="alert">
      올바른 날짜와 플랜을 확인할 수 없습니다. 날짜별 메뉴 화면에서 다시 선택해 주세요.
    </p>
    <p v-else-if="['idle', 'loading'].includes(status)" role="status">메뉴를 불러오는 중입니다.</p>
    <div v-else-if="status === 'error' || !menu" class="ui-note" role="alert">
      <p>
        {{
          plans.detailErrors[planId]?.code === 'SUBSCRIPTION_001'
            ? '해당 플랜을 찾을 수 없습니다.'
            : '메뉴 정보를 확인할 수 없습니다.'
        }}
      </p>
      <button type="button" class="button button-secondary" @click="retry">메뉴 다시 시도</button>
    </div>
    <article v-else class="ui-surface menu-detail">
      <img
        v-if="menu.imageUrl && !broken"
        :src="menu.imageUrl"
        :alt="menu.name"
        @error="broken = true"
      />
      <div v-else class="image-placeholder">메뉴 이미지 준비 중</div>
      <div class="ui-stack">
        <p class="ui-muted">{{ plan.name }} 플랜</p>
        <h2>{{ menu.name }}</h2>
        <p>{{ menu.description }}</p>
        <dl>
          <dt>알레르기</dt>
          <dd>{{ menu.allergenInfo || '정보 미제공' }}</dd>
          <dt>영양 정보</dt>
          <dd>{{ menu.nutritionInfo || '정보 미제공' }}</dd>
          <dt>원재료</dt>
          <dd>{{ menu.ingredientInfo || '정보 미제공' }}</dd>
        </dl>
        <p class="ui-muted">공개 메뉴 안내이며, 실제 배송 일정은 구독 조건에 따라 달라집니다.</p>
      </div>
    </article>
  </div>
</template>

<style scoped>
.menu-detail {
  padding: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.menu-detail img,
.image-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}
.image-placeholder {
  display: grid;
  place-items: center;
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
}
.ui-stack {
  padding: 24px;
  overflow-wrap: anywhere;
}
dt {
  font-weight: 700;
}
dd {
  margin: 6px 0 20px;
  white-space: pre-line;
}
@media (max-width: 760px) {
  .menu-detail {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
