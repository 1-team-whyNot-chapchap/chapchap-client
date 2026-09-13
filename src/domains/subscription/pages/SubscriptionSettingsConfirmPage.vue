<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Info } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { createSettingChangeComparison } from '../settingChangeComparison.js'
import { useAddressStore } from '../stores/useAddressStore.js'
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
const addressStore = useAddressStore()
const comparison = computed(() =>
  currentStore.status === 'success' && addressStore.listStatus === 'success'
    ? createSettingChangeComparison(
        currentStore.subscription,
        changeStore,
        planStore.plans,
        addressStore.addresses,
      )
    : null,
)
const errorMessage = computed(
  () => changeStore.error?.serverMessage || changeStore.error?.message || '',
)
const currency = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`
const differenceLabel = (type) =>
  ({ INCREASE: '추가 결제', DECREASE: '환불', NO_PRICE_CHANGE: '차액 없음' })[type] || '확인 필요'
const expectedDifferenceLabel = (type) =>
  ({ INCREASE: '추가 결제 예상액', DECREASE: '환불 예상액', NO_PRICE_CHANGE: '차액 없음' })[type] ||
  '확인 필요'
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
    <PageBackButton v-if="!result" to="/subscription/settings" label="설정 변경" />
    <section v-if="(!preview || !comparison) && !result" class="ui-empty">
      <h1>확인할 변경 내용이 없어요.</h1>
      <button class="button button-primary" type="button" @click="router.push({ name: 'wf-024' })">
        설정 변경하기
      </button>
    </section>
    <template v-else-if="!result"
      ><header class="ui-heading">
        <div>
          <h1>구독 변경 확인</h1>
        </div>
      </header>
      <section class="confirm-card">
        <h2>구독 정보</h2>
        <dl>
          <div>
            <dt>적용 시작일</dt>
            <dd>{{ preview.effectiveStartDate }}</dd>
          </div>
        </dl>
        <article v-for="group in comparison" :key="group.key" class="comparison-group">
          <header v-if="group.key !== 'plan'">
            <h3>{{ group.title }}</h3>
            <span v-if="group.status !== 'kept'" class="change-badge">
              {{ group.status === 'added' ? '추가' : '제외' }}
            </span>
          </header>
          <dl>
            <div v-for="item in group.fields" :key="item.key">
              <dt>{{ item.label }}</dt>
              <dd class="comparison-value">
                <template v-if="item.changed">
                  <span v-if="item.before !== null" class="old-value"
                    ><small>기존</small> <del>{{ item.before }}</del></span
                  >
                  <span v-if="item.before !== null && item.after !== null" aria-hidden="true"
                    >→</span
                  >
                  <span v-if="item.after !== null" class="new-value"
                    ><small>{{ group.status === 'added' ? '추가' : '변경' }}</small>
                    {{ item.after }}</span
                  >
                </template>
                <span v-else>{{ item.before }}</span>
              </dd>
            </div>
          </dl>
        </article>
      </section>
      <section class="confirm-card price-card">
        <h2>변경 시 예상 금액</h2>
        <dl>
          <div>
            <dt>변경 대상 기존 금액</dt>
            <dd>{{ currency(preview.currentAmount) }}</dd>
          </div>
          <div>
            <dt>변경 후 예상 금액</dt>
            <dd>{{ currency(preview.changedAmount) }}</dd>
          </div>
          <div class="price-total">
            <dt>{{ expectedDifferenceLabel(preview.differenceType) }}</dt>
            <dd>{{ currency(preview.differenceAmount) }}</dd>
          </div>
        </dl>
        <p class="price-notice">변경 확정 시점에 따라 적용일과 예상 금액이 달라질 수 있습니다.</p>
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
.comparison-group {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.comparison-group header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.comparison-group h3 {
  margin: 0;
  font-size: 16px;
}
.comparison-group dt {
  flex: 0 0 90px;
}
.comparison-group dd {
  min-width: 0;
  overflow-wrap: anywhere;
}
.comparison-value {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.comparison-value small {
  font-size: var(--font-caption);
  font-weight: 500;
}
.old-value {
  color: var(--color-text-muted);
  font-weight: 500;
}
.new-value {
  color: var(--color-primary-pressed);
}
.change-badge {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 700;
}
.price-notice {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
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
  .confirm-card dl div {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .confirm-card dd {
    text-align: left;
  }
  .comparison-group dt {
    flex-basis: auto;
  }
  .comparison-value {
    justify-content: flex-start;
  }
}
</style>
