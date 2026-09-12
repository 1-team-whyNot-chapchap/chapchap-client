<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Info } from 'lucide-vue-next'
import { DELIVERY_TIME_SLOTS, DELIVERY_WEEKDAY_LABELS } from '../firstSubscriptionForm.js'
import { createSettingChangeRequest } from '../settingChangeForm.js'
import { useCurrentSubscriptionStore } from '../stores/useCurrentSubscriptionStore.js'
import { useOrderStore } from '../stores/useOrderStore.js'
import { usePlanStore } from '../stores/usePlanStore.js'
import { useSettingChangeStore } from '../stores/useSettingChangeStore.js'

const router = useRouter(),
  currentStore = useCurrentSubscriptionStore(),
  orderStore = useOrderStore(),
  planStore = usePlanStore(),
  changeStore = useSettingChangeStore()
const preview = computed(() => changeStore.preview),
  result = computed(() => changeStore.result)
const planName = computed(() => planStore.planById(changeStore.planId)?.name || '선택한 플랜')
const errorMessage = computed(
  () => changeStore.error?.serverMessage || changeStore.error?.message || '',
)
const currency = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`
const differenceLabel = (type) =>
  ({ INCREASE: '추가 결제', DECREASE: '환불', NO_PRICE_CHANGE: '차액 없음' })[type] || '확인 필요'
const actionMessage = (action) =>
  ({
    ADDITIONAL_PAYMENT: '현재 자동결제수단으로 차액을 결제합니다.',
    REFUND: '기존 원 결제를 취소하여 환불합니다.',
    NONE: '추가 결제나 환불 없이 변경합니다.',
  })[action] || '최종 처리 결과를 확인해 주세요.'
async function submit() {
  let request
  try {
    request = createSettingChangeRequest(changeStore.planId, changeStore.deliveryConditions)
  } catch (error) {
    changeStore.error = error
    return
  }
  if (await changeStore.submit(request))
    await Promise.all([currentStore.fetchCurrentSubscription(true), orderStore.fetchOrders(true)])
}
</script>

<template>
  <section class="workspace-ui setting-confirm-page">
    <button
      v-if="!result"
      class="button button-secondary"
      type="button"
      @click="router.push({ name: 'wf-024' })"
    >
      설정 변경으로
    </button>
    <section v-if="!preview && !result" class="ui-empty">
      <h1>확인할 변경 내용이 없어요.</h1>
      <button class="button button-primary" type="button" @click="router.push({ name: 'wf-024' })">
        설정 변경하기
      </button>
    </section>
    <template v-else-if="!result"
      ><header class="ui-heading">
        <div>
          <h1>변경 내용을 확인하세요.</h1>
          <p>최종 실행 시 서버가 최신 상태로 다시 계산합니다.</p>
        </div>
      </header>
      <section class="confirm-card">
        <h2>변경 설정</h2>
        <dl>
          <div>
            <dt>변경 플랜</dt>
            <dd>{{ planName }}</dd>
          </div>
          <div>
            <dt>적용 시작일</dt>
            <dd>{{ preview.effectiveStartDate }}</dd>
          </div>
        </dl>
        <ul>
          <li v-for="condition in changeStore.deliveryConditions" :key="condition.weekday">
            <strong>{{ DELIVERY_WEEKDAY_LABELS[condition.weekday] }}</strong
            ><span
              >{{ condition.mealQuantity }}식 ·
              {{
                DELIVERY_TIME_SLOTS.find((slot) => slot.value === condition.deliveryTimeSlot)?.label
              }}</span
            >
          </li>
        </ul>
      </section>
      <section class="confirm-card price-card">
        <h2>서버 계산 결과</h2>
        <dl>
          <div>
            <dt>기존 주문 금액</dt>
            <dd>{{ currency(preview.currentAmount) }}</dd>
          </div>
          <div>
            <dt>변경 후 금액</dt>
            <dd>{{ currency(preview.changedAmount) }}</dd>
          </div>
          <div class="price-total">
            <dt>{{ differenceLabel(preview.differenceType) }}</dt>
            <dd>{{ currency(preview.differenceAmount) }}</dd>
          </div>
        </dl>
      </section>
      <aside class="ui-note">
        <Info :size="20" aria-hidden="true" />
        <p>
          {{ actionMessage(preview.requiredAction) }} 미리보기는 저장·결제·환불을 실행하지 않습니다.
        </p>
      </aside>
      <p v-if="errorMessage" class="setting-error" role="alert">{{ errorMessage }}</p>
      <div class="ui-actions ui-actions--end">
        <button
          class="button button-primary"
          type="button"
          :disabled="changeStore.submitStatus === 'loading'"
          @click="submit"
        >
          {{ changeStore.submitStatus === 'loading' ? '변경 처리 중…' : '변경 확정' }}
        </button>
      </div></template
    >
    <section v-else class="ui-empty result" role="status">
      <CheckCircle2 :size="48" aria-hidden="true" />
      <h1>설정 변경 결과를 확인하세요.</h1>
      <p>
        {{ result.effectiveStartDate }}부터 적용됩니다. {{ differenceLabel(result.differenceType) }}
        {{ currency(result.differenceAmount) }}
      </p>
      <p v-if="result.refund">
        환불 요청 {{ currency(result.refund.requestedAmount) }} · 완료
        {{ currency(result.refund.refundedAmount) }} · 미처리
        {{ currency(result.refund.unprocessedAmount) }}
      </p>
      <p v-else-if="result.paymentConfirmationRequired && result.currentPaymentMethod">
        {{ result.currentPaymentMethod.cardCompany || '현재 자동결제수단' }}
        {{ result.currentPaymentMethod.maskedCardNumber || '' }}으로 처리했습니다.
      </p>
      <button
        class="button button-primary"
        type="button"
        @click="router.push({ name: 'subscription' })"
      >
        내 구독에서 확인하기
      </button>
    </section>
  </section>
</template>

<style scoped>
.setting-confirm-page {
  display: grid;
  gap: 20px;
  padding-block: 36px 64px;
}
.confirm-card {
  display: grid;
  gap: 18px;
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.confirm-card h2 {
  margin: 0;
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
}
.confirm-card li span {
  color: var(--color-text-muted);
}
.price-total dt,
.price-total dd {
  color: var(--color-primary-pressed);
}
.setting-error {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #9e3825;
}
.result svg {
  color: var(--color-primary-pressed);
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
