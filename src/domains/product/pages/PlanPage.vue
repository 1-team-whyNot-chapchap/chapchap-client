<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'

const appStore = useAppStore()
const emit = defineEmits(['navigate'])

// ref는 강조할 카드가 바뀌면 Vue가 카드의 테두리와 버튼 색상을 다시 그리게 합니다.
// 아무 카드에도 마우스나 키보드 포커스가 없을 때는 추천 플랜인 영양식을 강조합니다.
const highlightedPlanId = ref('nutrition')

const plans = [
  {
    id: 'healthy',
    eyebrow: '가볍게',
    name: '건강식',
    description: '가볍고 부담 없이 즐기는 식사 플랜',
    items: ['가벼운 구성', '규칙적인 식사 관리', '선택 요일 배송'],
  },
  {
    id: 'nutrition',
    name: '영양식',
    description: '균형 잡힌 한 끼를 위한 기본 추천 플랜',
    items: ['균형 잡힌 구성', '일상 식사에 적합', '선택 요일 배송'],
    recommended: true,
  },
  {
    id: 'hearty',
    eyebrow: '든든하게',
    name: '든든식',
    description: '든든한 한 끼가 필요한 날을 위한 플랜',
    items: ['든든한 구성', '충분한 식사량', '선택 요일 배송'],
  },
]

function selectPlan(planId) {
  appStore.beginSubscriptionApplication(planId)
  emit('navigate', 'wf-013')
}

function highlightPlan(planId) {
  highlightedPlanId.value = planId
}

function resetPlanHighlight() {
  highlightedPlanId.value = 'nutrition'
}

function openPlanDetail(planId) {
  if (planId === 'healthy') {
    emit('navigate', 'wf-011')
    return
  }

  if (planId === 'nutrition') {
    emit('navigate', 'wf-012')
    return
  }

  if (planId === 'hearty') {
    emit('navigate', 'plan-hearty-detail')
  }
}
</script>

<template>
  <div class="page plan-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <section class="page-intro page-intro--centered">
        <h1>나에게 맞는 식사 리듬을 선택해 보세요.</h1>
        <p>플랜에 포함된 식사를 정해진 일정에 맞춰 받습니다. 플랜 가격은 현재 준비 중이에요.</p>
      </section>

      <section class="plan-grid">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ 'plan-card--highlighted': highlightedPlanId === plan.id }"
          @mouseenter="highlightPlan(plan.id)"
          @mouseleave="resetPlanHighlight"
          @focusin="highlightPlan(plan.id)"
          @focusout="resetPlanHighlight"
        >
          <div class="plan-card__top">
            <span v-if="plan.recommended" class="recommendation-badge">추천</span>
          </div>
          <h2>{{ plan.name }}</h2>
          <p>{{ plan.description }}</p>
          <div class="plan-price">
            <span>플랜 가격</span>
            <strong>가격 미정</strong>
          </div>
          <ul>
            <li v-for="item in plan.items" :key="item">{{ item }}</li>
          </ul>
          <button class="text-button" type="button" @click="openPlanDetail(plan.id)">
            플랜 상세 보기
            <ChevronRight :size="16" aria-hidden="true" />
          </button>
          <button
            class="button"
            :class="highlightedPlanId === plan.id ? 'button-primary' : 'button-secondary'"
            type="button"
            @click="selectPlan(plan.id)"
          >
            {{ plan.recommended ? '영양식 시작하기' : '이 플랜 선택' }}
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </article>
      </section>

      <section class="plan-assurance">
        <div>
          <h2>선택은 가볍게,<br />구성은 자유롭게.</h2>
        </div>
        <div class="plan-assurance__items">
          <p>
            <strong>메뉴별 가격 없음</strong>
            <span>플랜 안에서 메뉴를 구성해요.</span>
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
        <p>플랜 가격과 배송비는 결제 전 백엔드의 견적 결과를 기준으로 표시됩니다.</p>
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

.recommendation-badge {
  padding: 4px 8px;
  border-radius: 99px;
  background: var(--color-primary-soft);
  color: #a35d13;
  font-size: var(--font-caption);
  font-weight: 800;
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
