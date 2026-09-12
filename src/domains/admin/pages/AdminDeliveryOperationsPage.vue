<script setup>
import { onMounted, ref, watch } from 'vue'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import AdminFrame from '../components/AdminFrame.vue'
import { selectButtonPt, popupDatePickerPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createAdminDeliveryOperationsApi } from '../api/adminDeliveryOperationsApi.js'
const api = createAdminDeliveryOperationsApi(http)
const tab = ref('UNRESOLVED_DELIVERY')
const date = ref(null)
const operations = ref([])
const state = ref('loading')
const labels = {
  UNRESOLVED_DELIVERY: '미해결 배송',
  EVENT_PUBLISH_FAILED: '이벤트 발행 실패',
  AUTO_ASSIGNMENT_FINAL_FAILURE: '자동 배정 실패',
  LATE_ORDER_REVIEW: '지연 주문 검토',
  ACKNOWLEDGEMENT_OVERDUE: '배정 확인 지연',
}
async function load() {
  state.value = 'loading'
  try {
    const response = await api.listOperations({
      type: tab.value,
      deliveryDate: date.value ? dayjs(date.value).format('YYYY-MM-DD') : undefined,
    })
    operations.value = response.items
    state.value = response.items.length ? 'ready' : 'empty'
  } catch {
    state.value = 'error'
  }
}
function reset() {
  date.value = null
  tab.value = 'UNRESOLVED_DELIVERY'
}
watch([tab, date], load)
onMounted(load)
</script>
<template>
  <AdminFrame
    title="배송 운영 예외"
    description="배송 운영 예외를 서버 기준으로 조회합니다."
    current="admin-delivery-operations"
  >
    <SelectButton
      v-model="tab"
      :options="Object.keys(labels)"
      :option-label="(value) => labels[value]"
      :allow-empty="false"
      :pt="selectButtonPt"
      aria-label="운영 예외 유형"
    />
    <div class="ops-toolbar">
      <label class="ui-field" for="ops-date"
        >조회 날짜<DatePicker
          v-model="date"
          input-id="ops-date"
          date-format="yy.mm.dd"
          :manual-input="false"
          :pt="popupDatePickerPt"
          placeholder="전체 날짜" /></label
      ><button class="button button-secondary" @click="reset">조건 초기화</button>
    </div>
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>{{ labels[tab] }} 목록</h2>
        <span class="ui-muted">{{ operations.length }}건</span>
      </div>
      <div v-if="state !== 'ready'" class="ui-empty">
        <h3>
          {{
            state === 'error' ? '운영 목록을 불러오지 못했습니다.' : '조건에 맞는 예외가 없습니다.'
          }}
        </h3>
        <button class="button button-secondary" @click="load">다시 시도</button>
      </div>
      <article
        v-for="item in operations"
        v-else
        :key="item.deliveryId || item.integrationEventRecordId"
        class="ui-list-item"
      >
        <div>
          <span class="ops-status ops-status--danger">{{ labels[item.type] }}</span>
          <h3>{{ item.deliveryId || item.eventType || '배송 운영 항목' }}</h3>
          <p>{{ item.deliveryDate }} · {{ item.deliverySlot }} · 감지 {{ item.detectedAt }}</p>
        </div>
        <RouterLink
          v-if="item.deliveryId"
          class="ops-link"
          :to="`/admin/deliveries/${item.deliveryId}`"
          >배송 상세</RouterLink
        >
      </article>
    </section>
    <p class="ui-note">
      이벤트 재발행은 Producer의 실패 기록 단위입니다. Consumer DLT 재처리나 배송 상태 되돌리기를
      제공하지 않습니다.
    </p>
  </AdminFrame>
</template>
