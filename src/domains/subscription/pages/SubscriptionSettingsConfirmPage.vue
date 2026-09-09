<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { computed, ref } from 'vue'
import { CheckCircle2, ChevronLeft, Info } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const isApplied = ref(false)
const draft = computed(() => appStore.subscriptionSettingsDraft)
const planLabel = computed(() => planLabels[draft.value?.planId])

function applyChanges() {
  // G06: 사전 견적이 없으므로 실제 상태를 바꾸지 않습니다.
  return
}
</script>

<template>
  <div class="page subscription-settings-confirm-page workspace-ui design-review-page">
    <DesignPreview title="구독">
      <button
        v-if="!isApplied"
        class="back-button"
        type="button"
        @click="emit('navigate', 'wf-024')"
      >
        <ChevronLeft :size="18" aria-hidden="true" />설정 변경으로
      </button>
      <section v-if="!draft && !isApplied" class="empty-confirm">
        <h1>확인할 변경 내용이 없어요.</h1>
        <button class="button button-primary" type="button" @click="emit('navigate', 'wf-024')">
          설정 변경하기
        </button>
      </section>
      <template v-else-if="!isApplied"
        ><section class="page-intro">
          <h1>변경 내용을<br />확인하세요.</h1>
          <p>실제 적용일과 금액 차이는 서버 계산 결과를 기준으로 확정됩니다.</p>
        </section>
        <section class="confirm-card">
          <h2>변경 요약</h2>
          <dl>
            <div>
              <dt>변경 플랜</dt>
              <dd>
                {{ planLabels[appStore.currentSubscription.planId] }} →
                {{ planLabel }}
              </dd>
            </div>
            <div>
              <dt>적용 예정일</dt>
              <dd>다음 변경 가능 회차 이후 · 서버 확인 필요</dd>
            </div>
            <div>
              <dt>영향 주문</dt>
              <dd>서버 확인 후 제공</dd>
            </div>
          </dl>
          <h2>요일별 설정</h2>
          <ul>
            <li v-for="rule in draft.deliveryRules" :key="rule.id">
              <strong>{{ rule.label }}</strong
              ><span>{{ rule.personCount }}명 · {{ rule.deliveryTime }}</span>
            </li>
          </ul>
        </section>
        <aside class="server-note">
          <Info :size="20" aria-hidden="true" />
          <p>
            추가 결제 또는 부분 취소 금액은 프런트에서 계산하지 않습니다. 실제 확정 전 서버 견적
            결과를 받아야 합니다.
          </p>
        </aside>
        <div class="mobile-action-bar">
          <div><span>변경 상태</span><strong>확정 대기</strong></div>
          <button class="button button-primary" type="button" disabled @click="applyChanges">
            견적 연결 후 변경 가능
          </button>
        </div></template
      >
      <section v-else class="apply-result" role="status">
        <CheckCircle2 :size="44" aria-hidden="true" />
        <h1>설정을 적용했어요.</h1>
        <p>
          현재 화면에서는 시연 상태만 반영했습니다. 실제 서비스에서는 서버 확정 응답 후 적용 결과를
          표시해야 합니다.
        </p>
        <button
          class="button button-primary"
          type="button"
          @click="emit('navigate', 'subscription')"
        >
          내 구독에서 확인하기
        </button>
      </section>
    </DesignPreview>
  </div>
</template>

<style scoped>
.subscription-settings-confirm-page {
  max-width: 760px;
  margin: 0 auto;
}
.confirm-card {
  display: grid;
  gap: 20px;
  margin-top: 30px;
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.confirm-card h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.confirm-card dl {
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.confirm-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-caption);
}
.confirm-card dt {
  color: var(--color-text-muted);
}
.confirm-card dd {
  margin: 0;
  font-weight: 800;
  text-align: right;
}
.confirm-card ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.confirm-card li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  border-radius: 11px;
  background: var(--color-surface-subtle);
  font-size: var(--font-caption);
}
.confirm-card li span {
  color: var(--color-text-muted);
}
.server-note {
  display: flex;
  gap: 9px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 13px;
  background: var(--color-info-soft);
  color: var(--color-info);
}
.server-note p {
  margin: 0;
  color: inherit;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.apply-result,
.empty-confirm {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 74px 20px;
  text-align: center;
}
.apply-result svg {
  color: var(--color-primary-pressed);
}
.apply-result h1,
.empty-confirm h1 {
  margin: 0;
}
.apply-result p {
  max-width: 470px;
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
@media (max-width: 540px) {
  .confirm-card dl div,
  .confirm-card li {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .confirm-card dd {
    text-align: left;
  }
}
</style>
