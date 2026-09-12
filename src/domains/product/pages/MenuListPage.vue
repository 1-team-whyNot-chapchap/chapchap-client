<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PublicMenuCalendar from '../../subscription/components/PublicMenuCalendar.vue'
import { useHolidayStore } from '../../subscription/stores/useHolidayStore.js'
import { usePlanStore } from '../../subscription/stores/usePlanStore.js'
import { getKstDate, isSelectableDate, publicDateLabel } from '../../subscription/publicMenuDate.js'
import { selectHomeMenu } from '../../subscription/homeMenu.js'

const route = useRoute()
const router = useRouter()
const holidays = useHolidayStore()
const plans = usePlanStore()
const month = ref(getKstDate().slice(0, 7))
const loading = ref(false)
const broken = ref({})
let version = 0
const selectedDate = computed(() =>
  isSelectableDate(route.query.date, holidays.calendar) ? route.query.date : '',
)
const invalidDate = computed(
  () => holidays.status === 'success' && route.query.date !== undefined && !selectedDate.value,
)
const cards = computed(() =>
  plans.plans.map((plan) => ({
    planId: plan.planId,
    planName: plan.name,
    status: plans.detailStatuses[plan.planId] || 'idle',
    menu: selectHomeMenu(plans.details[plan.planId], Number(selectedDate.value.slice(-2))),
  })),
)

async function loadPlans(force = false) {
  const current = ++version
  loading.value = true
  try {
    const list = await plans.fetchPlans(force)
    if (current !== version) return
    const requests = list.map((plan) => plans.fetchPlan(plan.planId, force))
    loading.value = false
    await Promise.all(requests)
  } finally {
    if (current === version) loading.value = false
  }
}
function selectDate(date) {
  if (isSelectableDate(date, holidays.calendar))
    router.replace({ path: route.path, query: { date } })
}
function changeMonth(value) {
  month.value = value
  router.replace({ path: route.path, query: {} })
}
async function retryPlan(planId) {
  delete broken.value[planId]
  await plans.fetchPlan(planId, true)
}
watch(
  selectedDate,
  (date) => {
    broken.value = {}
    if (date) {
      month.value = date.slice(0, 7)
      loadPlans()
    }
  },
  { immediate: true },
)
onMounted(() => holidays.fetchHolidays())
onUnmounted(() => {
  version++
})
</script>

<template>
  <div class="page workspace-ui design-review-page">
    <header class="ui-heading">
      <div>
        <h1>날짜별 메뉴</h1>
        <p>날짜를 선택해 플랜별 메뉴를 확인하세요. 실제 배송 일정은 구독 조건에 따라 달라집니다.</p>
      </div>
    </header>
    <p v-if="['idle', 'loading'].includes(holidays.status)" role="status">
      공휴일 정보를 불러오는 중입니다.
    </p>
    <div v-else-if="holidays.status === 'error'" class="ui-note" role="alert">
      <p>공휴일 정보를 불러오지 못했습니다. 날짜 선택을 위해 다시 시도해 주세요.</p>
      <button type="button" class="button button-secondary" @click="holidays.fetchHolidays(true)">
        공휴일 다시 시도
      </button>
    </div>
    <p v-if="holidays.calendar" class="ui-muted">
      공휴일 정보 제공 범위: {{ holidays.calendar.supportedStartDate }} ~
      {{ holidays.calendar.supportedEndDate }}
    </p>
    <PublicMenuCalendar
      :month="month"
      :selected-date="selectedDate"
      :calendar="holidays.calendar"
      @select="selectDate"
      @month-change="changeMonth"
    />
    <p v-if="invalidDate" class="ui-note" role="alert">
      선택할 수 없는 날짜입니다. 달력에서 다른 날짜를 선택해 주세요.
    </p>
    <p v-if="!selectedDate" class="ui-empty">
      날짜를 선택하면 해당 날짜의 플랜별 메뉴를 보여 드립니다.
    </p>
    <section v-else aria-labelledby="selected-menu-date">
      <h2 id="selected-menu-date">{{ publicDateLabel(selectedDate) }} 메뉴</h2>
      <p v-if="loading" role="status">메뉴를 불러오는 중입니다.</p>
      <div v-else-if="plans.listStatus === 'error'" class="ui-note" role="alert">
        <p>플랜 목록을 불러오지 못했습니다.</p>
        <button type="button" class="button button-secondary" @click="loadPlans(true)">
          플랜 다시 시도
        </button>
      </div>
      <p v-else-if="!cards.length" class="ui-empty">등록된 플랜이 없습니다.</p>
      <div v-else class="menu-cards">
        <article
          v-for="card in cards"
          :key="card.planId"
          class="ui-surface menu-card"
          :aria-busy="['idle', 'loading'].includes(card.status)"
        >
          <img
            v-if="card.status === 'success' && card.menu?.imageUrl && !broken[card.planId]"
            :src="card.menu.imageUrl"
            :alt="card.menu.name"
            loading="lazy"
            @error="broken[card.planId] = true"
          />
          <div v-else class="image-placeholder">메뉴 이미지 준비 중</div>
          <div class="ui-stack">
            <p class="ui-muted">{{ card.planName }} 플랜</p>
            <p v-if="['idle', 'loading'].includes(card.status)" role="status">
              메뉴 정보를 확인하고 있습니다.
            </p>
            <template v-else-if="card.status === 'error' || !card.menu"
              ><p role="alert">
                {{
                  card.status === 'error'
                    ? '이 플랜의 메뉴를 불러오지 못했습니다.'
                    : '선택한 날짜의 메뉴 정보를 확인할 수 없습니다.'
                }}
              </p>
              <button type="button" class="button button-secondary" @click="retryPlan(card.planId)">
                메뉴 다시 시도
              </button></template
            >
            <template v-else
              ><h3>{{ card.menu.name }}</h3>
              <p>{{ card.menu.description }}</p>
              <p>알레르기: {{ card.menu.allergenInfo || '정보 미제공' }}</p>
              <p>영양 정보: {{ card.menu.nutritionInfo || '정보 미제공' }}</p>
              <RouterLink
                class="button button-secondary"
                :to="{ name: 'wf-009', query: { date: selectedDate, planId: card.planId } }"
                >메뉴 상세 보기</RouterLink
              ></template
            >
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.menu-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.menu-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.menu-card > .ui-stack {
  padding: 24px;
  flex: 1;
}
.menu-card img,
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
.menu-card .button {
  margin-top: auto;
  align-self: flex-end;
}
.menu-card p,
.menu-card h3 {
  overflow-wrap: anywhere;
}
section > h2 {
  margin-top: 24px;
}
@media (max-width: 900px) {
  .menu-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .menu-cards {
    grid-template-columns: 1fr;
  }
}
</style>
