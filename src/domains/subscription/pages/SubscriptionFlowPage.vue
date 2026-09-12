<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../api/accountDataApi.js'
import { CheckCircle2, Plus, Truck } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'
import {
  MINIMUM_DELIVERY_DATE_COUNT,
  hasMinimumDeliveryDatesForEachWeek,
} from '../../../common/utils/deliveryPolicy'
import SubscriptionScheduleSelector from '../components/SubscriptionScheduleSelector.vue'
import SubscriptionAddressRules from '../components/SubscriptionAddressRules.vue'
import SubscriptionConditionRules from '../components/SubscriptionConditionRules.vue'

const props = defineProps({
  step: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const appStore = useAppStore()

const optionsLoading = ref(false),
  optionsError = ref('')
let active = true
async function loadOptions() {
  optionsLoading.value = true
  optionsError.value = ''
  appStore.addresses = []
  appStore.paymentMethods = []
  try {
    const api = createAccountDataApi(http)
    const [addresses, cards] = await Promise.all([api.addresses(), api.paymentMethods()])
    if (!active) return
    appStore.addresses = addresses
    appStore.paymentMethods = cards
  } catch {
    if (active) optionsError.value = '배송지와 결제수단을 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (active) optionsLoading.value = false
  }
}
onMounted(loadOptions)
onUnmounted(() => {
  active = false
})
const steps = ['일정', '배송지', '인원·시간', '확인', '결제']
const stepHeaders = [
  {
    title: '배송 요일을 선택해주세요',
    description: '선택한 요일에 맞춰 28일간의 배송 일정과 메뉴를 확인하세요.',
  },
  {
    title: '배송지를 설정해주세요',
    description: '요일별 배송지와 수령 방식을 선택해주세요.',
  },
  {
    title: '인원과 시간을 선택해주세요',
    description: '요일별 인원수와 배송 시간대를 설정해주세요.',
  },
  {
    title: '신청 내용을 확인해주세요',
    description: '배송 일정과 설정한 내용을 결제 전에 확인해주세요.',
  },
  {
    title: '결제를 진행해주세요',
    description: '최종 금액과 결제 정보를 확인해주세요.',
  },
]
const currentStepHeader = computed(() => stepHeaders[props.step - 1])
const addresses = computed(() => appStore.addresses)
const deliveryTimeOptions = ['점심 · 11:00~13:00', '저녁 · 17:00~19:00']

// ref는 화면에 보여줄 값이 바뀌면 Vue가 화면도 다시 그리게 만드는 반응형 값입니다.
// 여기서는 단계별 입력이 부족할 때만 안내 문구를 표시하는 데 사용합니다.
const validationMessage = ref('')

const deliveryRuleReviewItems = computed(() =>
  appStore.subscriptionApplication.deliveryRules.map((rule) => ({
    ...rule,
    addressName:
      addresses.value.find((address) => address.id === rule.addressId)?.name || '배송지 미선택',
  })),
)

const hasCompleteDeliverySettings = computed(
  () =>
    deliveryRuleReviewItems.value.length > 0 &&
    deliveryRuleReviewItems.value.every(
      (rule) =>
        rule.addressId &&
        rule.receivingMethod &&
        rule.personCount >= 1 &&
        rule.personCount <= 6 &&
        deliveryTimeOptions.includes(rule.deliveryTime),
    ),
)

const selectedSubscriptionPaymentMethod = computed(
  () =>
    appStore.paymentMethods.find(
      (paymentMethod) =>
        paymentMethod.id === appStore.subscriptionApplication.selectedPaymentMethodId,
    ) || null,
)

const next = {
  1: 'wf-014',
  2: 'wf-015',
  3: 'wf-016',
  4: 'wf-017',
  5: 'wf-018',
  6: 'wf-019',
  7: 'subscription',
}

function goPrevious() {
  emit(
    'navigate',
    props.step > 1
      ? { 2: 'wf-013', 3: 'wf-014', 4: 'wf-015', 5: 'wf-016' }[props.step] || 'subscription'
      : 'plans',
  )
}

function updateDeliveryWeekdays(weekdays) {
  appStore.setSubscriptionDeliveryWeekdays(weekdays)
}

function updateDeliveryRule({ weekday, changes }) {
  appStore.updateSubscriptionDeliveryRule(weekday, changes)
}

function changeDeliveryRulePersonCount({ weekday, change }) {
  appStore.changeSubscriptionDeliveryRulePersonCount(weekday, change)
}

function selectSubscriptionPaymentMethod(paymentMethodId) {
  appStore.selectSubscriptionPaymentMethod(paymentMethodId)
}

function goNext() {
  validationMessage.value = ''
  if (props.step >= 5) {
    validationMessage.value = '견적·결제 연결 전에는 신청을 확정할 수 없어요.'
    return
  }

  if (
    props.step === 1 &&
    !hasMinimumDeliveryDatesForEachWeek(appStore.subscriptionApplication.deliveryDays)
  ) {
    validationMessage.value = '매주 배송받을 요일을 3일 이상 선택해주세요.'
    return
  }

  if (props.step === 3 && !hasCompleteDeliverySettings.value) {
    validationMessage.value = '선택한 모든 요일의 인원수와 배송 시간대를 설정해주세요.'
    return
  }

  if (props.step === 4 && !hasCompleteDeliverySettings.value) {
    validationMessage.value = '요일별 배송 설정을 모두 완료해주세요.'
    return
  }

  if (props.step === 4 && !appStore.subscriptionApplication.isNonFaceToFaceStorageAgreed) {
    validationMessage.value = '비대면 보관 필수 약관에 동의해주세요.'
    return
  }

  if (props.step === 5 && !selectedSubscriptionPaymentMethod.value) {
    validationMessage.value = '결제수단을 선택해주세요.'
    return
  }

  if (
    props.step === 2 &&
    (!appStore.subscriptionApplication.deliveryRules.length ||
      appStore.subscriptionApplication.deliveryRules.some(
        (rule) => !rule.addressId || !rule.receivingMethod,
      ))
  ) {
    validationMessage.value = '선택한 모든 요일에 배송지와 수령 방식을 지정해주세요.'
    return
  }

  emit('navigate', next[props.step])
}
</script>

<template>
  <div class="page subscription-flow workspace-ui design-review-page">
    <p v-if="optionsLoading" role="status">배송지와 결제수단을 불러오고 있어요.</p>
    <div v-if="optionsError" class="ui-note" role="alert">
      <p>{{ optionsError }}</p>
      <button class="button button-secondary" @click="loadOptions">다시 시도</button>
    </div>
    <DesignPreview title="구독">
      <ol class="subscription-stepper" aria-label="구독 신청 진행 단계">
        <li
          v-for="(item, index) in steps"
          :key="item"
          :aria-current="index + 1 === step ? 'step' : undefined"
          :class="{
            'is-current': index + 1 === step,
            'is-done': index + 1 < step,
          }"
        >
          {{ item }}
        </li>
      </ol>

      <header v-if="currentStepHeader" class="flow-header">
        <p class="section-kicker">{{ step }}단계 · {{ steps[step - 1] }}</p>
        <h1>{{ currentStepHeader.title }}</h1>
        <p class="flow-header__description">{{ currentStepHeader.description }}</p>
      </header>

      <section v-if="step === 1" class="flow-panel">
        <SubscriptionScheduleSelector
          :model-value="appStore.subscriptionApplication.deliveryWeekdays"
          @update:model-value="updateDeliveryWeekdays"
        />
        <p class="form-help">
          현재 신청 기준으로 배송 요일을 최소 {{ MINIMUM_DELIVERY_DATE_COUNT }}일 선택해주세요.
          <strong
            >{{ appStore.subscriptionApplication.deliveryWeekdays.length }} /
            {{ MINIMUM_DELIVERY_DATE_COUNT }}일 선택</strong
          >
        </p>
      </section>

      <section v-else-if="step === 2" class="flow-panel">
        <p class="delivery-rule-example">
          <strong>설정 예시</strong>
          <span>월요일은 집·문 앞 배송, 수요일은 회사·직접 전달처럼 지정할 수 있어요.</span>
        </p>
        <SubscriptionAddressRules
          v-if="appStore.subscriptionApplication.deliveryRules.length"
          :rules="appStore.subscriptionApplication.deliveryRules"
          :addresses="addresses"
          @update-rule="updateDeliveryRule"
        />
        <p v-else class="form-help" role="status">배송 요일을 먼저 선택해주세요.</p>
        <div class="flow-inline-action">
          <p>등록한 배송지 중에서 요일별로 선택할 수 있어요.</p>
          <button class="button button-outline" type="button" @click="emit('navigate', 'wf-028')">
            배송지 관리
          </button>
        </div>
      </section>

      <section v-else-if="step === 3" class="flow-panel">
        <p class="flow-helper">
          각 요일은 1~6명이며, 점심 또는 저녁 시간대 중 하나를 선택할 수 있어요.
        </p>
        <SubscriptionConditionRules
          v-if="appStore.subscriptionApplication.deliveryRules.length"
          :rules="appStore.subscriptionApplication.deliveryRules"
          :addresses="addresses"
          @change-person-count="changeDeliveryRulePersonCount"
          @update-rule="updateDeliveryRule"
        />
        <p v-else class="form-help" role="status">배송 요일과 배송지를 먼저 설정해주세요.</p>
        <p class="flow-helper">
          수량과 배송 가능 여부는 신청 전 서버 확인 결과를 기준으로 안내됩니다.
        </p>
      </section>

      <section v-else-if="step === 4" class="flow-panel">
        <section
          class="review-section review-section--settings"
          aria-labelledby="review-setting-title"
        >
          <div class="review-section__heading">
            <h2 id="review-setting-title">구독 설정</h2>
            <p>28일 동안 아래 요일별 설정으로 배송됩니다.</p>
          </div>
          <dl class="review-overview">
            <div>
              <dt>플랜</dt>
              <dd>{{ planLabels[appStore.selectedPlan] }} · 가격 미정</dd>
            </div>
            <div>
              <dt>배송 요일</dt>
              <dd>
                {{
                  deliveryRuleReviewItems.map((rule) => rule.label.replace('요일', '')).join(' · ')
                }}
              </dd>
            </div>
          </dl>
          <dl class="review-rule-list">
            <div v-for="rule in deliveryRuleReviewItems" :key="rule.weekday">
              <dt>{{ rule.label }}</dt>
              <dd>
                <strong>{{ rule.addressName }} · {{ rule.receivingMethod }}</strong>
                <span>{{ rule.personCount }}명 · {{ rule.deliveryTime }}</span>
                <small v-if="rule.deliveryNote">메모: {{ rule.deliveryNote }}</small>
              </dd>
            </div>
          </dl>
        </section>

        <section class="review-section" aria-labelledby="review-agreement-title">
          <div class="review-section__heading">
            <h2 id="review-agreement-title">비대면 보관 필수 약관</h2>
            <p>동의하지 않으면 구독·주문·결제를 생성할 수 없어요.</p>
          </div>
          <label class="terms-confirmation">
            <input
              v-model="appStore.subscriptionApplication.isNonFaceToFaceStorageAgreed"
              type="checkbox"
            />
            <span>
              <strong
                >[필수] 고객 부재 시 안전한 장소에 비대면 보관될 수 있음을 확인했습니다.</strong
              >
              <small>현재 적용 약관의 내용과 버전은 서버 연결 후 조회됩니다.</small>
            </span>
          </label>
        </section>

        <section class="review-price" aria-label="예상 첫 결제 안내">
          <div>
            <span>예상 첫 결제</span>
            <strong>결제 직전 서버에서 확정</strong>
          </div>
          <p>배송비와 최종 금액은 서버 견적 결과를 기준으로 안내됩니다.</p>
        </section>
      </section>

      <section v-else-if="step === 5" class="flow-panel">
        <p class="flow-helper">
          첫 결제와 이후 정기결제에는 등록·검증된 자동결제수단을 사용합니다.
        </p>
        <section class="payment-method-list" aria-labelledby="payment-method-title">
          <h2 id="payment-method-title">등록된 결제수단</h2>
          <label
            v-for="paymentMethod in appStore.paymentMethods"
            :key="paymentMethod.id"
            class="payment-method-choice"
            :class="{
              'is-selected': selectedSubscriptionPaymentMethod?.id === paymentMethod.id,
            }"
          >
            <input
              :checked="selectedSubscriptionPaymentMethod?.id === paymentMethod.id"
              :value="paymentMethod.id"
              name="subscription-payment-method"
              type="radio"
              @change="selectSubscriptionPaymentMethod(paymentMethod.id)"
            />
            <span>
              <strong
                >{{ paymentMethod.brand }}{{ paymentMethod.isDefault ? ' · 기본' : '' }}</strong
              >
              <small>끝 4자리 {{ paymentMethod.lastFourDigits }} · 사용 가능</small>
            </span>
            <CheckCircle2
              v-if="selectedSubscriptionPaymentMethod?.id === paymentMethod.id"
              :size="20"
              aria-hidden="true"
            />
          </label>
          <p v-if="!appStore.paymentMethods.length" class="form-help" role="status">
            등록된 카드가 없습니다. 카드 등록 후 결제 수단을 선택해주세요.
          </p>
          <button
            class="button button-outline"
            type="button"
            @click="emit('navigate', 'payment-method-register')"
          >
            <Plus :size="18" aria-hidden="true" />
            카드 등록하기
          </button>
        </section>

        <section class="payment-check" aria-labelledby="payment-check-title">
          <h2 id="payment-check-title">결제 전 확인</h2>
          <dl>
            <div>
              <dt>플랜</dt>
              <dd>{{ planLabels[appStore.selectedPlan] }}</dd>
            </div>
            <div>
              <dt>결제 대상</dt>
              <dd>첫 28일 이용기간</dd>
            </div>
            <div>
              <dt>최종 결제</dt>
              <dd>결제 직전 서버에서 확정</dd>
            </div>
          </dl>
          <p>카드 원문·빌링키·외부 결제 응답 원문은 고객 화면에 표시하지 않습니다.</p>
        </section>
        <label class="flow-check">
          <input v-model="appStore.subscriptionApplication.isAutoPaymentAgreed" type="checkbox" />
          <span>
            <strong>다음 정기결제 자동결제 동의 (선택)</strong>
            <small>선택하지 않아도 다음 단계로 이동할 수 있습니다.</small>
          </span>
        </label>
        <p class="payment-disclosure">결제 승인과 실제 청구는 결제 서비스 연결 후 처리됩니다.</p>
      </section>

      <section v-else class="flow-panel flow-result">
        <Truck v-if="step === 6" :size="48" />
        <CheckCircle2 v-else :size="48" />
        <h1>
          {{ step === 6 ? '결제 연결을 준비하고 있어요.' : '아직 신청이 완료되지 않았어요.' }}
        </h1>
        <p>
          {{
            step === 6
              ? '결제 처리 결과는 서버 응답 후 표시됩니다.'
              : '실제 결제 완료 후 구독 일정이 제공됩니다.'
          }}
        </p>
      </section>

      <p v-if="validationMessage" class="flow-validation" role="alert">
        {{ validationMessage }}
      </p>

      <div class="mobile-action-bar subscription-actions">
        <div class="subscription-actions__summary">
          <span>구독 신청</span>
          <strong>{{ step < 6 ? `${step} / 5 단계` : '완료' }}</strong>
        </div>
        <button class="button button-secondary" type="button" @click="goPrevious">이전으로</button>
        <button class="button button-primary" type="button" :disabled="step >= 5" @click="goNext">
          {{
            step === 1
              ? '다음: 배송지'
              : step === 2
                ? '다음: 인원·시간'
                : step === 3
                  ? '다음: 신청 내용 확인'
                  : step === 4
                    ? '다음: 결제수단'
                    : step === 5
                      ? '견적 연결 후 결제 가능'
                      : '내 구독 보기'
          }}
        </button>
      </div>
    </DesignPreview>
  </div>
