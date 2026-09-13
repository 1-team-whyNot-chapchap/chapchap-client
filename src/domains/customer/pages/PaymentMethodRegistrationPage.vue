<script setup>
import { computed, ref } from 'vue'
import { CreditCard, ShieldCheck } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { requestCardBillingKey } from '../../subscription/subscriptionPortOne.js'
import { usePaymentMethodStore } from '../../subscription/stores/usePaymentMethodStore.js'

const store = usePaymentMethodStore()
const storeId = import.meta.env.VITE_PORTONE_STORE_ID
const channelKey = import.meta.env.VITE_PORTONE_BILLING_CHANNEL_KEY
const configured = Boolean(storeId && channelKey)
const message = ref('')
const error = ref('')
const busy = computed(() => store.mutationStatus === 'loading')

async function register() {
  if (!configured || busy.value) return
  message.value = ''
  error.value = ''
  let billingKey = ''
  try {
    billingKey = await requestCardBillingKey({ storeId, channelKey })
    const registered = await store.register(billingKey)
    if (!registered) throw store.mutationError || new Error('카드 등록 결과를 확인할 수 없습니다.')
    message.value = '카드를 등록했습니다. 목록에서 현재 결제수단을 확인해 주세요.'
  } catch (cause) {
    error.value =
      cause?.serverMessage || cause?.message || '카드를 등록하지 못했습니다. 다시 시도해 주세요.'
  } finally {
    billingKey = ''
  }
}
</script>

<template>
  <div class="payment-registration workspace-ui design-review-page">
    <PageBackButton to="/mypage/payment-methods" label="결제수단" />
    <header class="ui-heading">
      <div>
        <h1>카드 등록</h1>
        <p>결제사의 보안 화면에서 자동결제 카드를 등록합니다.</p>
      </div>
    </header>
    <section class="registration-card">
      <CreditCard :size="36" aria-hidden="true" />
      <h2>카드 등록을 시작할까요?</h2>
      <p>
        카드번호와 비밀번호는 이 화면에 입력하지 않습니다. 결제사 화면에서 등록을 완료하면 결과만
        안전하게 확인합니다.
      </p>
      <p v-if="!configured" class="registration-error" role="alert">
        카드 등록 환경 설정을 확인해 주세요. 관리자에게 문의해 주세요.
      </p>
      <p v-if="message" class="ui-note" role="status">{{ message }}</p>
      <p v-if="error" class="registration-error" role="alert">{{ error }}</p>
      <div class="ui-actions ui-actions--end">
        <RouterLink class="button button-secondary" to="/mypage/payment-methods"
          >목록으로</RouterLink
        >
        <button
          class="button button-primary"
          type="button"
          :disabled="!configured || busy"
          @click="register"
        >
          {{ busy ? '카드 등록 중…' : '결제사 화면에서 등록' }}
        </button>
      </div>
    </section>
    <aside class="ui-note security-note">
      <ShieldCheck :size="20" aria-hidden="true" />
      <p>
        등록 결과의 빌링키는 서버 등록 요청에만 일회성으로 사용하며, 화면·URL·브라우저 저장소에
        남기지 않습니다.
      </p>
    </aside>
  </div>
</template>

<style scoped>
.payment-registration {
  max-width: 720px;
  margin-inline: auto;
}
.registration-card {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 5vw, 42px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.registration-card h2,
.registration-card p {
  margin: 0;
}
.registration-card > p {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.registration-error {
  padding: 14px;
  border-radius: 12px;
  background: #fff0ed;
  color: #9e3825 !important;
}
.security-note {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.security-note p {
  margin: 0;
}
</style>
