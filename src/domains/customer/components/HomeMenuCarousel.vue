<script setup>
import { ArrowRight, ChevronRight } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlanStore } from '../../subscription/stores/usePlanStore.js'
import { resolveHomeMenuDate, selectHomeMenu } from '../../subscription/homeMenu.js'
import { holidayApi } from '../../subscription/api/holidayApi.js'

const emit = defineEmits(['navigate'])

const planStore = usePlanStore()
const menuDate = ref(null)
const calendar = ref(null)
const dateStatus = ref('loading')
let loadVersion = 0
const listLoading = ref(true)
const failedImages = ref({})
const unexpectedPlanCount = computed(
  () => planStore.plans.length > 0 && planStore.plans.length !== 3,
)
const cards = computed(() =>
  planStore.plans.map((plan) => ({
    planId: plan.planId,
    planLabel: plan.name,
    status: planStore.detailStatuses[plan.planId] || 'idle',
    menu: selectHomeMenu(planStore.details[plan.planId], menuDate.value?.day),
  })),
)

async function loadMenus(force = false) {
  const version = ++loadVersion
  listLoading.value = true
  dateStatus.value = 'loading'
  menuDate.value = null
  calendar.value = null
  failedImages.value = {}
  try {
    let holidays
    try {
      holidays = await holidayApi.getHolidays()
    } catch {
      if (version === loadVersion) dateStatus.value = 'error'
      return
    }
    if (version !== loadVersion) return
    calendar.value = holidays
    menuDate.value = resolveHomeMenuDate(holidays)
    if (!menuDate.value) {
      dateStatus.value = 'unavailable'
      return
    }
    dateStatus.value = 'success'
    const plans = await planStore.fetchPlans(force)
    if (version !== loadVersion) return
    if (plans.length === 3) {
      // 상세 조회 상태를 카드별로 표시해 성공한 카드는 계속 보여 준다.
      const requests = plans.map((plan) => planStore.fetchPlan(plan.planId, force))
      listLoading.value = false
      await Promise.all(requests)
    }
  } finally {
    if (version === loadVersion) listLoading.value = false
  }
}

async function retryPlan(planId) {
  delete failedImages.value[planId]
  await planStore.fetchPlan(planId, true)
}

onMounted(() => loadMenus())
onUnmounted(() => loadVersion++)
</script>