</template>

<style scoped>
.subscription-flow {
  max-width: 760px;
  margin: 0 auto;
}

.flow-panel {
  display: grid;
  gap: 20px;
}

.flow-panel h1 {
  font-size: var(--font-page-title);
}

.flow-header {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  margin-bottom: var(--space-6);
  text-align: left;
}

.flow-header h1,
.flow-header p {
  margin: 0;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.flow-header h1 {
  font-size: var(--font-page-title);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-title);
}

.flow-header__description {
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}

.flow-panel label {
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 700;
}

.flow-panel select {
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.review-section {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.review-section__heading {
  display: grid;
  gap: 4px;
}

.review-section--settings {
  gap: 0;
}

.review-section--settings .review-section__heading {
  margin-bottom: var(--space-4);
}

.review-section__heading h2 {
  font-size: var(--font-section-title);
}

.review-section__heading p,
.review-price p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.review-overview,
.review-rule-list {
  display: grid;
  padding: 0;
  margin: 0;
}

.review-overview {
  border-top: 1px solid var(--color-border);
}

.review-overview div,
.review-rule-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.review-overview dt,
.review-rule-list dt {
  flex: 0 0 auto;
  color: var(--color-text-muted);
}

.review-overview dd,
.review-rule-list dd {
  min-width: 0;
  display: grid;
  gap: 4px;
  margin: 0;
  font-weight: 700;
  text-align: right;
}

.review-rule-list strong,
.review-rule-list span,
.review-rule-list small {
  overflow-wrap: anywhere;
}

.review-rule-list span,
.review-rule-list small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 500;
}

.terms-confirmation {
  display: flex !important;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  line-height: var(--line-height-body);
}

.terms-confirmation input {
  flex: 0 0 auto;
  margin-top: 3px;
}

.terms-confirmation span {
  display: grid;
  gap: 4px;
}

.terms-confirmation small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 500;
}

