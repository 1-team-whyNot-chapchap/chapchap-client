<script setup>
import { computed, ref } from 'vue'
import { CalendarRange, Check, Layers3 } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])
const selectedPlan = ref('건강식')
const published = ref(false)
const plans = ['건강식', '영양식', '든든식']
const rotations = ref({
  건강식: [
    { round: '1회차', menu: '닭가슴살 샐러드', status: '편성 완료' },
    { round: '2회차', menu: '고등어 구이 도시락', status: '편성 필요' },
    { round: '3회차', menu: '버섯 불고기 덮밥', status: '편성 필요' },
  ],
  영양식: [
    { round: '1회차', menu: '제육볶음 정식', status: '편성 완료' },
    { round: '2회차', menu: '된장찌개 정식', status: '편성 완료' },
    { round: '3회차', menu: '닭볶음탕 정식', status: '편성 필요' },
  ],
  든든식: [
    { round: '1회차', menu: '소불고기 든든팩', status: '편성 완료' },
    { round: '2회차', menu: '닭갈비 든든팩', status: '편성 필요' },
    { round: '3회차', menu: '마파두부 든든팩', status: '편성 필요' },
  ],
})
const currentRotation = computed(() => rotations.value[selectedPlan.value])

function cycleMenu(item) {
  item.status = item.status === '편성 완료' ? '편성 필요' : '편성 완료'
  published.value = false
}
function publishRotation() {
  published.value = true
}

function selectPlan(plan) {
  selectedPlan.value = plan
  published.value = false
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-plan-rotation" @navigate="emit('navigate', $event)" />
    <main class="admin-main rotation-page">
      <header class="admin-header">
        <h1>플랜별 회차 메뉴 로테이션을 편성합니다.</h1>
        <p>건강식·영양식·든든식의 회차별 메뉴를 확인하고 운영 전 편성 상태를 확정하세요.</p>
      </header>
      <section class="rotation-summary">
        <CalendarRange :size="22" aria-hidden="true" />
        <div>
          <strong>2026년 8월 2주차</strong
          ><span
            >발행 전 편성표 ·
            {{ currentRotation.filter((item) => item.status === '편성 완료').length }}/{{
              currentRotation.length
            }}
            회차 완료</span
          >
        </div>
        <Layers3 :size="22" aria-hidden="true" />
      </section>
      <div class="plan-tabs" role="tablist" aria-label="플랜 선택">
        <button
          v-for="plan in plans"
          :key="plan"
          type="button"
          role="tab"
          :aria-selected="selectedPlan === plan"
          :class="{ 'is-active': selectedPlan === plan }"
          @click="selectPlan(plan)"
        >
          {{ plan }}
        </button>
      </div>
      <section class="rotation-card" aria-label="회차 로테이션 목록">
        <div v-for="item in currentRotation" :key="item.round" class="rotation-row">
          <div>
            <strong>{{ item.round }}</strong
            ><span>{{ item.menu }}</span>
          </div>
          <button class="button button-secondary" type="button" @click="cycleMenu(item)">
            {{ item.status }}
          </button>
        </div>
      </section>
      <p v-if="published" class="publish-result" role="status">
        <Check :size="17" aria-hidden="true" />{{ selectedPlan }} 로테이션 편성표를 발행 대기 상태로
        저장했습니다.
      </p>
      <button class="button button-primary publish-button" type="button" @click="publishRotation">
        이번 주 편성표 발행
      </button>
      <p class="policy-note">
        데모 화면입니다. 실제 발행은 메뉴 재고·매장 생산 가능 수량·구독 마감 시각을 서버에서
        검증하고 감사 이력에 남겨야 합니다.
      </p>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.rotation-page {
  max-width: 1050px;
}
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.06em;
}
.admin-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-header > p:last-child,
.rotation-summary span,
.policy-note {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.rotation-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding: 19px;
  border-radius: 16px;
  background: var(--color-primary-soft);
}
.rotation-summary svg {
  color: var(--color-primary-pressed);
}
.rotation-summary div {
  flex: 1;
}
.rotation-summary strong,
.rotation-summary span {
  display: block;
}
.rotation-summary span {
  margin-top: 3px;
}
.plan-tabs {
  display: flex;
  gap: 8px;
  margin-top: 26px;
  overflow-x: auto;
}
.plan-tabs button {
  flex: none;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: 800;
}
.plan-tabs button.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.rotation-card {
  margin-top: 15px;
  border-top: 1px solid var(--color-border);
}
.rotation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 4px;
  border-bottom: 1px solid var(--color-border);
}
.rotation-row strong,
.rotation-row span {
  display: block;
}
.rotation-row span {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.publish-button {
  margin-top: 24px;
}
.publish-result {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 22px 0 -12px;
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 800;
}
.policy-note {
  margin-top: 20px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .rotation-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .rotation-row .button,
  .publish-button {
    width: 100%;
  }
}
</style>
