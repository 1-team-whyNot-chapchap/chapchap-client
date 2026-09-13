<script setup>
import PaymentMethodPanel from '../../subscription/components/PaymentMethodPanel.vue'
</script>
<template>
  <div class="workspace-ui design-review-page">
    <RouterLink class="button button-outline" to="/mypage/payment-methods"
      >결제수단 목록으로</RouterLink
    >
    <header class="ui-heading">
      <div>
        <h1>카드 등록</h1>
        <p>카드를 추가하고 결제에 사용할 수단을 선택하세요.</p>
      </div>
    </header>
    <PaymentMethodPanel />
  </div>
</template>
