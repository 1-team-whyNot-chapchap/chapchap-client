<script setup>
import { CreditCard } from 'lucide-vue-next'

defineProps({
  paymentMethod: {
    type: Object,
    required: true,
  },
})

defineEmits(['makeDefault'])
</script>

<template>
  <div class="profile-data-card payment-method-card">
    <span class="profile-data-card__icon">
      <CreditCard :size="20" aria-hidden="true" />
    </span>

    <div class="profile-data-card__content">
      <div class="profile-data-card__heading">
        <strong>{{ paymentMethod.brand }}</strong>
        <span v-if="paymentMethod.isDefault" class="mini-badge">기본 결제수단</span>
      </div>
      <p>카드번호 ···· {{ paymentMethod.lastFourDigits }}</p>
      <p>유효기간 {{ paymentMethod.expiresAt }}</p>
    </div>

    <button
      v-if="!paymentMethod.isDefault"
      class="text-button"
      type="button"
      @click="$emit('makeDefault', paymentMethod.id)"
    >
      기본으로 설정
    </button>
  </div>
</template>
