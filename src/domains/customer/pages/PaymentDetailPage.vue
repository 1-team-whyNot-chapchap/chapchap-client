<script setup>
import { computed } from 'vue'
import { ReceiptText } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const payment = computed(() => store.selectedPayment)
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton label="결제 내역으로" @back="emit('navigate', 'wf-031')" />
    <header class="ui-heading">
      <div>
        <h1>결제·환불 상세</h1>
        <p>{{ payment?.id }}</p>
      </div>
    </header>
    <DesignPreview title="결제 상세" :allow-empty="false"
      ><section v-if="payment" class="ui-surface receipt">
        <div class="ui-row">
          <span class="ui-icon"><ReceiptText :size="24" aria-hidden="true" /></span
          ><StatusBadge :status="payment.status" />
        </div>
        <h2>{{ payment.description }}</h2>
        <dl class="ui-details">
          <div>
            <dt>결제일</dt>
            <dd>{{ payment.paidAt }}</dd>
          </div>
          <div>
            <dt>결제수단</dt>
            <dd>{{ payment.paymentMethod }}</dd>
          </div>
          <div>
            <dt>결제 금액</dt>
            <dd>{{ payment.amountLabel }}</dd>
          </div>
          <div>
            <dt>환불 내역</dt>
            <dd>등록된 내역 없음</dd>
          </div>
        </dl>
        <p class="ui-note">금액과 처리 결과는 결제 당시 기록을 기준으로 제공됩니다.</p>
      </section>
      <div v-else class="ui-empty"><h2>결제 정보를 찾을 수 없어요.</h2></div></DesignPreview
    >
  </div>
</template>
<style scoped>
.receipt {
  max-width: 760px;
  margin-inline: auto;
}
.receipt h2 {
  margin-block: 24px;
}
.receipt .ui-note {
  margin-top: 24px;
}
</style>
