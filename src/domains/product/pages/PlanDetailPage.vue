<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { computed, ref, watch } from 'vue'
import { CalendarCheck, ChevronRight, Info, RefreshCcw } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import { usePlanStore } from '../../subscription/stores/usePlanStore.js'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const props = defineProps({
  planId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const planStore = usePlanStore()
const unavailableImages = ref(new Set())
const plan = computed(() => planStore.planById(props.planId))
const status = computed(() => planStore.detailStatuses[props.planId] || 'idle')
const error = computed(() => planStore.detailErrors[props.planId])
const isMissing = computed(
  () =>
    [400, 404].includes(error.value?.status) ||
    ['COMMON_001', 'SUBSCRIPTION_001'].includes(error.value?.code),
)
const benefits = [
  '플랜별 고정 메뉴를 1~31번 순서로 확인할 수 있어요.',
  '월요일~토요일 중 원하는 반복 배송 요일을 선택할 수 있어요.',
  '배송비와 최종 결제금액은 구독 신청 전에 확인할 수 있어요.',
]

watch(
  () => props.planId,
  (planId) => {
    unavailableImages.value = new Set()
    planStore.fetchPlan(planId)
  },
  { immediate: true },
)

function choosePlan() {
  if (!plan.value) return
  appStore.beginSubscriptionApplication(plan.value.planId)
  emit('navigate', 'wf-013')
}

function retryPlan() {
  planStore.fetchPlan(props.planId, true)
}

function formatUnitPrice(unitPrice) {
  return `${Number(unitPrice).toLocaleString('ko-KR')}원 / 1식`
}

function markImageUnavailable(menuSequence) {
  unavailableImages.value = new Set([...unavailableImages.value, menuSequence])
}

function hasImage(menu) {
  return Boolean(menu.imageUrl) && !unavailableImages.value.has(menu.menuSequence)
}
</script>

<template>
  <div class="page plan-detail-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <PageBackButton label="플랜 목록으로" @back="emit('navigate', 'plans')" />

      <section
        v-if="status === 'loading' || status === 'idle'"
        class="ui-empty plan-detail-state"
        aria-busy="true"
      >
        <h1>플랜 정보를 불러오고 있어요.</h1>
        <p class="ui-muted">잠시만 기다려 주세요.</p>
      </section>

      <section v-else-if="status === 'error'" class="ui-empty plan-detail-state" role="alert">
        <h1>{{ isMissing ? '플랜을 찾을 수 없어요.' : '플랜 정보를 불러오지 못했어요.' }}</h1>
        <p class="ui-muted">
          {{
            isMissing
              ? '판매가 종료됐거나 주소가 변경된 플랜이에요.'
              : '잠시 후 다시 시도해 주세요.'
          }}
        </p>
        <div class="plan-detail-state__actions">
          <button
            v-if="!isMissing"
            class="button button-secondary"
            type="button"
            @click="retryPlan"
          >
            다시 시도
          </button>
          <button class="button button-primary" type="button" @click="emit('navigate', 'plans')">
            플랜 목록으로
          </button>
        </div>
      </section>

      <template v-else-if="plan">
        <section class="plan-detail-hero">
          <div>
            <h1>{{ plan.name }}</h1>
            <p>{{ plan.description }}</p>
            <div class="plan-detail-price">
              <span>도시락 단가</span>
              <strong>{{ formatUnitPrice(plan.unitPrice) }}</strong>
              <small>배송비와 최종 결제금액은 구독 신청 전에 확인합니다.</small>
            </div>
            <button class="button button-primary" type="button" @click="choosePlan">
              {{ plan.name }} 선택
              <ChevronRight :size="18" aria-hidden="true" />
            </button>
          </div>
          <section class="ui-surface ui-stack">
            <h2>플랜에 포함된 메뉴</h2>
            <p>달력 일자와 같은 순번의 고정 메뉴가 배송됩니다.</p>
            <div class="ui-empty">
              <CalendarCheck :size="32" aria-hidden="true" />
              <h3>고정 메뉴 {{ plan.menus.length }}개</h3>
              <p class="ui-muted">메뉴는 선택하거나 수량을 변경할 수 없는 안내 정보입니다.</p>
            </div>
          </section>
        </section>

        <section class="plan-detail-grid">
          <article>
            <CalendarCheck :size="23" aria-hidden="true" />
            <strong>1~31번 고정 메뉴</strong>
            <p>각 배송일의 일자와 같은 메뉴 순번을 확인할 수 있어요.</p>
          </article>
          <article>
            <RefreshCcw :size="23" aria-hidden="true" />
            <strong>읽기 전용 안내</strong>
            <p>고객이 메뉴를 직접 선택하거나 변경하지 않아요.</p>
          </article>
        </section>

        <section class="plan-menu-section">
          <div>
            <h2>1~31번 고정 메뉴</h2>
            <p>메뉴 구성과 알레르기·영양·원재료 정보를 순서대로 확인해 주세요.</p>
          </div>
          <div class="catalog-menu-grid">
            <article v-for="menu in plan.menus" :key="menu.menuSequence" class="catalog-menu-card">
              <img
                v-if="hasImage(menu)"
                class="catalog-menu-card__image"
                :src="menu.imageUrl"
                :alt="`${menu.name} 메뉴`"
                @error="markImageUnavailable(menu.menuSequence)"
              />
              <div v-else class="photo-placeholder">메뉴 이미지 준비 중</div>
              <div class="catalog-menu-card__body">
                <small>{{ menu.menuSequence }}번째 메뉴</small>
                <strong>{{ menu.name }}</strong>
                <span>{{ menu.description }}</span>
                <dl class="menu-facts">
                  <div>
                    <dt>알레르기</dt>
                    <dd>{{ menu.allergenInfo || '정보 없음' }}</dd>
                  </div>
                  <div>
                    <dt>영양</dt>
                    <dd>{{ menu.nutritionInfo || '정보 없음' }}</dd>
                  </div>
                  <div>
                    <dt>원재료</dt>
                    <dd>{{ menu.ingredientInfo || '정보 없음' }}</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        </section>

        <section class="plan-benefit-section">
          <div>
            <h2>플랜에 포함되는 기능</h2>
          </div>
          <ul>
            <li v-for="benefit in benefits" :key="benefit">{{ benefit }}</li>
          </ul>
        </section>

        <aside class="notice-box notice-box--info">
          <Info :size="20" aria-hidden="true" />
          <div>
            <strong>가격과 배송 가능 여부</strong>
            <p>
              배송비·최종 결제금액·주소별 배송 가능 여부는 신청 과정의 서버 응답으로 확정합니다.
            </p>
          </div>
        </aside>
      </template>
    </DesignPreview>
  </div>
</template>

<style scoped>
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
  background: transparent;
}
.catalog-search input:focus-visible {
  outline: 3px solid var(--color-primary-hover);
  outline-offset: 3px;
}
.catalog-menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 34px;
}

