<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { planApi } from '../../subscription/api/planApi.js'
import { AlertTriangle, Check, ChevronRight, Leaf } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { parseMenuDate } from '../utils/menuCalendar.js'

const emit = defineEmits(['navigate'])
const route = useRoute()
const actualMenu = ref(null)
const status = ref('idle')
const imageFailed = ref(false)
let requestVersion = 0
const menu = computed(() => actualMenu.value)
const backTarget = computed(() => {
  if (route.query.from === 'calendar')
    return {
      name: 'menu',
      query: { date: parseMenuDate(route.query.date) ? route.query.date : undefined },
    }
  if (route.query.from === 'home') return { name: 'home' }
  const filter =
    route.query.from === 'catalog' && typeof route.query.filterPlanId === 'string'
      ? route.query.filterPlanId
      : undefined
  return { name: 'plan-menus', query: { filterPlanId: filter } }
})
const backLabel = computed(() =>
  backTarget.value.name === 'home'
    ? '메인으로'
    : backTarget.value.name === 'menu'
      ? '날짜별 메뉴로'
      : '메뉴 목록으로',
)
const stateMessage = computed(
  () =>
    ({
      invalid: '메뉴 주소가 올바르지 않습니다.',
      missing: '해당 메뉴를 찾을 수 없습니다.',
      error: '메뉴 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
    })[status.value],
)

async function loadMenu() {
  const current = ++requestVersion
  actualMenu.value = null
  imageFailed.value = false
  const { planId, menuSequence } = route.query
  if (
    typeof planId !== 'string' ||
    typeof menuSequence !== 'string' ||
    !/^(?:[1-9]|[12][0-9]|3[01])$/.test(menuSequence)
  ) {
    status.value = 'invalid'
    return
  }
  status.value = 'loading'
  try {
    const plan = await planApi.getPlan(planId)
    if (current !== requestVersion) return
    const found = plan.menus.find((item) => item.menuSequence === Number(menuSequence))
    if (!found) {
      status.value = 'missing'
      return
    }
    actualMenu.value = {
      ...found,
      type: plan.name,
      nutrition: found.nutritionInfo,
      allergens: found.allergenInfo,
      ingredients: found.ingredientInfo,
    }
    status.value = 'success'
  } catch (error) {
    if (current !== requestVersion) return
    status.value = error.status === 400 ? 'invalid' : error.status === 404 ? 'missing' : 'error'
  }
}
watch(() => [route.query.planId, route.query.menuSequence], loadMenu, {
  immediate: true,
})
onUnmounted(() => {
  requestVersion++
})
</script>

