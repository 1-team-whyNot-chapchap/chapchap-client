<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import { usePlanStore } from '../../subscription/stores/usePlanStore.js'

const appStore = useAppStore()
const planStore = usePlanStore()
const router = useRouter()
const emit = defineEmits(['navigate'])
const highlightedPlanId = ref('')

const planHighlights = [
  '플랜별 1~31번 고정 메뉴',
  '월요일~토요일 중 배송 요일 선택',
  '구독 신청 전 예상 금액 확인',
]

onMounted(async () => {
  const plans = await planStore.fetchPlans()
  if (!highlightedPlanId.value) highlightedPlanId.value = plans[0]?.planId || ''
})

function selectPlan(planId) {
  appStore.beginSubscriptionApplication(planId)
  emit('navigate', 'wf-013')
}

function highlightPlan(planId) {
  highlightedPlanId.value = planId
}

function resetPlanHighlight() {
  highlightedPlanId.value = planStore.plans[0]?.planId || ''
}

function openPlanDetail(planId) {
  router.push({ name: 'plan-detail', params: { planId } })
}

async function retryPlans() {
  const plans = await planStore.fetchPlans(true)
  highlightedPlanId.value = plans[0]?.planId || ''
}

function formatUnitPrice(unitPrice) {
  return `${Number(unitPrice).toLocaleString('ko-KR')}원 / 1식`
}
</script>

<template>
  <div class="page plan-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <section class="page-intro page-intro--centered">
        <h1>나에게 맞는 식사 리듬을 선택해 보세요.</h1>
        <p>플랜별 고정 메뉴를 내가 선택한 요일에 맞춰 받아보세요.</p>
      </section>

      <section
        v-if="['idle', 'loading'].includes(planStore.listStatus)"
        class="ui-empty plan-state"
        aria-busy="true"
      >
        <h2>플랜을 불러오고 있어요.</h2>
        <p class="ui-muted">잠시만 기다려 주세요.</p>
      </section>

      <section
        v-else-if="planStore.listStatus === 'error'"
        class="ui-empty plan-state"
        role="alert"
      >
        <h2>플랜을 불러오지 못했어요.</h2>
        <p class="ui-muted">잠시 후 다시 시도해 주세요.</p>
        <button class="button button-secondary" type="button" @click="retryPlans">다시 시도</button>
      </section>

      <section v-else-if="planStore.listStatus === 'empty'" class="ui-empty plan-state">
        <h2>현재 선택할 수 있는 플랜이 없어요.</h2>
        <p class="ui-muted">새 플랜이 준비되면 이곳에서 안내해 드릴게요.</p>
      </section>

      <section v-else class="plan-grid">
        <article
          v-for="plan in planStore.plans"
          :key="plan.planId"
          class="plan-card"
          :class="{ 'plan-card--highlighted': highlightedPlanId === plan.planId }"
          @mouseenter="highlightPlan(plan.planId)"
          @mouseleave="resetPlanHighlight"
          @focusin="highlightPlan(plan.planId)"
          @focusout="resetPlanHighlight"
        >
          <div class="plan-card__top">
            <span class="plan-eyebrow">구독 플랜</span>
          </div>
          <h2>{{ plan.name }}</h2>
          <p>{{ plan.description }}</p>
          <div class="plan-price">
            <span>도시락 단가</span>
            <strong>{{ formatUnitPrice(plan.unitPrice) }}</strong>
          </div>
          <ul>
            <li v-for="item in planHighlights" :key="item">{{ item }}</li>
          </ul>
          <button class="text-button" type="button" @click="openPlanDetail(plan.planId)">
            플랜 상세 보기
            <ChevronRight :size="16" aria-hidden="true" />
          </button>
          <button
            class="button"
            :class="highlightedPlanId === plan.planId ? 'button-primary' : 'button-secondary'"
            type="button"
            @click="selectPlan(plan.planId)"
          >
            {{ plan.name }} 선택
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </article>
      </section>

      <section class="plan-assurance">
        <div>
          <h2>선택은 가볍게,<br />일정은 내 리듬대로.</h2>
        </div>
        <div class="plan-assurance__items">
          <p>
            <strong>고정 메뉴 안내</strong>
            <span>플랜별 1~31번 메뉴를 미리 확인해요.</span>
          </p>
          <p>
            <strong>다음 결제부터 변경</strong>
            <span>현재 회차는 그대로 이용할 수 있어요.</span>
          </p>
          <p>
            <strong>구독 변경 안내</strong>
            <span>변경 가능 조건은 현재 구독에서 확인해요.</span>
          </p>
        </div>
      </section>

      <aside class="notice-box notice-box--info">
        <strong>가격 안내</strong>
        <p>화면에는 도시락 1식 단가를 표시하며 배송비와 최종 결제금액은 신청 전에 확인합니다.</p>
      </aside>
    </DesignPreview>
  </div>
</template>

<style scoped>
.page-intro--centered {
  margin: 0 auto;
  text-align: center;
}

.page-intro--centered .eyebrow {
  justify-content: center;
}

.plan-state {
  margin-top: 52px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  gap: 18px;
  margin-top: 52px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  padding: 29px;
  border: 2px solid transparent;
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--color-border);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.plan-card__top {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 28px;
}

.plan-eyebrow {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.07em;
}

.plan-card--highlighted .plan-eyebrow {
  color: #a35d13;
}

.plan-card h2 {
  margin-top: 0;
  font-size: var(--font-page-title);
}

.plan-card > p {
  min-height: 50px;
  margin-top: 10px;
  font-size: var(--font-body);
}

.plan-price {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 25px 0 21px;
  padding: 15px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.plan-price span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.plan-price strong {
  font-size: var(--font-section-title);
}

.plan-card ul {
  display: grid;
  gap: 11px;
  padding: 0;
  margin: 0 0 28px;
  list-style: none;
}

.plan-card li {
  position: relative;
  padding-left: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.plan-card li::before {
  position: absolute;
  top: 0.65em;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  content: '';
}

.plan-card .button {
  width: 100%;
  margin-top: auto;
}

.plan-assurance {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 42px;
  margin-top: 68px;
  padding: 42px;
  border-radius: 24px;
  background: var(--color-surface-subtle);
}

.plan-assurance h2 {
  margin-top: 0;
  font-size: var(--font-page-title);
}

.plan-assurance__items {
  display: grid;
  gap: 16px;
}

.plan-assurance__items p {
  display: grid;
  gap: 3px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.plan-assurance__items strong {
  color: var(--color-text);
  font-size: var(--font-body);
}

.plan-assurance__items span {
  font-size: var(--font-caption);
}

@media (max-width: 760px) {
  .plan-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 38px;
  }
}

@media (max-width: 760px) {
  .plan-card {
    padding: 25px;
  }
}

@media (max-width: 760px) {
  .plan-card > p {
    min-height: auto;
  }
}

@media (max-width: 760px) {
  .plan-assurance {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 48px;
    padding: 28px 24px;
  }
}
</style>

<style scoped>
.plan-card--highlighted {
  border: 2px solid var(--color-primary);
  background: #fffdf9;
  box-shadow: 0 16px 35px rgba(242, 140, 40, 0.1);
}
</style>