.plan-menu-section {
  margin-top: 60px;
}

.plan-menu-section > div:first-child p {
  margin-top: 8px;
}

.catalog-menu-card {
  position: relative;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
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

.catalog-menu-card__image {
  width: 100%;
  height: 100%;
  min-height: 230px;
  object-fit: cover;
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

.catalog-menu-card .menu-facts {
  margin: 8px 0 0;
}

.catalog-menu-card .menu-facts > div {
  grid-template-columns: 70px 1fr;
  gap: 10px;
  padding: 8px 0;
}

.plan-detail-state {
  min-height: 360px;
  margin-top: 24px;
}

.plan-detail-state__actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
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
  .catalog-menu-card__image {
    min-height: 260px;
  }
  .catalog-menu-card > svg {
    display: none;
  }
}
</style>

<style scoped>
.plan-detail-hero {
  padding: clamp(28px, 5vw, 64px);
  border-radius: 28px;
  background: linear-gradient(135deg, var(--color-primary-soft), #fffaf1);
}

.plan-detail-price {
  display: grid;
  gap: 5px;
  margin: 28px 0;
}

.plan-detail-price span,
.plan-detail-price small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.plan-detail-price strong {
  font-size: var(--font-page-title);
}

.plan-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.plan-detail-grid article {
  display: grid;
  gap: 8px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
}

.plan-detail-grid svg {
  color: var(--color-primary-pressed);
}

.plan-benefit-section {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 40px;
  margin-top: 60px;
  padding: 38px;
  border-radius: 22px;
  background: var(--color-text);
}

.plan-benefit-section h2 {
  margin-top: 0;
  color: var(--color-surface);
}

.plan-benefit-section ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.plan-benefit-section li {
  position: relative;
  padding-left: 14px;
  color: var(--color-surface);
  font-size: var(--font-body);
}

.plan-benefit-section li::before {
  position: absolute;
  top: 0.62em;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
  content: '';
}

@media (max-width: 760px) {
  .plan-detail-hero {
    padding: 25px;
  }
}

@media (max-width: 760px) {
  .plan-benefit-section {
    gap: 24px;
    padding: 28px 24px;
  }
}

@media (max-width: 760px) {
  .plan-benefit-section ul {
    grid-template-columns: 1fr;
  }
}
</style>