<template>
  <div class="page detail-feature-page">
    <PageBackButton :label="backLabel" :to="backTarget" />

    <section v-if="status === 'loading'" class="menu-detail-state" role="status">
      메뉴 정보를 불러오는 중입니다.
    </section>
    <section v-else-if="status !== 'success'" class="menu-detail-state" role="alert">
      <h1>{{ stateMessage }}</h1>
      <button
        v-if="status === 'error'"
        class="button button-secondary"
        type="button"
        @click="loadMenu"
      >
        다시 시도
      </button>
    </section>

    <template v-else-if="menu">
      <section class="menu-detail-hero">
        <img
          v-if="menu.imageUrl && !imageFailed"
          class="menu-detail-image"
          :src="menu.imageUrl"
          :alt="menu.name"
          @error="imageFailed = true"
        />
        <div v-else class="photo-placeholder photo-placeholder--large">메뉴 이미지 준비 중</div>
        <div class="menu-detail-copy">
          <p class="section-kicker">{{ menu.type }}</p>
          <h1>{{ menu.name }}</h1>
          <p>{{ menu.description }}</p>
          <span class="included-label"><Check :size="16" aria-hidden="true" /> 플랜 포함 메뉴</span>

          <dl class="menu-facts">
            <div>
              <dt>영양 정보</dt>
              <dd>{{ menu.nutrition || '등록된 정보 없음' }}</dd>
            </div>
            <div>
              <dt>알레르기</dt>
              <dd>{{ menu.allergens || '등록된 정보 없음' }}</dd>
            </div>
            <div>
              <dt>원재료</dt>
              <dd>{{ menu.ingredients || '등록된 정보 없음' }}</dd>
            </div>
          </dl>

          <button class="button button-primary" type="button" @click="emit('navigate', 'plans')">
            플랜에서 선택하기
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="menu-detail-notes">
        <article>
          <Leaf :size="21" aria-hidden="true" />
          <div>
            <strong>메뉴 구성 원칙</strong>
            <p>한 끼의 균형과 구독 중 선택하기 쉬운 구성을 기준으로 준비합니다.</p>
          </div>
        </article>
        <article>
          <AlertTriangle :size="21" aria-hidden="true" />
          <div>
            <strong>알레르기 정보 확인</strong>
            <p>최종 원재료와 교차오염 정보는 실제 상품 라벨과 서버 데이터를 확인해야 합니다.</p>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.menu-detail-state {
  padding: 40px 0;
}
.menu-detail-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 22px;
}
.catalog-search {
  max-width: 620px;
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 34px;
  padding: 0 15px;
  border: 1px solid var(--color-border);
  border-radius: 13px;
  background: var(--color-surface);
  color: var(--color-text-muted);
}
.catalog-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}
.catalog-search input:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.catalog-menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 34px;
}
.catalog-menu-card {
  position: relative;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  gap: 17px;
  overflow: hidden;
  padding: 0 18px 0 0;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}
.catalog-menu-card.is-disabled {
  opacity: 0.62;
}
.photo-placeholder {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}
.photo-placeholder--large {
  min-height: 410px;
  border: 1px dashed #cdd3bc;
  border-radius: 22px;
}
.catalog-menu-card__body {
  display: grid;
  gap: 6px;
  padding-block: 18px;
}
.catalog-menu-card__body small,
.catalog-menu-card__body b {
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.catalog-menu-card__body strong {
  font-size: var(--font-body);
}
.catalog-menu-card__body > span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.menu-detail-hero,
.plan-detail-hero {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: clamp(34px, 6vw, 76px);
}
.menu-detail-copy h1,
.plan-detail-hero h1 {
  margin-top: 0;
  font-size: var(--font-display);
}
.menu-detail-copy > p:not(.section-kicker),
.plan-detail-hero > div > p:not(.section-kicker) {
  margin-top: 16px;
}
.included-label {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.menu-facts {
  display: grid;
  gap: 0;
  margin: 25px 0;
  border-top: 1px solid var(--color-border);
}
.menu-facts > div {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 18px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.menu-facts dt,
.menu-facts dd {
  margin: 0;
  font-size: var(--font-caption);
}
.menu-facts dt {
  color: var(--color-text-muted);
}
.menu-facts dd {
  font-weight: 700;
}
@media (max-width: 760px) {
  .catalog-menu-grid,
  .menu-detail-hero,
  .plan-detail-hero {
    grid-template-columns: 1fr;
  }
  .catalog-menu-card {
    grid-template-columns: 110px minmax(0, 1fr);
    padding-right: 14px;
  }
  .catalog-menu-card > svg {
    display: none;
  }
}
</style>

<style scoped>
.included-label {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}

.menu-facts {
  display: grid;
  gap: 0;
  margin: 25px 0;
  border-top: 1px solid var(--color-border);
}

.menu-facts > div {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 18px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}

.menu-facts dt,
.menu-facts dd {
  margin: 0;
  font-size: var(--font-caption);
}

.menu-facts dt {
  color: var(--color-text-muted);
}

.menu-facts dd {
  font-weight: 700;
}

.menu-detail-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 48px;
}

.menu-detail-notes article {
  display: flex;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: var(--color-surface-subtle);
}

.menu-detail-notes svg {
  flex: 0 0 auto;
  color: var(--color-primary-pressed);
}

.menu-detail-notes p {
  margin-top: 5px;
  font-size: var(--font-caption);
}
</style>
