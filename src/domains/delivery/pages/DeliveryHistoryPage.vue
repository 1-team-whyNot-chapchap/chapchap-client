<script setup>
import { computed, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import { PackageCheck } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { datePickerPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const dates = ref(null)
const status = ref('전체')
function resetFilters() {
  dates.value = null
  status.value = '전체'
}
const deliveries = computed(() =>
  appStore.deliveryHistory.filter((d) => {
    const date = dayjs(d.deliveryDate)
    return (
      (status.value === '전체' || d.status === status.value) &&
      (!dates.value?.[0] || !date.isBefore(dayjs(dates.value[0]), 'day')) &&
      (!dates.value?.[1] || !date.isAfter(dayjs(dates.value[1]), 'day'))
    )
  }),
)
function openDelivery(id) {
  appStore.selectDelivery(id)
  emit('navigate', 'wf-034')
}
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
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
          :pt="datePickerPt"
      /></label>
      <label class="ui-field"
        >배송 상태<select v-model="status">
          <option>전체</option>
          <option
            v-for="value in [...new Set(appStore.deliveryHistory.map((d) => d.status))]"
            :key="value"
          >
            {{ value }}
          </option>
        </select></label
      >
      <button class="button button-secondary" @click="resetFilters">필터 초기화</button>
    </div>
    <p class="ui-muted" role="status">총 {{ deliveries.length }}건</p>
    <DesignPreview title="배송 내역" empty="등록된 배송이 없어요.">
      <section class="ui-surface" style="margin-top: 16px" aria-label="배송 목록">
        <article v-for="delivery in deliveries" :key="delivery.id" class="ui-list-item">
          <span class="ui-icon"><PackageCheck :size="22" aria-hidden="true" /></span>
          <div>
            <h2>
              {{ dayjs(delivery.deliveryDate).format('M월 D일') }} · {{ delivery.addressName }}
            </h2>
            <p>메뉴 {{ delivery.menuCount }}개</p>
            <StatusBadge :status="delivery.status" />
          </div>
          <button
            class="button button-secondary"
            :aria-label="`${delivery.deliveryDate} 배송 상세`"
            @click="openDelivery(delivery.id)"
          >
            상세 보기
          </button>
        </article>
        <div v-if="!deliveries.length" class="ui-empty">
          <PackageCheck :size="32" aria-hidden="true" />
          <h2>조건에 맞는 배송이 없어요.</h2>
          <button class="button button-secondary" @click="resetFilters">전체 배송 보기</button>
        </div>
      </section>
    </DesignPreview>
  </div>
</template>
