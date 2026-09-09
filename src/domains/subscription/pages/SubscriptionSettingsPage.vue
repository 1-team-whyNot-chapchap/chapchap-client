<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { computed, ref } from 'vue'
import { ChevronLeft, Minus, Plus } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const draftPlanId = ref(appStore.currentSubscription.planId)
const draftRules = ref(appStore.currentSubscription.deliveryRules.map((rule) => ({ ...rule })))
const hasChanges = computed(
  () =>
    JSON.stringify({ planId: draftPlanId.value, rules: draftRules.value }) !==
    JSON.stringify({
      planId: appStore.currentSubscription.planId,
      rules: appStore.currentSubscription.deliveryRules,
    }),
)

function changePersonCount(rule, change) {
  rule.personCount = Math.max(1, Math.min(6, rule.personCount + change))
}
function reviewChanges() {
  appStore.prepareSubscriptionSettingsChange({
    planId: draftPlanId.value,
    deliveryRules: draftRules.value,
  })
  emit('navigate', 'wf-025')
}
</script>

<template>
  <div class="page subscription-settings-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <button class="back-button" type="button" @click="emit('navigate', 'wf-021')">
        <ChevronLeft :size="18" aria-hidden="true" />구독 상세로
      </button>
      <section class="page-intro">
        <h1>구독 설정을<br />변경하세요.</h1>
        <p>변경할 조건을 비교해 보세요. 실제 적용은 견적 서비스 연결 후 가능합니다.</p>
      </section>
      <section class="settings-card">
        <label
          >플랜<select v-model="draftPlanId">
            <option value="healthy">건강식</option>
            <option value="nutrition">영양식</option>
            <option value="hearty">든든식</option>
          </select></label
        >
      </section>
      <section class="rule-editor" aria-labelledby="rule-editor-title">
        <div class="section-heading">
          <div>
            <h2 id="rule-editor-title">요일별 배송 설정</h2>
            <p>인원, 시간, 배송지를 각각 설정할 수 있습니다.</p>
          </div>
        </div>
        <article v-for="rule in draftRules" :key="rule.id">
          <header>
            <h3>{{ rule.label }}</h3>
          </header>
          <div class="rule-fields">
            <div>
              <span>인원</span>
              <div class="count-control">
                <button
                  type="button"
                  :disabled="rule.personCount === 1"
                  :aria-label="`${rule.label} 인원 줄이기`"
                  @click="changePersonCount(rule, -1)"
                >
                  <Minus :size="16" aria-hidden="true" /></button
                ><output>{{ rule.personCount }}명</output
                ><button
                  type="button"
                  :disabled="rule.personCount === 6"
                  :aria-label="`${rule.label} 인원 늘리기`"
                  @click="changePersonCount(rule, 1)"
                >
                  <Plus :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>
            <label
              >배송 시간<select v-model="rule.deliveryTime">
                <option>점심 · 11:00~13:00</option>
                <option>저녁 · 17:00~19:00</option>
              </select></label
            ><label
              >배송지<select v-model="rule.addressId">
                <option v-for="address in appStore.addresses" :key="address.id" :value="address.id">
                  {{ address.name }}
                </option>
              </select></label
            >
          </div>
        </article>
      </section>
      <div class="mobile-action-bar">
        <div>
          <span>변경 내용</span><strong>{{ hasChanges ? '확인 필요' : '변경 없음' }}</strong>
        </div>
        <button
          class="button button-primary"
          type="button"
          :disabled="!hasChanges"
          @click="reviewChanges"
        >
          변경 내용 확인
        </button>
      </div>
    </DesignPreview>
  </div>
</template>

<style scoped>
.subscription-settings-page {
  max-width: 900px;
}
.settings-card,
.rule-editor {
  margin-top: 30px;
  padding: clamp(20px, 3vw, 28px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.settings-card label,
.rule-fields label {
  min-width: 0;
  display: grid;
  gap: 8px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 800;
}
.settings-card select,
.rule-fields select {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.section-heading p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.rule-editor article {
  padding: 20px 0;
  border-bottom: 1px solid var(--color-border);
}
.rule-editor article:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.rule-editor h3 {
  margin: 0;
  font-size: var(--font-item-title);
}
.rule-fields {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 15px;
}
.rule-fields > div {
  min-width: 0;
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.count-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}
.count-control button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: var(--color-surface-subtle);
  color: var(--color-text);
}
.count-control button:disabled {
  cursor: not-allowed;
  color: var(--color-text-muted);
}
.count-control output {
  font-size: var(--font-caption);
  font-weight: 800;
}
@media (max-width: 650px) {
  .rule-fields {
    grid-template-columns: minmax(0, 1fr);
  }
  .settings-card,
  .rule-editor {
    margin-top: 24px;
  }
}
</style>
