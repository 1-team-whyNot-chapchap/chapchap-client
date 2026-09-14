<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import { PackageCheck } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import { popupDatePickerPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createCustomerDeliveryApi } from '../api/customerDeliveryApi.js'

const router = useRouter()
const api = createCustomerDeliveryApi(http)
const dates = ref(null)
const status = ref('')
const state = ref('loading')
const deliveries = ref([])
const total = ref(0)
const error = ref('')
let requestId = 0

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'READY', label: '배송 준비' },
  { value: 'DELIVERING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'FAILED', label: '배송 실패' },
]

const statusLabel = (value) =>
  statusOptions.find((option) => option.value === value)?.label || value
const slotLabel = (value) => ({ LUNCH: '점심', DINNER: '저녁' })[value] || value

async function loadDeliveries() {
  const current = ++requestId
  state.value = 'loading'
  error.value = ''
  try {
    const response = await api.list({
      deliveryDateFrom: dates.value?.[0] ? dayjs(dates.value[0]).format('YYYY-MM-DD') : undefined,
      deliveryDateTo: dates.value?.[1] ? dayjs(dates.value[1]).format('YYYY-MM-DD') : undefined,
      status: status.value || undefined,
    })
    if (current !== requestId) return
    deliveries.value = response.items
    total.value = response.totalElements
    state.value = response.items.length ? 'ready' : 'empty'
  } catch (failure) {
    if (current !== requestId) return
    error.value = failure.message
    state.value = 'error'
  }
}

function resetFilters() {
  dates.value = null
  status.value = ''
}
function openDelivery(id) {
  router.push({ name: 'wf-034', query: { deliveryId: id } })
}

watch([dates, status], loadDeliveries)
onMounted(loadDeliveries)
onBeforeUnmount(() => requestId++)
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="router.push({ name: 'mypage' })" />
    <header class="ui-heading">
      <div>
        <h1>배송 내역</h1>
        <p>배송일과 상태를 선택해 지난 식사를 확인하세요.</p>
      </div>
    </header>
    <div class="ui-filter">
      <label class="ui-field" for="delivery-period"
        >배송 기간<DatePicker
          v-model="dates"
          input-id="delivery-period"
          selection-mode="range"
          :manual-input="false"
          date-format="yy.mm.dd"
          placeholder="전체 기간"
          :pt="popupDatePickerPt"
      /></label>
      <label class="ui-field"
        >배송 상태<select v-model="status">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select></label
      >
      <button class="button button-secondary" @click="resetFilters">필터 초기화</button>
    </div>
    <p class="ui-muted" role="status">총 {{ total }}건</p>
    <DesignPreview title="배송 내역" empty="등록된 배송이 없어요.">
      <ContentState :state="state" empty-title="조건에 맞는 배송이 없어요." @retry="loadDeliveries">
        <p v-if="state === 'error' && error" class="ui-error" role="alert">{{ error }}</p>
        <section class="ui-surface" style="margin-top: 16px" aria-label="배송 목록">
          <article v-for="delivery in deliveries" :key="delivery.deliveryId" class="ui-list-item">
            <span class="ui-icon"><PackageCheck :size="22" aria-hidden="true" /></span>
            <div>
              <h2>
                {{ dayjs(delivery.deliveryDate).format('M월 D일') }} ·
                {{ slotLabel(delivery.deliverySlot) }}
              </h2>
              <p>주문 {{ delivery.orderId }}</p>
              <StatusBadge :status="statusLabel(delivery.status)" />
            </div>
            <button
              class="button button-secondary"
              :aria-label="`${delivery.deliveryDate} 배송 상세`"
              @click="openDelivery(delivery.deliveryId)"
            >
              상세 보기
            </button>
          </article>
        </section>
      </ContentState>
    </DesignPreview>
  </div>
</template>
