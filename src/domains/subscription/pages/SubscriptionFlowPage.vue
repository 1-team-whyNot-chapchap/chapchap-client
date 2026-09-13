<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, Minus, Plus, Truck } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import {
  formatSubscriptionAddress,
  subscriptionStatusLabel,
} from '../currentSubscriptionDisplay.js'
import {
  createFirstSubscriptionRequest,
  firstSubscriptionStepIssue,
  DELIVERY_TIME_SLOTS,
  DELIVERY_WEEKDAY_LABELS,
} from '../firstSubscriptionForm.js'
import { useAddressStore } from '../stores/useAddressStore.js'
import { useFirstSubscriptionStore } from '../stores/useFirstSubscriptionStore.js'
import { usePlanStore } from '../stores/usePlanStore.js'
import PaymentMethodPanel from '../components/PaymentMethodPanel.vue'
import SubscriptionScheduleSelector from '../components/SubscriptionScheduleSelector.vue'

const props = defineProps({ step: { type: Number, required: true } })
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()
const application = useFirstSubscriptionStore()
const planStore = usePlanStore()
const paymentPanel = ref(null)
const paymentReady = ref(false)
const checkingPayment = ref(false)
const agreeingTerms = ref(false)
const entryStatus = ref('checking')
const entryError = ref('')
let initialization = 0
let mounted = true
onBeforeUnmount(() => {
  mounted = false
  initialization += 1
  application.invalidatePreview()
  application.enterStep(null)
})
const validationMessage = computed(() =>
  application.errorStep === props.step
    ? application.error?.serverMessage || application.error?.message || ''
    : '',
)
const planId = computed(() => (typeof route.query.planId === 'string' ? route.query.planId : ''))
const plan = computed(() => planStore.planById(application.planId))
const addresses = computed(() => addressStore.addresses)
const addressById = computed(
  () => new Map(addresses.value.map((address) => [address.addressId, address])),
)
const steps = ['배송 요일', '배송지', '식사·시간', '신청 정보·약관', '예상 금액·결제']
const previewReady = computed(
  () => application.previewStatus === 'success' && Boolean(application.preview),
)
const hasAcceptedAllTerms = computed(
  () =>
    application.termsStatus === 'success' &&
    application.requiredTerms.length > 0 &&
    application.requiredTerms.every((term) => application.agreedTerms[term.termsType]),
)

function flowQuery() {
  return application.planId ? { planId: application.planId } : {}
}

function navigate(name) {
  router.push({ name, query: flowQuery() })
}

async function redirectIssue(issue) {
  application.setError(new Error(issue.message), issue.step, 'redirect')
  await router.replace({ name: `wf-0${12 + issue.step}`, query: flowQuery() })
}

async function initialize(force = false) {
  if (planId.value) application.begin(planId.value)
  application.enterStep(props.step)
  const current = ++initialization
  const session = application.session
  const active = () => mounted && current === initialization && session === application.session
  entryStatus.value = 'checking'
  entryError.value = ''
  paymentReady.value = false
  application.invalidatePreview()
  if (!planId.value) return
  await planStore.fetchPlan(planId.value, force)
  if (!active()) return
  if (planStore.detailStatuses[planId.value] !== 'success') return
  const weekdayIssue =
    props.step <= 5 ? firstSubscriptionStepIssue(Math.min(props.step, 2), application) : null
  if (weekdayIssue) return redirectIssue(weekdayIssue)
  if (props.step >= 2) {
    await addressStore.fetchAddresses(props.step <= 5)
    if (!active()) return
    if (props.step <= 5 && !['success', 'empty'].includes(addressStore.listStatus)) {
      entryStatus.value = 'error'
      entryError.value = '배송지를 불러오지 못했습니다. 다시 시도해 주세요.'
      return
    }
    // 배송지 입력 화면에서만 기본값을 채운다. URL 진입 검사에서 누락을 숨기지 않는다.
    if (props.step === 2 || props.step > 5) {
      application.applyDefaultAddress(
        addresses.value.find((address) => address.isDefault)?.addressId ||
          addresses.value[0]?.addressId,
      )
    }
  }
  const inputIssue = firstSubscriptionStepIssue(
    Math.min(props.step, 4),
    application,
    addresses.value,
  )
  if (props.step <= 5 && inputIssue) return redirectIssue(inputIssue)
  if (props.step >= 4) await application.fetchRequiredTerms()
  if (!active()) return
  const issue = firstSubscriptionStepIssue(props.step, application, addresses.value)
  if (issue) return redirectIssue(issue)
  entryStatus.value = 'ready'
  if (props.step === 5) await requestPreview()
}

