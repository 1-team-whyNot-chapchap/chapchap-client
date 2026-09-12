<script setup>
import { computed, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import { ReceiptText } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { datePickerPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const dates = ref(null)
const payments = computed(() =>
  store.paymentHistory.filter(
    (p) =>
      (!dates.value?.[0] || !dayjs(p.paidAt).isBefore(dates.value[0], 'day')) &&
      (!dates.value?.[1] || !dayjs(p.paidAt).isAfter(dates.value[1], 'day')),
  ),
)
function open(id) {
  store.selectPayment(id)
  emit('navigate', 'wf-032')
}
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <header class="ui-heading">
      <div>
        <h1>결제 내역</h1>
        <p>정기결제와 환불 처리 내역을 확인하세요.</p>
      </div>
    </header>
    <div class="ui-filter">
      <label class="ui-field" for="payment-period"
        >결제 기간<DatePicker
          v-model="dates"
          input-id="payment-period"
          selection-mode="range"
          :manual-input="false"
          placeholder="전체 기간"
          :pt="datePickerPt" /></label
      ><button class="button button-secondary" @click="dates = null">기간 초기화</button>
    </div>
    <p class="ui-muted" role="status">총 {{ payments.length }}건</p>
    <DesignPreview title="결제 내역" empty="결제 내역이 없어요."
      ><section class="ui-surface" style="margin-top: 16px">
        <article v-for="payment in payments" :key="payment.id" class="ui-list-item">
          <span class="ui-icon"><ReceiptText :size="22" aria-hidden="true" /></span>
          <div>
            <h2>{{ payment.description }}</h2>
            <p>{{ payment.paidAt }} · {{ payment.paymentMethod }}</p>
            <StatusBadge :status="payment.status" />
          </div>
          <strong>{{ payment.amountLabel }}</strong
          ><button
            class="button button-secondary"
            :aria-label="`${payment.paidAt} 결제 상세`"
            @click="open(payment.id)"
          >
            상세 보기
          </button>
        </article>
        <div v-if="!payments.length" class="ui-empty">
          <ReceiptText :size="32" aria-hidden="true" />
          <h2>조건에 맞는 결제가 없어요.</h2>
          <button class="button button-secondary" @click="dates = null">전체 기간 보기</button>
        </div>
      </section></DesignPreview
    >
  </div>
</template>
