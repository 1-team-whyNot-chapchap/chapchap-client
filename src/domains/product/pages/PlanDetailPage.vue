<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { computed } from 'vue'
import { CalendarCheck, ChevronRight, Info, RefreshCcw } from 'lucide-vue-next'
import { planDetails } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const props = defineProps({
  planId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const plan = computed(() => planDetails[props.planId])

function choosePlan() {
  appStore.beginSubscriptionApplication(plan.value.id)
  emit('navigate', 'wf-013')
}
</script>

<template>
  <div class="page plan-detail-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <PageBackButton label="플랜 목록으로" @back="emit('navigate', 'plans')" />

      <section class="plan-detail-hero">
        <div>
          <h1>{{ plan.name }}</h1>
          <p>{{ plan.description }}</p>
          <div class="plan-detail-price">
            <span>정기 구독 가격</span>
            <strong>가격 미정</strong>
            <small>배송비 미정 · 결제 전 서버 견적 기준</small>
          </div>
          <button class="button button-primary" type="button" @click="choosePlan">
            {{ plan.name }} 선택
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>
        <section class="ui-surface ui-stack">
          <h2>플랜에 포함된 메뉴</h2>
          <p>날짜 순번에 맞춰 제공되는 메뉴를 이곳에서 확인할 수 있어요.</p>
          <div class="ui-empty">
            <CalendarCheck :size="32" aria-hidden="true" />
            <h3>메뉴 구성을 준비하고 있어요.</h3>
            <p class="ui-muted">영양·알레르기·원재료 정보는 메뉴와 함께 제공됩니다.</p>
          </div>
        </section>
      </section>

      <section class="plan-detail-grid">
        <article>
          <CalendarCheck :size="23" aria-hidden="true" />
          <strong>{{ plan.cycle }}</strong>
          <p>{{ plan.minimum }}</p>
        </article>
        <article>
          <RefreshCcw :size="23" aria-hidden="true" />
          <strong>다음 결제부터 변경</strong>
          <p>현재 이용 기간과 확정된 회차는 유지합니다.</p>
        </article>
      </section>

      <section class="plan-benefit-section">
        <div>
          <h2>플랜에 포함되는 기능</h2>
        </div>
        <ul>
          <li v-for="benefit in plan.benefits" :key="benefit">{{ benefit }}</li>
        </ul>
      </section>

      <aside class="notice-box notice-box--info">
        <Info :size="20" aria-hidden="true" />
        <div>
          <strong>가격과 배송 가능 여부</strong>
          <p>플랜 가격·배송비·주소별 배송 가능 여부는 신청 과정에서 서버 응답으로 확정합니다.</p>
        </div>
      </aside>
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