watch(
  () => application.session,
  () => {
    initialization += 1
    entryStatus.value = 'checking'
    paymentReady.value = false
  },
  { flush: 'sync' },
)
watch([planId, () => props.step], () => initialize(), { immediate: true })

// 입력값이 바뀌었을 때만 재검사한다. 서버 실패나 이동 직후의 안내를 무조건 지우지 않는다.
watch(
  [() => application.deliveryConditions, () => application.agreedTerms],
  () => {
    if (application.errorKind !== 'validation' || application.errorStep !== props.step) return
    if (props.step === 4) {
      if (hasAcceptedAllTerms.value) application.clearError()
    } else if (props.step <= 3) {
      const issue = firstSubscriptionStepIssue(props.step + 1, application, addresses.value)
      if (issue) application.setError(new Error(issue.message), props.step, 'validation')
      else application.clearError()
    }
  },
  { deep: true },
)

function updateCondition(weekday, changes) {
  application.updateDeliveryCondition(weekday, changes)
}

function changeQuantity(weekday, offset) {
  const condition = application.deliveryConditions.find((item) => item.weekday === weekday)
  if (condition)
    updateCondition(weekday, {
      mealQuantity: Math.min(6, Math.max(1, condition.mealQuantity + offset)),
    })
}

function selectedAddress(addressId) {
  return addressById.value.get(addressId)
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function formatPeriod(start, end) {
  return start && end ? `${start} ~ ${end}` : '기간 확인 필요'
}

function requestOrMessage() {
  try {
    return createFirstSubscriptionRequest(application.planId, application.deliveryConditions)
  } catch (error) {
    application.setError(error, props.step, 'validation')
    return null
  }
}

function goPrevious() {
  const previous = { 2: 'wf-013', 3: 'wf-014', 4: 'wf-015', 5: 'wf-016', 6: 'wf-017', 7: 'wf-018' }[
    props.step
  ]
  if (previous) navigate(previous)
  else router.push({ name: 'plans' })
}

function goNext() {
  if (entryStatus.value !== 'ready') return
  application.clearError()
  const issue = firstSubscriptionStepIssue(props.step + 1, application, addresses.value)
  if (issue) {
    application.setError(new Error(issue.message), props.step, 'validation')
    return
  }
  if (props.step >= 1 && props.step <= 3) navigate(`wf-0${13 + props.step}`)
}

async function continueToPayment() {
  if (agreeingTerms.value || props.step !== 4 || entryStatus.value !== 'ready') return
  application.clearError()
  const request = requestOrMessage()
  if (!request) return
  if (!hasAcceptedAllTerms.value) {
    application.setError(new Error('모든 필수 약관에 동의해 주세요.'), 4, 'validation')
    return
  }
  const current = initialization
  agreeingTerms.value = true
  try {
    if (!(await application.agreeRequiredTerms())) return
    if (mounted && props.step === 4 && current === initialization) navigate('wf-017')
  } catch (error) {
    if (!mounted || current !== initialization) return
    application.setError(error, 4)
    if (['TERMS_002', 'TERMS_VERSION_MISMATCH'].includes(error?.code))
      await application.fetchRequiredTerms(true)
  } finally {
    agreeingTerms.value = false
  }
}

async function requestPreview() {
  if (props.step !== 5 || application.previewStatus === 'loading') return
  const request = requestOrMessage()
  if (!request || !hasAcceptedAllTerms.value || !application.termsConfirmed) return
  await application.requestPreview(request)
}

async function submit() {
  if (checkingPayment.value || application.submitStatus === 'loading') return
  application.clearError()
  if (!paymentReady.value) {
    application.setError(new Error('결제에 사용할 현재 결제수단을 먼저 확인해 주세요.'), 5)
    return
  }
  const request = requestOrMessage()
  if (!request || !previewReady.value) {
    application.setError(new Error('예상 결제금액을 먼저 확인해 주세요.'), 5)
    return
  }
  checkingPayment.value = true
  try {
    if (!(await application.agreeRequiredTerms())) return
    if (!(await paymentPanel.value?.verifyCurrent())) return
    if (!mounted || props.step !== 5) return
    if ((await application.submit(request)) && mounted) navigate('wf-018')
  } catch (error) {
    application.setError(error, 5)
    if (['TERMS_002', 'TERMS_VERSION_MISMATCH'].includes(error?.code))
      await application.fetchRequiredTerms(true)
  } finally {
    checkingPayment.value = false
  }
}
</script>

<template>
  <div class="page subscription-flow workspace-ui design-review-page">
    <DesignPreview title="구독">
      <section v-if="!planId" class="ui-empty flow-empty" role="alert">
        <h1>선택한 플랜이 없어요.</h1>
        <p>구독할 플랜을 먼저 선택해 주세요.</p>
        <button class="button button-primary" type="button" @click="router.push({ name: 'plans' })">
          플랜 보러 가기
        </button>
      </section>
      <template v-else>
        <ol v-if="step <= 5" class="subscription-stepper" aria-label="구독 신청 진행 단계">
          <li
            v-for="(label, index) in steps"
            :key="label"
            :class="{ 'is-current': step === index + 1, 'is-done': step > index + 1 }"
            :aria-current="step === index + 1 ? 'step' : undefined"
          >
            {{ label }}
          </li>
        </ol>
        <section
          v-if="planStore.detailStatuses[application.planId] === 'loading'"
          class="ui-empty flow-empty"
          aria-busy="true"
        >
          <h1>플랜 정보를 불러오고 있어요.</h1>
        </section>
        <section
          v-else-if="planStore.detailStatuses[application.planId] === 'error'"
          class="ui-empty flow-empty"
          role="alert"
        >
          <h1>플랜 정보를 확인할 수 없어요.</h1>
          <p>판매 상태를 확인한 뒤 다시 시도해 주세요.</p>
          <button
            v-if="step <= 5"
            class="button button-secondary"
            type="button"
            @click="initialize(true)"
          >
            다시 시도
          </button>
          <button
            class="button button-primary"
            type="button"
            @click="router.push({ name: 'plans' })"
          >
            플랜 목록
          </button>
        </section>
        <section
          v-else-if="step <= 5 && entryStatus === 'checking'"
          class="ui-empty flow-empty"
          aria-busy="true"
        >
          신청 정보를 확인하고 있어요.
        </section>
        <section
          v-else-if="step <= 5 && entryStatus === 'error'"
          class="ui-empty flow-empty"
          role="alert"
        >
          <p>{{ entryError }}</p>
          <button class="button button-secondary" type="button" @click="initialize(true)">
            다시 시도
          </button>
        </section>
        <template v-else-if="plan">
          <header v-if="step <= 5" class="flow-header">
            <p class="section-kicker">{{ step }}단계 · {{ steps[step - 1] }}</p>
            <h1>
              {{
                [
                  '배송받을 요일을 선택해 주세요.',
                  '요일별 배송지를 선택해 주세요.',
                  '식사 수량과 시간을 설정해 주세요.',
                  '신청 정보와 필수 약관을 확인해 주세요.',
                  '예상 결제금액과 결제수단을 확인해 주세요.',
                ][step - 1]
              }}
            </h1>
            <p>
              {{ plan.name }}의 1~31번 고정 메뉴는 안내용이며, 별도로 선택하거나 전송하지 않습니다.
            </p>
          </header>
          <section v-if="step === 1" class="flow-panel">
            <SubscriptionScheduleSelector
              :model-value="application.deliveryConditions.map((item) => item.weekday)"
              :plan="plan"
              @update:model-value="application.setDeliveryWeekdays"
            />
          </section>
          <section v-else-if="step === 2" class="flow-panel">
            <p v-if="addressStore.listStatus === 'loading'" class="flow-help" role="status">
              배송지를 불러오고 있어요.
            </p>
            <template v-else-if="addresses.length">
              <article
                v-for="condition in application.deliveryConditions"
                :key="condition.weekday"
                class="condition-card"
              >
                <h2>{{ DELIVERY_WEEKDAY_LABELS[condition.weekday] }}</h2>
                <label
                  >배송지<select
                    :value="condition.addressId"
                    @change="updateCondition(condition.weekday, { addressId: $event.target.value })"
                  >
                    <option v-if="!selectedAddress(condition.addressId)" value="" disabled>
                      배송지를 선택해 주세요.
                    </option>
                    <option
                      v-for="address in addresses"
                      :key="address.addressId"
                      :value="address.addressId"
                    >
                      {{ address.name }}
                    </option>
                  </select></label
                >
                <p v-if="selectedAddress(condition.addressId)" class="address-preview">
                  {{ formatSubscriptionAddress(selectedAddress(condition.addressId)) }}
                </p>
              </article>
            </template>
            <section v-else class="ui-empty flow-empty">
              <h2>등록된 배송지가 없어요.</h2>
              <p>구독을 신청하려면 배송지를 하나 이상 등록해 주세요.</p>
            </section>
            <button
              class="button button-outline"
              type="button"
              @click="router.push({ name: 'wf-028' })"
            >
              배송지 관리
            </button>
          </section>
          <section v-else-if="step === 3" class="flow-panel">
            <article
              v-for="condition in application.deliveryConditions"
              :key="condition.weekday"
              class="condition-card condition-card--grid"
            >
              <h2>{{ DELIVERY_WEEKDAY_LABELS[condition.weekday] }}</h2>
              <label
                >식사 수량<span class="quantity-control"
                  ><button
                    type="button"
                    :disabled="condition.mealQuantity <= 1"
                    :aria-label="`${DELIVERY_WEEKDAY_LABELS[condition.weekday]} 수량 줄이기`"
                    @click="changeQuantity(condition.weekday, -1)"
                  >
                    <Minus :size="16" /></button
                  ><output>{{ condition.mealQuantity }}식</output
                  ><button
                    type="button"
                    :disabled="condition.mealQuantity >= 6"
                    :aria-label="`${DELIVERY_WEEKDAY_LABELS[condition.weekday]} 수량 늘리기`"
                    @click="changeQuantity(condition.weekday, 1)"
                  >
                    <Plus :size="16" /></button></span
              ></label>
              <label
                >배송 시간대<select
                  :value="condition.deliveryTimeSlot"
                  @change="
                    updateCondition(condition.weekday, { deliveryTimeSlot: $event.target.value })
                  "
                >
                  <option v-for="slot in DELIVERY_TIME_SLOTS" :key="slot.value" :value="slot.value">
                    {{ slot.label }}
                  </option>
                </select></label
              >
            </article>
          </section>
          <section v-else-if="step === 4" class="flow-panel">
            <section class="review-card">
              <h2>신청 설정</h2>
              <dl>
                <div>
                  <dt>플랜</dt>
                  <dd>{{ plan.name }}</dd>
                </div>
                <div v-for="condition in application.deliveryConditions" :key="condition.weekday">
                  <dt>{{ DELIVERY_WEEKDAY_LABELS[condition.weekday] }}</dt>
                  <dd>
                    {{ selectedAddress(condition.addressId)?.name }} ·
                    {{ condition.mealQuantity }}식 ·
                    {{
                      DELIVERY_TIME_SLOTS.find((slot) => slot.value === condition.deliveryTimeSlot)
                        ?.label
                    }}
                  </dd>
                </div>
              </dl>
            </section>
            <section
              v-if="application.termsStatus === 'loading'"
              class="ui-empty flow-empty"
              aria-busy="true"
            >
              필수 약관을 불러오고 있어요.
            </section>
            <section
              v-else-if="application.termsStatus === 'error'"
              class="ui-empty flow-empty"
              role="alert"
            >
              <p>필수 약관을 불러오지 못했습니다.</p>
              <button
                class="button button-secondary"
                type="button"
                @click="application.fetchRequiredTerms(true)"
              >
                다시 시도
              </button>
            </section>
            <section v-else class="review-card">
              <h2>필수 약관</h2>
              <label
                v-for="term in application.requiredTerms"
                :key="`${term.termsType}:${term.version}`"
                class="term-item"
                ><input
                  :checked="application.agreedTerms[term.termsType]"
                  type="checkbox"
                  :disabled="agreeingTerms"
                  @change="application.setTermAgreement(term.termsType, $event.target.checked)"
                /><span
                  ><strong>[필수] {{ term.title }}</strong
                  ><small>{{ term.content }}</small
                  ><small>버전 {{ term.version }}</small></span
                ></label
              >
            </section>
          </section>
          <section v-else-if="step === 5" class="flow-panel">
            <section class="review-card price-card">
              <h2>예상 결제금액</h2>
              <p v-if="application.previewStatus === 'loading'" role="status">
                예상 결제금액을 불러오고 있어요.
              </p>
              <div v-else-if="!previewReady" role="alert">
                <p>예상 결제금액을 확인하지 못했습니다. 다시 조회해 주세요.</p>
                <button class="button button-secondary" type="button" @click="requestPreview">
                  예상 금액 다시 조회
                </button>
              </div>
              <dl v-else>
                <div>
                  <dt>예상 이용 기간</dt>
                  <dd>
                    {{
                      formatPeriod(
                        application.preview?.periodStartDate,
                        application.preview?.periodEndDate,
                      )
                    }}
                  </dd>
                </div>
                <div>
                  <dt>할인 전 구독 금액</dt>
                  <dd>
                    {{
                      formatCurrency(
                        Number(application.preview.totalMealAmount) +
                          Number(application.preview.totalDeliveryFee),
                      )
                    }}
                  </dd>
                </div>
                <div>
                  <dt>할인 금액</dt>
                  <dd>-{{ formatCurrency(application.preview?.totalDiscountAmount) }}</dd>
                </div>
                <div class="price-total">
                  <dt>예상 결제금액</dt>
                  <dd>{{ formatCurrency(application.preview?.paymentAmount) }}</dd>
                </div>
              </dl>
            </section>
            <section class="review-card">
              <h2>자동결제수단</h2>
              <PaymentMethodPanel
                ref="paymentPanel"
                :disabled="checkingPayment || application.submitStatus === 'loading'"
                @ready="paymentReady = $event"
              />
            </section>
          </section>
          <section v-else-if="step === 6" class="flow-result">
            <Truck :size="48" aria-hidden="true" />
            <h1>구독 신청이 접수됐어요.</h1>
            <p>
              {{
                formatPeriod(application.result?.periodStartDate, application.result?.periodEndDate)
              }}
              · {{ subscriptionStatusLabel(application.result?.subscriptionStatus) }}
            </p>
            <p>최종 이용 기간은 신청 처리 결과를 기준으로 합니다.</p>
          </section>
          <section v-else class="flow-result">
            <CheckCircle2 :size="48" aria-hidden="true" />
            <h1>구독 신청을 완료했습니다.</h1>
            <p>내 구독에서 배송 일정과 상태를 확인할 수 있어요.</p>
          </section>
          <p v-if="validationMessage" class="flow-validation" role="alert">
            {{ validationMessage }}
          </p>
          <div class="subscription-actions">
            <button
              v-if="step <= 5"
              class="button button-secondary"
              type="button"
              :disabled="agreeingTerms || checkingPayment || application.submitStatus === 'loading'"
              @click="goPrevious"
            >
              이전</button
            ><button v-if="step <= 3" class="button button-primary" type="button" @click="goNext">
              다음</button
            ><button
              v-else-if="step === 4"
              class="button button-primary"
              type="button"
              :disabled="application.termsStatus !== 'success' || agreeingTerms"
              @click="continueToPayment"
            >
              {{ agreeingTerms ? '약관 동의 처리 중…' : '다음' }}</button
            ><button
              v-else-if="step === 5"
              class="button button-primary"
              type="button"
              :disabled="
                !previewReady ||
                !paymentReady ||
                checkingPayment ||
                application.submitStatus === 'loading'
              "
              @click="submit"
            >
              구독 신청 및 결제</button
            ><button
              v-else-if="step === 6"
              class="button button-primary"
              type="button"
              @click="navigate('wf-019')"
            >
              완료</button
            ><button
              v-else
              class="button button-primary"
              type="button"
              @click="router.push({ name: 'subscription' })"
            >
              내 구독 보기
            </button>
          </div>
        </template>
      </template>
    </DesignPreview>
  </div>
</template>

<style scoped>
.subscription-flow {
  max-width: 760px;
  margin: 0 auto;
}
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
  padding-top: 10px;
  border-top: 3px solid var(--color-border);
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
}
.flow-header {
  display: grid;
  gap: 8px;
  margin-bottom: 28px;
}
.flow-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
}
.flow-header p,
.flow-help {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.flow-panel {
  display: grid;
  gap: 16px;
}
.weekday-picker {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}
.weekday-button {
  min-height: 64px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: 800;
}
.weekday-button.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.fixed-menu-note,
.condition-card,
.review-card {
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.fixed-menu-note h2,
.condition-card h2,
.review-card h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.fixed-menu-note p,
.review-card p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.condition-card label {
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.condition-card select {
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  font: inherit;
}
.address-preview {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
}
.condition-card--grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.condition-card--grid h2 {
  grid-column: 1 / -1;
}
.quantity-control {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 8px;
  padding: 5px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}
.quantity-control button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
}
.quantity-control output {
  min-width: 44px;
  text-align: center;
  font-weight: 800;
}
.review-card dl {
  display: grid;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.review-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-border);
}
.review-card dt {
  color: var(--color-text-muted);
}
.review-card dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}
.term-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: var(--color-primary-soft);
}
.term-item span {
  display: grid;
  gap: 4px;
}
.term-item small {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.price-total dt,
.price-total dd {
  color: var(--color-primary-pressed);
  font-size: var(--font-item-title);
}
.flow-result,
.flow-empty {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 48px 20px;
  text-align: center;
}
.flow-result svg {
  color: var(--color-primary-pressed);
}
.flow-result h1,
.flow-empty h1 {
  margin: 0;
  font-size: var(--font-page-title);
}
.flow-result p,
.flow-empty p {
  margin: 0;
  color: var(--color-text-muted);
}
.flow-validation {
  padding: 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #9e3825;
}
.subscription-actions {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  margin-top: 28px;
}
.subscription-actions .button {
  min-height: 48px;
}
@media (max-width: 540px) {
  .weekday-picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .condition-card--grid {
    grid-template-columns: 1fr;
  }
  .condition-card--grid h2 {
    grid-column: auto;
  }
  .review-card dl div {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .review-card dd {
    text-align: left;
  }
}
</style>
