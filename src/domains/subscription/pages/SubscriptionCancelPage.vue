<script setup>
import { ref } from 'vue'
import { CalendarCheck, CalendarClock, CheckCircle2, ChevronLeft, RefreshCw } from 'lucide-vue-next'
import { formatDeliveryDate } from '../../../common/utils/date'
import { useAppStore } from '../../../stores/useAppStore'

const appStore = useAppStore()
const emit = defineEmits(['navigate'])

const hasConfirmed = ref(false)
const isComplete = ref(false)

function confirmCancellation() {
  if (!hasConfirmed.value) {
    return
  }

  appStore.scheduleCancellation()
  isComplete.value = true
}
</script>

<template>
  <div class="page management-page">
    <button class="back-button" type="button" @click="emit('navigate', 'subscription')">
      <ChevronLeft :size="18" aria-hidden="true" />
      내 구독으로
    </button>

    <section v-if="!isComplete" class="page-intro">
      <h1>구독 해지 전<br />꼭 확인해주세요.</h1>
      <p>해지는 현재 이용 중인 기간을 즉시 종료하지 않습니다.</p>
    </section>

    <section v-if="!isComplete" class="cancel-summary-card">
      <CalendarCheck :size="28" aria-hidden="true" />
      <div>
        <span>현재 이용 종료 예정일</span>
        <strong
          >{{ formatDeliveryDate(appStore.currentSubscription.dates.nextPayment) }} 전까지
          이용</strong
        >
        <p>다음 정기결제부터 결제 및 새 회차 생성이 중단됩니다.</p>
      </div>
    </section>

    <section v-if="!isComplete" class="retention-options">
      <div>
        <h2>해지 전에 이런 방법도 있어요.</h2>
        <p>필요한 일정만 미루거나 다음 결제일부터 플랜을 변경할 수 있습니다.</p>
      </div>
      <div class="retention-options__actions">
        <button class="button button-secondary" type="button" @click="emit('navigate', 'wf-022')">
          <CalendarClock :size="17" aria-hidden="true" />
          배송 일정 미루기
        </button>
        <button class="button button-secondary" type="button" @click="emit('navigate', 'wf-054')">
          <RefreshCw :size="17" aria-hidden="true" />
          플랜 변경하기
        </button>
      </div>
    </section>

    <label v-if="!isComplete" class="confirmation-check">
      <input v-model="hasConfirmed" type="checkbox" />
      <span>
        <strong>해지 기준을 확인했습니다.</strong>
        <small>현재 이용 기간은 유지되고 다음 결제부터 중단되는 것에 동의합니다.</small>
      </span>
    </label>

    <section v-if="isComplete" class="management-result" role="status">
      <span class="management-result__icon">
        <CheckCircle2 :size="34" aria-hidden="true" />
      </span>
      <h1>구독 해지가 예약되었습니다.</h1>
      <p>현재 이용 기간이 끝난 뒤 다음 정기결제부터 청구되지 않습니다.</p>
      <button class="button button-primary" type="button" @click="emit('navigate', 'subscription')">
        내 구독으로 돌아가기
      </button>
    </section>

    <div v-if="!isComplete" class="mobile-action-bar mobile-action-bar--danger">
      <div>
        <span>다음 결제</span>
        <strong>결제 중단 예정</strong>
      </div>
      <button
        class="button button-danger"
        type="button"
        :disabled="!hasConfirmed"
        @click="confirmCancellation"
      >
        구독 해지 예약하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.button-danger,
.button-danger-outline {
  color: var(--color-danger);
}

.button-danger {
  background: var(--color-danger);
  color: #ffffff;
}

.button-danger:hover {
  background: #b6554c;
}

.cancel-summary-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 36px;
  padding: 24px;
  border: 1px solid #efcfcb;
  border-radius: 18px;
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.cancel-summary-card div {
  display: grid;
  gap: 6px;
}

.cancel-summary-card span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.cancel-summary-card strong {
  color: var(--color-text);
  font-size: var(--font-body);
}

.cancel-summary-card p {
  font-size: var(--font-caption);
}

.confirmation-check {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 20px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.confirmation-check input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.confirmation-check span {
  display: grid;
  gap: 4px;
}

.confirmation-check small {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.retention-options {
  display: grid;
  gap: 18px;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.retention-options h2 {
  margin-top: 5px;
  font-size: var(--font-section-title);
}

.retention-options p:last-child {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.retention-options__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 760px) {
  .retention-options__actions {
    display: grid;
  }
}

@media (max-width: 760px) {
  .retention-options__actions .button {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .mobile-action-bar--danger {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }
}

@media (max-width: 760px) {
  .mobile-action-bar--danger .button {
    width: 100%;
  }
}
</style>