<template>
  <section class="home-menu" aria-labelledby="home-menu-title">
    <div class="home-menu__heading">
      <h2 id="home-menu-title">이번 주 챱챱 메뉴</h2>
      <p v-if="menuDate" class="home-menu__date">
        <time :datetime="menuDate.isoDate">{{ menuDate.label }}</time>
      </p>
      <p>플랜 메뉴 소개이며, 실제 배송 일정은 구독 조건에 따라 달라집니다.</p>
    </div>

    <div v-if="listLoading" class="home-menu__status" role="status">메뉴를 불러오는 중입니다.</div>
    <div v-else-if="dateStatus === 'error'" class="home-menu__status" role="alert">
      <p>공휴일 정보를 불러오지 못해 메뉴 날짜를 확인할 수 없습니다.</p>
      <button class="button button-secondary" type="button" @click="loadMenus(true)">
        다시 시도
      </button>
    </div>
    <div v-else-if="dateStatus === 'unavailable'" class="home-menu__status" role="status">
      <p>현재 조회 가능한 기간 안에 표시할 메뉴 날짜가 없습니다.</p>
      <p>조회 가능 범위: {{ calendar.supportedStartDate }} ~ {{ calendar.supportedEndDate }}</p>
      <button class="button button-secondary" type="button" @click="loadMenus(true)">
        다시 확인
      </button>
    </div>
    <div v-else-if="planStore.listStatus === 'error'" class="home-menu__status" role="alert">
      <p>플랜 목록을 불러오지 못했습니다.</p>
      <button class="button button-secondary" type="button" @click="loadMenus(true)">
        다시 시도
      </button>
    </div>
    <div v-else-if="unexpectedPlanCount" class="home-menu__status" role="alert">
      <p>플랜 구성을 확인할 수 없습니다. 플랜 전체 보기에서 확인해 주세요.</p>
      <button class="button button-secondary" type="button" @click="loadMenus(true)">
        다시 시도
      </button>
    </div>
    <div v-else-if="!cards.length" class="home-menu__status" role="status">
      새로운 메뉴를 준비하고 있어요.
    </div>
    <div v-else class="home-menu__showcase">
      <article
        v-for="card in cards"
        :key="card.planId"
        class="home-menu__card"
        :aria-busy="['idle', 'loading'].includes(card.status)"
      >
        <div class="home-menu__photo">
          <img
            v-if="card.status === 'success' && card.menu?.imageUrl && !failedImages[card.planId]"
            :src="card.menu.imageUrl"
            :alt="card.menu.name"
            loading="lazy"
            @error="failedImages[card.planId] = true"
          />
          <span v-else>{{
            ['idle', 'loading'].includes(card.status)
              ? '메뉴를 불러오는 중입니다.'
              : '메뉴 이미지 준비 중'
          }}</span>
        </div>
        <div class="home-menu__content">
          <span class="home-menu__plan">{{ card.planLabel }} 플랜</span>
          <p v-if="['idle', 'loading'].includes(card.status)" role="status">
            메뉴 정보를 확인하고 있습니다.
          </p>
          <template v-else-if="card.status === 'error'">
            <p role="alert">이 플랜의 메뉴를 불러오지 못했습니다.</p>
            <button
              class="button button-secondary"
              type="button"
              :aria-label="`${card.planLabel} 메뉴 다시 시도`"
              @click="retryPlan(card.planId)"
            >
              다시 시도
            </button>
          </template>
          <template v-else-if="!card.menu">
            <p role="status">기준 날짜에 해당하는 메뉴 정보를 확인할 수 없습니다.</p>
            <button
              class="button button-secondary"
              type="button"
              :aria-label="`${card.planLabel} 메뉴 다시 확인`"
              @click="retryPlan(card.planId)"
            >
              다시 확인
            </button>
          </template>
          <template v-else>
            <h3>{{ card.menu.name }}</h3>
            <RouterLink
              class="button button-outline menu-detail-button"
              :to="{
                name: 'wf-009',
                query: {
                  planId: card.planId,
                  menuSequence: card.menu.menuSequence,
                  from: 'home',
                },
              }"
              :aria-label="`${card.planLabel} ${card.menu.name} 메뉴 상세`"
            >
              <span>메뉴 상세</span>
              <ChevronRight :size="18" aria-hidden="true" />
            </RouterLink>
          </template>
        </div>
      </article>
    </div>

    <button
      class="button button-primary home-menu__more"
      type="button"
      @click="emit('navigate', 'menu')"
    >
      플랜별 메뉴 전체 보기
      <ArrowRight :size="18" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.home-menu {
  margin-top: 96px;
}

.home-menu__heading h2 {
  margin: 0;
  font-size: var(--font-page-title);
}

.home-menu__heading p {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}

.home-menu__heading .home-menu__date {
  font-size: var(--font-caption);
}

.home-menu__showcase {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.home-menu__card {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
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

.home-menu__photo {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  overflow: hidden;
}

.home-menu__photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.home-menu__status {
  margin-top: var(--space-5);
  padding: var(--space-5);
  color: var(--color-text-muted);
}

.home-menu__content > .button {
  margin-left: auto;
}
.home-menu__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.home-menu__plan {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

.home-menu__content h3 {
  margin: 0;
  font-size: var(--font-item-title);
  line-height: var(--line-height-compact);
}

.home-menu__content p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}

.home-menu__content strong {
  margin-top: auto;
  padding-top: var(--space-2);
  font-size: var(--font-caption);
}

.home-menu__more {
  margin-left: auto;
  display: flex;
  width: fit-content;
  margin: var(--space-5) 0 0 auto;
}

@media (max-width: 760px) {
  .home-menu {
    margin-top: var(--space-8);
  }

  .home-menu__showcase {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }

  .home-menu__more {
    margin-left: auto;
    width: 100%;
  }
}
</style>
