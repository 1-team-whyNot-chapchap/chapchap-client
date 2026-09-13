<script setup>
import { computed, onMounted, ref } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import { subscriptionStatusLabel } from '../currentSubscriptionDisplay.js'
import { useCurrentSubscriptionStore } from '../stores/useCurrentSubscriptionStore.js'
import { useSubscriptionCancellationStore } from '../stores/useSubscriptionCancellationStore.js'

const currentStore = useCurrentSubscriptionStore()
const cancellationStore = useSubscriptionCancellationStore()
const confirming = ref(false)
const subscription = computed(() => currentStore.subscription)
const result = computed(() => cancellationStore.result)
const canCancel = computed(() =>
  ['SCHEDULED', 'IN_PROGRESS'].includes(subscription.value?.subscriptionStatus),
)
const errorMessage = computed(
  () => cancellationStore.error?.serverMessage || cancellationStore.error?.message || '',
)

const currency = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`
const cancellationTypeLabel = (type) =>
  ({
    REGULAR_CANCELLATION: '이용 중 구독 종료 예약',
    CANCELLATION_BEFORE_START: '시작 전 취소',
    NEXT_PERIOD_FULL_CANCELLATION: '다음 이용 기간 취소',
    REGULAR_PAYMENT_RETRY_STOPPED: '정기결제 재시도 중단',
  })[type] || '해지 처리'
const periodStatusLabel = (status) =>
  ({
    AWAITING_CONFIRMATION: '확정 대기',
    SCHEDULED: '이용 예정',
    IN_PROGRESS: '이용 중',
    ENDED: '이용 종료',
    CANCELED_BEFORE_START: '시작 전 취소',
    PAYMENT_FAILED: '결제 실패',
  })[status] || '상태 확인 필요'

onMounted(async () => {
  cancellationStore.$reset()
  await currentStore.fetchCurrentSubscription()
})

async function submit() {
  if (await cancellationStore.cancel()) await currentStore.fetchCurrentSubscription(true)
}
</script>

<template>
  <section class="workspace-ui cancellation-page">
    <header class="ui-heading">
      <div>
        <h1>구독 해지</h1>
        <p>현재 구독을 확인한 뒤 해지를 요청할 수 있습니다.</p>
      </div>
    </header>

    <p v-if="!result && ['idle', 'loading'].includes(currentStore.status)" role="status">
      현재 구독을 확인하고 있어요.
    </p>
    <section v-else-if="!result && currentStore.status === 'error'" class="ui-note" role="alert">
      <p>{{ currentStore.error?.message || '현재 구독을 불러오지 못했습니다.' }}</p>
      <button
        class="button button-secondary"
        type="button"
        @click="currentStore.fetchCurrentSubscription(true)"
      >
        다시 시도
      </button>
    </section>
    <template v-else-if="result">
      <section class="ui-empty cancellation-result" role="status">
        <CheckCircle2 :size="48" aria-hidden="true" />
        <h2>{{ cancellationTypeLabel(result.cancellationType) }} 결과</h2>
        <p>{{ result.cancellationRequestedAt }}에 서버에서 해지 요청을 처리했습니다.</p>
      </section>
      <section class="result-card">
        <dl>
          <div>
            <dt>구독 상태</dt>
            <dd>{{ subscriptionStatusLabel(result.subscriptionStatus) }}</dd>
          </div>
          <div>
            <dt>이용 기간 상태</dt>
            <dd>{{ periodStatusLabel(result.periodStatus) }}</dd>
          </div>
          <div>
            <dt>처리 유형</dt>
            <dd>{{ cancellationTypeLabel(result.cancellationType) }}</dd>
          </div>
        </dl>
        <template v-if="result.refund">
          <h3>환불 처리 결과</h3>
          <dl>
            <div>
              <dt>환불 상태</dt>
              <dd>{{ result.refund.status }}</dd>
            </div>
            <div>
              <dt>환불 요청</dt>
              <dd>{{ currency(result.refund.requestedAmount) }}</dd>
            </div>
            <div>
              <dt>환불 완료</dt>
              <dd>{{ currency(result.refund.refundedAmount) }}</dd>
            </div>
            <div>
              <dt>미처리 금액</dt>
              <dd>{{ currency(result.refund.unprocessedAmount) }}</dd>
            </div>
          </dl>
        </template>
      </section>
      <div class="ui-actions ui-actions--end">
        <RouterLink class="button button-primary" to="/subscription"
          >내 구독에서 확인하기</RouterLink
        >
      </div>
    </template>

    <section v-else-if="!subscription" class="ui-empty">
      <h2>해지할 구독이 없어요.</h2>
      <RouterLink class="button button-primary" to="/plans">플랜 살펴보기</RouterLink>
    </section>

    <template v-else>
      <section class="result-card">
        <h2>{{ subscription.plan?.name || '현재 구독' }}</h2>
        <dl>
          <div>
            <dt>구독 상태</dt>
            <dd>{{ subscriptionStatusLabel(subscription.subscriptionStatus) }}</dd>
          </div>
          <div>
            <dt>이용 기간</dt>
            <dd>{{ subscription.periodStartDate }} ~ {{ subscription.periodEndDate }}</dd>
          </div>
        </dl>
      </section>
      <aside v-if="canCancel" class="ui-note">
        <p>
          해지 유형과 환불 금액은 현재 상태를 기준으로 서버가 결정합니다. 해지 확정 전에는 처리
          결과가 반영되지 않습니다.
        </p>
      </aside>
      <section v-else class="ui-note" role="status">
        <p>현재 구독 상태에서는 해지 요청을 보낼 수 없습니다.</p>
      </section>
      <section v-if="confirming" class="confirmation-card" role="alert">
        <h2>해지를 확정할까요?</h2>
        <p>확정하면 서버가 해지 가능 여부, 종료 시점, 환불 결과를 처리합니다.</p>
        <p v-if="errorMessage" class="cancellation-error">{{ errorMessage }}</p>
        <div class="ui-actions ui-actions--end">
          <button class="button button-secondary" type="button" @click="confirming = false">
            취소
          </button>
          <button
            class="button button-primary"
            type="button"
            :disabled="cancellationStore.status === 'loading'"
            @click="submit"
          >
            {{ cancellationStore.status === 'loading' ? '해지 처리 중…' : '해지 확정' }}
          </button>
        </div>
      </section>
      <div v-else-if="canCancel" class="ui-actions ui-actions--end">
        <button class="button button-primary" type="button" @click="confirming = true">
          구독 해지하기
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cancellation-page,
.result-card,
.confirmation-card {
  display: grid;
  gap: 20px;
}
.cancellation-page {
  padding-block: 36px 64px;
}
.result-card,
.confirmation-card {
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.result-card h2,
.result-card h3,
.confirmation-card h2 {
  margin: 0;
}
.result-card dl {
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.result-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}
.result-card dt {
  color: var(--color-text-muted);
}
.result-card dd {
  margin: 0;
  font-weight: 800;
  text-align: right;
}
.cancellation-result svg {
  color: var(--color-primary-pressed);
}
.cancellation-error {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #9e3825;
}
@media (max-width: 540px) {
  .result-card dl div {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .result-card dd {
    text-align: left;
  }
}
</style>