.review-price {
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--color-surface-subtle);
}

.review-price div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.review-price strong {
  text-align: right;
}

.payment-method-list,
.payment-check {
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.payment-method-list h2,
.payment-check h2 {
  font-size: var(--font-section-title);
}

.payment-method-choice {
  display: flex !important;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
}

.payment-method-choice.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.payment-method-choice input {
  flex: 0 0 auto;
}

.payment-method-choice span {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.payment-method-choice small,
.payment-check p,
.payment-disclosure {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.payment-method-choice svg {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--color-primary-pressed);
}

.payment-check dl {
  display: grid;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--color-border);
}

.payment-check dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-border);
}

.payment-check dt {
  color: var(--color-text-muted);
}

.payment-check dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}

.payment-disclosure {
  padding: 14px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}

.flow-check {
  display: flex !important;
  align-items: flex-start;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.flow-check input {
  margin-top: 3px;
}

.flow-check span {
  display: grid;
  gap: 3px;
}

.flow-check strong {
  color: var(--color-text);
}

.flow-check small {
  color: var(--color-text-muted);
}

.flow-helper {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.delivery-rule-example {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 12px 12px 0;
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.delivery-rule-example strong {
  color: var(--color-primary-pressed);
}

.flow-inline-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}

.flow-inline-action p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.flow-result {
  justify-items: center;
  padding: 56px 20px;
  text-align: center;
}

.flow-result svg {
  color: var(--color-primary-pressed);
}

.flow-result p {
  max-width: 380px;
}

@media (max-width: 430px) {
  .review-overview div,
  .review-rule-list div {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 430px) {
  .flow-inline-action {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 430px) {
  .review-overview dd,
  .review-rule-list dd {
    width: 100%;
    text-align: left;
  }

  .payment-check dl div {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .payment-check dd {
    text-align: left;
  }
}
</style>

<style scoped>
.subscription-stepper {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 0;
  margin: 24px 0 32px;
  list-style: none;
}

.subscription-stepper li {
  min-width: 0;
  border-top: 3px solid var(--color-border);
  padding-top: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}

.subscription-stepper .is-done {
  border-color: var(--color-primary);
}
.subscription-stepper .is-current {
  border-color: var(--color-primary-pressed);
  color: var(--color-primary-pressed);
  font-weight: 900;
}
.subscription-actions {
  display: grid;
  align-items: stretch;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  bottom: calc(12px + env(safe-area-inset-bottom));
}
.subscription-actions .subscription-actions__summary {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.subscription-actions .button {
  min-width: 0;
  min-height: 48px;
  white-space: normal;
  word-break: keep-all;
  padding: 12px;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
</style>
