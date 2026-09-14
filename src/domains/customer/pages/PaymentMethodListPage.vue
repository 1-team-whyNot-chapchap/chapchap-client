<script setup>
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import PaymentMethodPanel from '../../subscription/components/PaymentMethodPanel.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <header class="ui-heading">
      <div>
        <h1>결제수단</h1>
        <p>구독 결제에 사용할 카드를 등록하고 관리하세요.</p>
      </div>
    </header>
    <PaymentMethodPanel allow-delete />
  </div>
</template>
