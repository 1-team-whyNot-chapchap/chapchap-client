<script setup>
import { computed, onMounted, ref } from 'vue'
import Dialog from 'primevue/dialog'
import { CreditCard, Plus, ShieldCheck, Trash2 } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import { usePaymentMethodStore } from '../../subscription/stores/usePaymentMethodStore.js'

const store = usePaymentMethodStore()
const pending = ref(null)
const action = ref('')
const notice = ref('')
const busy = computed(() => store.mutationStatus === 'loading')
const errorMessage = computed(
  () => store.mutationError?.serverMessage || store.mutationError?.message || '',
)

onMounted(() => store.fetchPaymentMethods())

function ask(actionName, paymentMethod) {
  notice.value = ''
  pending.value = paymentMethod
  action.value = actionName
}

async function confirm() {
  if (!pending.value || busy.value) return
  const result =
    action.value === 'select'
      ? await store.selectCurrent(pending.value.paymentMethodId)
      : await store.remove(pending.value.paymentMethodId)
  if (!result) return
  notice.value =
    action.value === 'select' ? '현재 결제수단을 변경했습니다.' : '결제수단을 삭제했습니다.'
  pending.value = null
  action.value = ''
}
</script>

<template>
  <div class="payment-methods workspace-ui design-review-page">
    <PageBackButton to="/mypage" label="마이페이지" />
    <header class="ui-heading">
      <div>
        <h1>결제수단</h1>
        <p>정기결제에 사용할 현재 카드를 관리하세요.</p>
      </div>
      <RouterLink class="button button-primary" to="/mypage/payment-methods/register">
        <Plus :size="18" aria-hidden="true" />카드 등록
      </RouterLink>
    </header>

    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <section v-if="['idle', 'loading'].includes(store.status)" class="ui-empty" aria-busy="true">
      <h2>결제수단을 불러오고 있어요.</h2>
    </section>
    <section v-else-if="store.status === 'error'" class="ui-empty" role="alert">
      <h2>결제수단을 불러오지 못했어요.</h2>
      <p>{{ store.error?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
      <button
        class="button button-secondary"
        type="button"
        @click="store.fetchPaymentMethods(true)"
      >
        다시 시도
      </button>
    </section>
    <template v-else>
      <section v-if="store.paymentMethods.length" class="ui-grid">
        <article
          v-for="card in store.paymentMethods"
          :key="card.paymentMethodId"
          class="ui-surface ui-stack"
        >
          <div class="ui-row">
            <span class="ui-icon"><CreditCard :size="24" aria-hidden="true" /></span>
            <span v-if="card.isCurrent" class="mini-badge">현재 결제수단</span>
          </div>
          <h2>{{ card.cardCompany || '등록 카드' }}</h2>
          <p class="card-number">{{ card.maskedCardNumber || '카드 정보 확인 필요' }}</p>
          <div class="card-actions">
            <button
              class="button button-secondary"
              type="button"
              :disabled="card.isCurrent || busy"
              @click="ask('select', card)"
            >
              {{ card.isCurrent ? '현재 카드' : '현재 카드로 선택' }}
            </button>
            <button
              class="button button-secondary"
              type="button"
              :disabled="busy"
              @click="ask('remove', card)"
            >
              <Trash2 :size="16" aria-hidden="true" />삭제
            </button>
          </div>
        </article>
      </section>
      <section v-else class="ui-empty">
        <CreditCard :size="32" aria-hidden="true" />
        <h2>등록된 카드가 없어요.</h2>
        <p>카드 등록을 완료하면 첫 구독과 이후 정기결제에 사용할 수 있습니다.</p>
        <RouterLink class="button button-primary" to="/mypage/payment-methods/register"
          >카드 등록</RouterLink
        >
      </section>
    </template>
    <aside class="ui-note security-note">
      <ShieldCheck :size="20" aria-hidden="true" />
      <p>카드번호는 이 서비스에 입력하거나 저장하지 않으며, 결제사의 보안 화면에서만 등록합니다.</p>
    </aside>

    <Dialog
      :visible="Boolean(pending)"
      modal
      :draggable="false"
      :closable="!busy"
      :close-on-escape="!busy"
      :header="action === 'select' ? '현재 결제수단 변경' : '결제수단 삭제'"
      :pt="dialogPt"
      @update:visible="pending = null"
    >
      <template v-if="action === 'select'">
        <p>{{ pending?.cardCompany || '선택한 카드' }}를 현재 결제수단으로 사용할까요?</p>
        <p class="ui-muted">이후 정기결제에 사용되며, 지금 결제되지는 않습니다.</p>
      </template>
      <template v-else>
        <p>{{ pending?.cardCompany || '선택한 카드' }}를 삭제할까요?</p>
        <p class="ui-muted">
          진행 중인 구독의 현재 결제수단은 서버 정책에 따라 삭제할 수 없습니다.
        </p>
      </template>
      <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
      <template #footer>
        <button
          class="button button-secondary"
          type="button"
          :disabled="busy"
          @click="pending = null"
        >
          취소
        </button>
        <button class="button button-primary" type="button" :disabled="busy" @click="confirm">
          {{ busy ? '처리 중…' : action === 'select' ? '변경' : '삭제' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.payment-methods {
  max-width: 880px;
  margin-inline: auto;
}
.card-number {
  min-height: 24px;
  padding-block: 16px;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.card-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-top: auto;
}
.card-actions .button:last-child {
  color: var(--color-text-muted);
}
.security-note {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}
.security-note p {
  margin: 0;
}
@media (max-width: 560px) {
  .card-actions {
    grid-template-columns: 1fr;
  }
}
</style>
