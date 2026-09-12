<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, Minus, Plus, Truck } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import {
  formatSubscriptionAddress,
  subscriptionStatusLabel,
} from '../currentSubscriptionDisplay.js'
import {
  createFirstSubscriptionRequest,
  DELIVERY_TIME_SLOTS,
  DELIVERY_WEEKDAYS,
  DELIVERY_WEEKDAY_LABELS,
} from '../firstSubscriptionForm.js'
import { useAddressStore } from '../stores/useAddressStore.js'
import { useFirstSubscriptionStore } from '../stores/useFirstSubscriptionStore.js'
import { usePlanStore } from '../stores/usePlanStore.js'

const props = defineProps({ step: { type: Number, required: true } })
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()
const application = useFirstSubscriptionStore()
const planStore = usePlanStore()
const validationMessage = computed(
  () => application.error?.serverMessage || application.error?.message || '',
)
const planId = computed(() => (typeof route.query.planId === 'string' ? route.query.planId : ''))
const plan = computed(() => planStore.planById(application.planId))
const addresses = computed(() => addressStore.addresses)
const addressById = computed(
  () => new Map(addresses.value.map((address) => [address.addressId, address])),
)
const steps = ['배송 요일', '배송지', '식사·시간', '약관·견적', '신청']
const hasAcceptedAllTerms = computed(
  () =>
    application.requiredTerms.length > 0 &&
    application.requiredTerms.every((term) => application.agreedTerms[term.termsType]),
)

function flowQuery() {
  return application.planId ? { planId: application.planId } : {}
}

function navigate(name) {
  router.push({ name, query: flowQuery() })
}

async function initialize() {
  if (!planId.value) return
  application.begin(planId.value)
  await planStore.fetchPlan(planId.value)
  if (props.step >= 2) {
    await addressStore.fetchAddresses()
    application.applyDefaultAddress(
      addresses.value.find((address) => address.isDefault)?.addressId ||
        addresses.value[0]?.addressId,
    )
  }
  if (props.step >= 4) await application.fetchRequiredTerms()
}

watch([planId, () => props.step], initialize, { immediate: true })

function toggleWeekday(weekday) {
  const selected = application.deliveryConditions.map((condition) => condition.weekday)
  application.setDeliveryWeekdays(
    selected.includes(weekday)
      ? selected.filter((value) => value !== weekday)
      : DELIVERY_WEEKDAYS.filter((value) => [...selected, weekday].includes(value)),
  )
}

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
    application.error = error
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
  application.error = null
  if (props.step === 1) {
    if (!application.deliveryConditions.length) {
      application.error = new Error('배송 요일을 한 개 이상 선택해 주세요.')
      return
    }
    navigate('wf-014')
  } else if (props.step === 2) {
    if (!addresses.value.length)
      application.error = new Error('구독에 사용할 배송지를 먼저 등록해 주세요.')
    else if (requestOrMessage()) navigate('wf-015')
  } else if (props.step === 3 && requestOrMessage()) {
    navigate('wf-016')
  }
}

async function requestPreview() {
  application.error = null
  const request = requestOrMessage()
  if (!request) return
  if (!hasAcceptedAllTerms.value) {
    application.error = new Error('모든 필수 약관에 동의해 주세요.')
    return
  }
  try {
    await application.agreeRequiredTerms()
  } catch (error) {
    application.error = error
    if (error?.code === 'TERMS_VERSION_MISMATCH') await application.fetchRequiredTerms(true)
    return
  }
  if (await application.requestPreview(request)) navigate('wf-017')
}

async function submit() {
  application.error = null
  const request = requestOrMessage()
  if (!request || !application.preview) {
    application.error = new Error('예상 결제금액을 먼저 확인해 주세요.')
    return
  }
  try {
    await application.agreeRequiredTerms()
  } catch (error) {
    application.error = error
    if (error?.code === 'TERMS_VERSION_MISMATCH') await application.fetchRequiredTerms(true)
    return
  }
  if (await application.submit(request)) navigate('wf-018')
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
            class="button button-primary"
            type="button"
            @click="router.push({ name: 'plans' })"
          >
            플랜 목록
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
                  '필수 약관과 예상 결제금액을 확인해 주세요.',
                  '구독 신청 내용을 최종 확인해 주세요.',
                ][step - 1]
              }}
            </h1>
            <p>
              {{ plan.name }}의 1~31번 고정 메뉴는 안내용이며, 별도로 선택하거나 전송하지 않습니다.
            </p>
          </header>
          <section v-if="step === 1" class="flow-panel">
            <div class="weekday-picker" role="group" aria-label="반복 배송 요일">
              <button
                v-for="weekday in DELIVERY_WEEKDAYS"
                :key="weekday"
                class="weekday-button"
                :class="{
                  'is-selected': application.deliveryConditions.some(
                    (item) => item.weekday === weekday,
                  ),
                }"
                type="button"
                :aria-pressed="
                  application.deliveryConditions.some((item) => item.weekday === weekday)
                "
                @click="toggleWeekday(weekday)"
              >
                {{ DELIVERY_WEEKDAY_LABELS[weekday].replace('요일', '') }}
              </button>
            </div>
            <p class="flow-help">
              월요일부터 토요일 중 필요한 요일만 선택할 수 있습니다. 최소 선택 일수는 없습니다.
            </p>
            <section class="fixed-menu-note">
              <h2>고정 메뉴 안내</h2>
              <p>
                {{ plan.menus.length }}개 메뉴가 날짜 순번에 맞춰 제공됩니다. 메뉴·수량 선택은 구독
                요청에 포함되지 않습니다.
              </p>
            </section>
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
              <h2>서버 예상 결제금액</h2>
              <dl>
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
                  <dt>식사 금액</dt>
                  <dd>{{ formatCurrency(application.preview?.totalMealAmount) }}</dd>
                </div>
                <div>
                  <dt>배송비</dt>
                  <dd>{{ formatCurrency(application.preview?.totalDeliveryFee) }}</dd>
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
              <p>
                첫 결제와 이후 정기결제에는 서버에 설정된 현재 자동결제수단이 사용됩니다. 이
                신청에서는 결제수단을 선택하거나 결제수단 ID를 전송하지 않습니다.
              </p>
              <button
                class="button button-outline"
                type="button"
                @click="router.push({ name: 'wf-030' })"
              >
                결제수단 관리
              </button>
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
              @click="goPrevious"
            >
              이전</button
            ><button v-if="step <= 3" class="button button-primary" type="button" @click="goNext">
              다음</button
            ><button
              v-else-if="step === 4"
              class="button button-primary"
              type="button"
              :disabled="
                application.termsStatus === 'loading' || application.previewStatus === 'loading'
              "
              @click="requestPreview"
            >
              예상 결제금액 확인</button
            ><button
              v-else-if="step === 5"
              class="button button-primary"
              type="button"
              :disabled="application.submitStatus === 'loading'"
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
