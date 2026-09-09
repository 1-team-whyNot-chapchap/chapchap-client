<script setup>
import { ref } from 'vue'
import { Check, ChevronLeft, Info } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'

const appStore = useAppStore()
const emit = defineEmits(['navigate'])

const plans = [
  {
    id: 'healthy',
    name: '건강식',
    description: '가볍고 부담 없이 즐기는 식사',
    minimum: '회차별 메뉴 3개 이상',
  },
  {
    id: 'nutrition',
    name: '영양식',
    description: '균형 잡힌 한 끼를 위한 기본 추천 플랜',
    minimum: '회차별 메뉴 3개 이상',
  },
  {
    id: 'hearty',
    name: '든든식',
    description: '든든한 한 끼가 필요한 날을 위한 식사',
    minimum: '회차별 메뉴 6개 이상',
  },
]

// ref의 초기값을 현재 예약 플랜 또는 이용 중인 플랜으로 잡아 기존 선택을 화면에 보여줍니다.
const selectedNextPlan = ref(appStore.scheduledPlan || appStore.currentSubscription.planId)
const isSaved = ref(false)

function savePlanChange() {
  if (selectedNextPlan.value === appStore.currentSubscription.planId) {
    return
  }

  appStore.schedulePlanChange(selectedNextPlan.value)
  isSaved.value = true
}
</script>

<template>
  <div class="page management-page">
    <button class="back-button" type="button" @click="emit('navigate', 'subscription')">
      <ChevronLeft :size="18" aria-hidden="true" />
      내 구독으로
    </button>

    <section v-if="!isSaved" class="page-intro">
      <h1>다음에 이용할 플랜을<br />선택해주세요.</h1>
      <p>현재 회차는 그대로 유지되며, 선택한 플랜은 다음 정기결제일부터 적용됩니다.</p>
    </section>

    <section v-if="!isSaved" class="management-plan-grid">
      <button
        v-for="plan in plans"
        :key="plan.id"
        class="management-plan-card"
        :class="{ 'is-selected': selectedNextPlan === plan.id }"
        type="button"
        @click="selectedNextPlan = plan.id"
      >
        <span class="management-plan-card__check">
          <Check v-if="selectedNextPlan === plan.id" :size="18" aria-hidden="true" />
        </span>
        <small>
          {{ plan.id === appStore.currentSubscription.planId ? '현재 이용 중' : '변경 가능' }}
        </small>
        <strong>{{ plan.name }}</strong>
        <span>{{ plan.description }}</span>
        <span>{{ plan.minimum }}</span>
        <b>가격 미정</b>
      </button>
    </section>

    <aside v-if="!isSaved" class="notice-box notice-box--info management-notice">
      <Info :size="20" aria-hidden="true" />
      <div>
        <strong>적용 시점 안내</strong>
        <p>플랜 가격과 배송비는 다음 결제 전 백엔드 견적 결과를 기준으로 표시됩니다.</p>
      </div>
    </aside>

    <section v-if="isSaved" class="management-result" role="status">
      <span class="management-result__icon"><Check :size="34" aria-hidden="true" /></span>
      <h1>플랜 변경을 예약했어요.</h1>
      <p>다음 정기결제일부터 선택한 플랜이 적용됩니다.</p>
      <button class="button button-primary" type="button" @click="emit('navigate', 'subscription')">
        내 구독에서 확인하기
      </button>
    </section>

    <div v-if="!isSaved" class="mobile-action-bar">
      <div>
        <span>다음 적용 플랜</span>
        <strong>{{ planLabels[selectedNextPlan] }}</strong>
      </div>
      <button
        class="button button-primary"
        type="button"
        :disabled="selectedNextPlan === appStore.currentSubscription.planId"
        @click="savePlanChange"
      >
        변경 예약하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.management-plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  margin-top: 38px;
}

.management-plan-card {
  position: relative;
  display: grid;
  gap: 7px;
  min-height: 230px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}

.management-plan-card__check {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary);
}

.management-plan-card small,
.management-plan-card span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.management-plan-card strong {
  margin-top: 18px;
  font-size: var(--font-section-title);
}

.management-plan-card b {
  align-self: end;
  font-size: var(--font-body);
}

@media (max-width: 760px) {
  .management-plan-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .management-plan-card {
    min-height: 205px;
  }
}
</style>

<style scoped>
.management-plan-card.is-selected {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-soft);
}
</style>
