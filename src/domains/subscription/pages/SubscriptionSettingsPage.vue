<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Minus, Plus } from 'lucide-vue-next'
import {
  DELIVERY_TIME_SLOTS,
  DELIVERY_WEEKDAYS,
  DELIVERY_WEEKDAY_LABELS,
} from '../firstSubscriptionForm.js'
import { formatSubscriptionAddress } from '../currentSubscriptionDisplay.js'
import { createSettingChangeRequest } from '../settingChangeForm.js'
import { useAddressStore } from '../stores/useAddressStore.js'
import { useCurrentSubscriptionStore } from '../stores/useCurrentSubscriptionStore.js'
import { usePlanStore } from '../stores/usePlanStore.js'
import { useSettingChangeStore } from '../stores/useSettingChangeStore.js'

const router = useRouter(),
  addressStore = useAddressStore(),
  currentStore = useCurrentSubscriptionStore()
const planStore = usePlanStore(),
  changeStore = useSettingChangeStore()
const subscription = computed(() => currentStore.subscription)
const addresses = computed(() => addressStore.addresses)
const errorMessage = computed(
  () => changeStore.error?.serverMessage || changeStore.error?.message || '',
)
const canEdit = computed(
  () =>
    currentStore.status === 'success' && subscription.value?.subscriptionStatus === 'IN_PROGRESS',
)

async function initialize() {
  await Promise.all([
    currentStore.fetchCurrentSubscription(true),
    addressStore.fetchAddresses(true),
    planStore.fetchPlans(),
  ])
  if (subscription.value && !changeStore.deliveryConditions.length)
    changeStore.initialize(subscription.value)
}
onMounted(initialize)
function toggleWeekday(weekday) {
  const selected = changeStore.deliveryConditions.map((condition) => condition.weekday)
  changeStore.setDeliveryWeekdays(
    selected.includes(weekday)
      ? selected.filter((value) => value !== weekday)
      : DELIVERY_WEEKDAYS.filter((value) => [...selected, weekday].includes(value)),
  )
}
function changeQuantity(weekday, offset) {
  const condition = changeStore.deliveryConditions.find((item) => item.weekday === weekday)
  if (condition)
    changeStore.updateDeliveryCondition(weekday, {
      mealQuantity: Math.min(6, Math.max(1, condition.mealQuantity + offset)),
    })
}
function requestOrMessage() {
  try {
    return createSettingChangeRequest(changeStore.planId, changeStore.deliveryConditions)
  } catch (error) {
    changeStore.error = error
    return null
  }
}
async function preview() {
  const request = requestOrMessage()
  if (request && (await changeStore.requestPreview(request))) router.push({ name: 'wf-025' })
}
function retry() {
  changeStore.$reset()
  initialize()
}
</script>

