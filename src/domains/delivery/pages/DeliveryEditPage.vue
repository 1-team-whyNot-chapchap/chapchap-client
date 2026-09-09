<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft, Info, MapPin } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import {
  MINIMUM_DELIVERY_DATE_COUNT,
  hasMinimumDeliveryDatesForEachWeek,
} from '../../../common/utils/deliveryPolicy'
import DeliveryDateCalendar from '../../../common/components/forms/DeliveryDateCalendar.vue'

const appStore = useAppStore()
const emit = defineEmits(['navigate'])

const draftDeliveryDates = ref([...appStore.currentSubscription.deliveryDays])
const draftDeliveryTime = ref(appStore.currentSubscription.deliveryTime)
const draftAddressId = ref(appStore.currentSubscription.selectedAddressId)
const validationMessage = ref('')
const canEditDelivery = computed(() => appStore.isRoundChangeAllowed(appStore.selectedRound))

function saveDeliveryConditions() {
  validationMessage.value = ''

  if (!hasMinimumDeliveryDatesForEachWeek(draftDeliveryDates.value)) {
    validationMessage.value = '1주차와 2주차에 배송 희망일을 각각 3개 이상 선택해주세요.'
    return
  }

  if (!draftAddressId.value) {
    validationMessage.value = '배송지를 선택해주세요.'
    return
  }

  appStore.updateDeliveryConditions({
    deliveryDays: draftDeliveryDates.value,
    deliveryTime: draftDeliveryTime.value,
    selectedAddressId: draftAddressId.value,
  })
  emit('navigate', 'subscription')
}
</script>

<template>
  <div class="page management-page">
    <button class="back-button" type="button" @click="emit('navigate', 'subscription')">
      <ChevronLeft :size="18" aria-hidden="true" />
      내 구독으로
    </button>

    <section class="page-intro">
      <h1>이번 회차의 배송 조건을<br />변경해주세요.</h1>
      <p>변경 마감 전까지만 저장할 수 있으며 다음 회차에는 별도로 적용되지 않습니다.</p>
    </section>

    <section v-if="canEditDelivery" class="delivery-edit-form">
      <fieldset>
        <legend>배송 희망일</legend>
        <DeliveryDateCalendar v-model="draftDeliveryDates" />
        <p class="form-help">
          1주차와 2주차에 배송 희망일을 각각 최소 {{ MINIMUM_DELIVERY_DATE_COUNT }}개 선택해야
          합니다.
          <strong
            >{{ draftDeliveryDates.length }} / 총 {{ MINIMUM_DELIVERY_DATE_COUNT * 2 }}개 이상
            선택</strong
          >
        </p>
      </fieldset>

      <label>
        배송 시간
        <select v-model="draftDeliveryTime">
          <option>점심 · 11:00~13:00</option>
          <option>저녁 · 17:00~19:00</option>
        </select>
      </label>

      <fieldset>
        <legend>배송지</legend>
        <button
          v-for="address in appStore.addresses"
          :key="address.id"
          class="address-choice"
          :class="{ 'is-selected': draftAddressId === address.id }"
          type="button"
          @click="draftAddressId = address.id"
        >
          <MapPin :size="21" aria-hidden="true" />
          <span>
            <strong>{{ address.name }}</strong>
            <small>{{ address.address }}</small>
          </span>
        </button>
      </fieldset>
    </section>

    <aside v-else class="notice-box notice-box--warning management-notice">
      <Info :size="20" aria-hidden="true" />
      <div>
        <strong>변경 마감</strong>
        <p>변경 마감 시간이 지나 이번 회차의 배송 조건을 수정할 수 없습니다.</p>
      </div>
    </aside>

    <p v-if="validationMessage" class="flow-validation" role="alert">
      {{ validationMessage }}
    </p>

    <div v-if="canEditDelivery" class="mobile-action-bar">
      <div>
        <span>선택한 배송 희망일</span>
        <strong>{{ draftDeliveryDates.length }} / {{ MINIMUM_DELIVERY_DATE_COUNT }}개 이상</strong>
      </div>
      <button class="button button-primary" type="button" @click="saveDeliveryConditions">
        변경 저장하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.delivery-edit-form {
  display: grid;
  gap: 28px;
  margin-top: 38px;
}

.delivery-edit-form fieldset {
  padding: 0;
  margin: 0;
  border: 0;
}

.delivery-edit-form legend,
.delivery-edit-form > label {
  display: grid;
  gap: 10px;
  margin-bottom: 11px;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 800;
}

.delivery-edit-form select {
  min-height: 50px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
</style>