<template>
  <section class="workspace-ui setting-change-page">
    <header class="ui-heading">
      <div>
        <h1>구독 설정 변경</h1>
        <p>플랜과 요일별 배송 조건을 함께 변경하고, 서버 계산 결과를 확인해 주세요.</p>
      </div>
    </header>
    <section
      v-if="['idle', 'loading'].includes(currentStore.status)"
      class="ui-empty"
      aria-busy="true"
    >
      <h2>현재 구독을 불러오고 있어요.</h2>
    </section>
    <section v-else-if="currentStore.status === 'error'" class="ui-empty" role="alert">
      <h2>현재 구독을 불러오지 못했어요.</h2>
      <p>{{ currentStore.error?.serverMessage || currentStore.error?.message }}</p>
      <button class="button button-secondary" type="button" @click="retry">다시 시도</button>
    </section>
    <section v-else-if="!subscription" class="ui-empty">
      <h2>변경할 구독이 없어요.</h2>
      <button class="button button-primary" type="button" @click="router.push({ name: 'plans' })">
        플랜 보러 가기
      </button>
    </section>
    <section v-else-if="!canEdit" class="ui-empty" role="alert">
      <h2>지금은 구독 설정을 변경할 수 없어요.</h2>
      <p>이용 중인 구독만 설정 변경할 수 있습니다.</p>
      <button
        class="button button-secondary"
        type="button"
        @click="router.push({ name: 'subscription' })"
      >
        내 구독으로
      </button>
    </section>
    <section
      v-else-if="addressStore.listStatus === 'error' || planStore.listStatus === 'error'"
      class="ui-empty"
      role="alert"
    >
      <h2>설정에 필요한 정보를 불러오지 못했어요.</h2>
      <p>
        {{
          addressStore.listError?.serverMessage ||
          addressStore.listError?.message ||
          planStore.listError?.serverMessage ||
          planStore.listError?.message
        }}
      </p>
      <button class="button button-secondary" type="button" @click="retry">다시 시도</button>
    </section>
    <template v-else>
      <section class="setting-card">
        <h2>플랜</h2>
        <label
          >변경할 플랜<select
            :value="changeStore.planId"
            @change="changeStore.setPlan($event.target.value)"
          >
            <option v-for="plan in planStore.plans" :key="plan.planId" :value="plan.planId">
              {{ plan.name }} · {{ Number(plan.unitPrice || 0).toLocaleString('ko-KR') }}원
            </option>
          </select></label
        >
      </section>
      <section class="setting-card">
        <h2>반복 배송 요일</h2>
        <div class="weekday-picker" role="group" aria-label="반복 배송 요일">
          <button
            v-for="weekday in DELIVERY_WEEKDAYS"
            :key="weekday"
            class="weekday-button"
            :class="{
              'is-selected': changeStore.deliveryConditions.some(
                (item) => item.weekday === weekday,
              ),
            }"
            :aria-pressed="changeStore.deliveryConditions.some((item) => item.weekday === weekday)"
            type="button"
            @click="toggleWeekday(weekday)"
          >
            {{ DELIVERY_WEEKDAY_LABELS[weekday].replace('요일', '') }}
          </button>
        </div>
      </section>
      <section v-if="!addresses.length" class="ui-empty">
        <h2>등록된 배송지가 없어요.</h2>
        <p>설정 변경 전에 배송지를 하나 이상 등록해 주세요.</p>
        <button
          class="button button-primary"
          type="button"
          @click="router.push({ name: 'wf-029' })"
        >
          배송지 등록
        </button>
      </section>
      <section v-else class="setting-card">
        <h2>요일별 배송 조건</h2>
        <article
          v-for="condition in changeStore.deliveryConditions"
          :key="condition.weekday"
          class="condition-card"
        >
          <h3>{{ DELIVERY_WEEKDAY_LABELS[condition.weekday] }}</h3>
          <label
            >배송지<select
              :value="condition.addressId"
              @change="
                changeStore.updateDeliveryCondition(condition.weekday, {
                  addressId: $event.target.value,
                })
              "
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
          <p class="address-preview">
            {{
              formatSubscriptionAddress(
                addresses.find((address) => address.addressId === condition.addressId),
              )
            }}
          </p>
          <label
            >식사 수량<span class="quantity-control"
              ><button
                type="button"
                :disabled="condition.mealQuantity <= 1"
                @click="changeQuantity(condition.weekday, -1)"
              >
                <Minus :size="16" /></button
              ><output>{{ condition.mealQuantity }}식</output
              ><button
                type="button"
                :disabled="condition.mealQuantity >= 6"
                @click="changeQuantity(condition.weekday, 1)"
              >
                <Plus :size="16" /></button></span></label
          ><label
            >배송 시간대<select
              :value="condition.deliveryTimeSlot"
              @change="
                changeStore.updateDeliveryCondition(condition.weekday, {
                  deliveryTimeSlot: $event.target.value,
                })
              "
            >
              <option v-for="slot in DELIVERY_TIME_SLOTS" :key="slot.value" :value="slot.value">
                {{ slot.label }}
              </option>
            </select></label
          >
        </article>
      </section>
      <p v-if="errorMessage" class="setting-error" role="alert">{{ errorMessage }}</p>
      <div class="ui-actions ui-actions--end">
        <button
          class="button button-primary"
          type="button"
          :disabled="!addresses.length || changeStore.previewStatus === 'loading'"
          @click="preview"
        >
          {{ changeStore.previewStatus === 'loading' ? '계산 중…' : '변경 내용 확인' }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.setting-change-page {
  display: grid;
  gap: 20px;
  padding-block: 36px 64px;
}
.setting-card {
  display: grid;
  gap: 16px;
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.setting-card h2,
.condition-card h3 {
  margin: 0;
}
.setting-card label,
.condition-card label {
  display: grid;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}
.setting-card select,
.condition-card select {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
}
.weekday-picker {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}
.weekday-button {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  font-weight: 800;
}
.weekday-button.is-selected {
  border-color: var(--color-primary-pressed);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.condition-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px 20px;
  padding: 20px 0;
  border-top: 1px solid var(--color-border);
}
.condition-card h3,
.address-preview {
  grid-column: 1 / -1;
}
.address-preview {
  margin: -8px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.quantity-control button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}
.quantity-control output {
  min-width: 32px;
  color: var(--color-text);
  text-align: center;
}
.setting-error {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #9e3825;
}
@media (max-width: 540px) {
  .weekday-picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .condition-card {
    grid-template-columns: 1fr;
  }
}
</style>
