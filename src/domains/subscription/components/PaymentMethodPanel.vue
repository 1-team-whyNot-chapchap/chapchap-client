<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { useRoute } from 'vue-router'
import { CreditCard, Plus, ShieldCheck, Trash2 } from 'lucide-vue-next'
import http, { authSession } from '../../../common/api/http.js'
import { dialogPt } from '../../../common/constants/primeUiPt'
import { createAccountDataApi } from '../api/accountDataApi.js'
import { issueBillingKey } from '../portOneBilling.js'
import { billingDraft, billingUserId } from '../mobileBillingContext.js'
import {
  mobileBillingContext,
  recoverAbandonedBilling,
  takeBillingReturnNotice,
} from '../mobileBillingReturn.js'
import { useFirstSubscriptionStore } from '../stores/useFirstSubscriptionStore.js'
import {
  createPaymentMethodManager,
  paymentMethodState,
  paymentMethodsReady,
} from '../paymentMethodManager.js'

const props = defineProps({ allowDelete: Boolean, disabled: Boolean })
const emit = defineEmits(['ready'])
const state = reactive(paymentMethodState())
const confirmation = ref(null)
const route = useRoute()
const application = useFirstSubscriptionStore()
async function issue() {
  const startingUser = billingUserId(authSession.state.user)
  let started = null
  let context
  try {
    return await issueBillingKey({
      prepareRedirect: () => {
        if (!startingUser || startingUser !== billingUserId(authSession.state.user))
          throw new Error('로그인 상태가 변경되었습니다. 다시 진행해 주세요.')
        const source = route.path === '/subscribe/payment' ? 'subscription' : 'methods'
        if (
          source === 'methods' &&
          !['/mypage/payment-methods', '/mypage/payment-methods/register'].includes(route.path)
        )
          throw new Error('카드 등록 시작 화면을 확인해 주세요.')
        context = mobileBillingContext()
        started = context.begin({
          userId: startingUser,
          source,
          origin: window.location.origin,
          draft: source === 'subscription' ? billingDraft(application) : null,
        })
        return started.redirectUrl
      },
    })
  } catch (error) {
    if (started && context.read()?.id === started.id) context.clear()
    // Do not show storage/provider errors that may contain implementation details.
    if (error?.name === 'SecurityError' || error?.name === 'QuotaExceededError')
      throw new Error(
        '브라우저에서 등록 정보를 보관할 수 없습니다. 저장소 사용 설정을 확인해 주세요.',
      )
    throw error
  }
}
const manager = createPaymentMethodManager({
  api: createAccountDataApi(http),
  issue,
  state,
  getOwner: () => authSession.state.user,
})
const locked = computed(() => props.disabled || state.busy || state.loading)
const canAct = computed(() => !locked.value && state.loaded && Boolean(authSession.state.user))
watch(
  () => paymentMethodsReady(state),
  (ready) => emit('ready', ready),
  { immediate: true, flush: 'sync' },
)
watch(
  () => authSession.state.user,
  () => {
    confirmation.value = null
    manager.dispose()
  },
)
function confirm(action, card) {
  if (!canAct.value || (action === 'remove' && !props.allowDelete)) return
  confirmation.value = { action, card }
}
async function execute() {
  if (!canAct.value || !confirmation.value) return
  const { action, card } = confirmation.value
  const success = await manager[action](card)
  if (success) confirmation.value = null
}
function closeConfirmation(visible) {
  if (!visible && !locked.value) confirmation.value = null
}
function handlePageShow(event) {
  // A restored document may still hold the SDK's unresolved promise and busy state.
  if (event.persisted) {
    try {
      if (mobileBillingContext().read()?.status === 'pending') window.location.reload()
    } catch {
      /* next registration fails closed */
    }
  }
}
onMounted(async () => {
  window.addEventListener('pageshow', handlePageShow)
  try {
    if (route.path.startsWith('/mypage/payment-methods'))
      recoverAbandonedBilling(authSession.state.user, 'methods')
  } catch {
    state.error = '이전 카드 등록 상태를 확인하지 못했습니다. 목록을 확인해 주세요.'
  }
  const notice = takeBillingReturnNotice(billingUserId(authSession.state.user))
  await manager.load()
  if (notice) state.notice = notice
})
onBeforeUnmount(() => {
  window.removeEventListener('pageshow', handlePageShow)
  manager.dispose()
  emit('ready', false)
})
defineExpose({ verifyCurrent: manager.verifyCurrent })
</script>

<template>
  <section class="payment-method-panel ui-stack" aria-label="자동결제수단 관리" :aria-busy="locked">
    <div class="ui-row payment-method-actions">
      <p>현재 결제수단은 첫 구독 결제와 이후 정기결제에 사용됩니다.</p>
      <button
        type="button"
        class="button button-primary"
        :disabled="!canAct"
        @click="manager.register"
      >
        <Plus :size="18" aria-hidden="true" />{{ state.busy ? '처리 중…' : '카드 등록' }}
      </button>
    </div>
    <p v-if="state.notice" role="status" class="ui-note">{{ state.notice }}</p>
    <div v-if="state.error" role="alert" class="ui-note">
      <p>{{ state.error }}</p>
      <button
        type="button"
        class="button button-secondary"
        :disabled="locked"
        @click="manager.load"
      >
        목록 다시 확인
      </button>
    </div>
    <p v-if="state.loading" role="status">결제수단을 불러오고 있어요.</p>
    <p v-else-if="state.busy" role="status">처리가 끝날 때까지 기다려 주세요.</p>
    <div v-if="state.loaded" class="ui-grid payment-method-cards">
      <article v-for="card in state.cards" :key="card.id" class="ui-surface ui-stack">
        <div class="ui-row">
          <CreditCard :size="24" aria-hidden="true" /><span v-if="card.isDefault" class="mini-badge"
            >현재 결제수단</span
          >
        </div>
        <h3>{{ card.brand || '등록된 카드' }}</h3>
        <p class="card-number">{{ card.maskedCardNumber || '카드번호 정보 없음' }}</p>
        <div class="ui-actions">
          <button
            type="button"
            class="button button-secondary"
            :disabled="!canAct || card.isDefault"
            @click="confirm('select', card)"
          >
            {{ card.isDefault ? '현재 결제수단으로 선택됨' : '현재 결제수단으로 선택' }}
          </button>
          <button
            v-if="allowDelete"
            type="button"
            class="button button-outline"
            :disabled="!canAct"
            :aria-label="`${card.brand || '등록된 카드'} ${card.maskedCardNumber || ''} 삭제`"
            @click="confirm('remove', card)"
          >
            <Trash2 :size="16" aria-hidden="true" />삭제
          </button>
        </div>
      </article>
    </div>
    <div v-if="state.loaded && !state.cards.length" class="ui-empty">
      <CreditCard :size="32" aria-hidden="true" />
      <h3>등록된 카드가 없어요.</h3>
      <p>카드를 등록하면 첫 카드는 현재 결제수단으로 자동 선택됩니다.</p>
    </div>
    <p v-else-if="state.loaded && !state.cards.some((card) => card.isDefault)" class="ui-note">
      결제에 사용할 현재 결제수단을 선택해 주세요.
    </p>
    <aside class="ui-note ui-actions">
      <ShieldCheck :size="20" aria-hidden="true" />
      <p>
        카드 정보는 결제사의 보안 화면에서 입력합니다. 등록·선택만으로 구독 결제가 진행되지는
        않습니다.
      </p>
    </aside>
    <Dialog
      :visible="Boolean(confirmation)"
      modal
      :draggable="false"
      :closable="!locked"
      :close-on-escape="!locked"
      :header="confirmation?.action === 'remove' ? '카드 삭제' : '현재 결제수단 변경'"
      :pt="dialogPt"
      @update:visible="closeConfirmation"
    >
      <p>
        {{ confirmation?.card.brand || '등록된 카드' }}
        {{ confirmation?.card.maskedCardNumber || '' }}
      </p>
      <template v-if="confirmation?.action === 'remove'">
        <p>이 카드를 삭제할까요? 과거 결제·환불 이력은 유지됩니다.</p>
        <p v-if="confirmation.card.isDefault">
          구독 이용 중이라면 다른 카드를 현재 결제수단으로 선택한 뒤 삭제할 수 있습니다.
        </p>
      </template>
      <p v-else>이 카드를 첫 결제와 이후 정기결제에 사용할까요? 지금 결제되지는 않습니다.</p>
      <p v-if="state.error" role="alert">{{ state.error }}</p>
      <template #footer>
        <button
          type="button"
          class="button button-secondary"
          :disabled="locked"
          @click="confirmation = null"
        >
          닫기
        </button>
        <button type="button" class="button button-primary" :disabled="!canAct" @click="execute">
          {{ state.busy ? '처리 중…' : confirmation?.action === 'remove' ? '삭제' : '변경' }}
        </button>
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.payment-method-actions {
  flex-wrap: wrap;
  gap: 12px;
}
.payment-method-cards {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}
.card-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
}
.ui-actions {
  flex-wrap: wrap;
}
</style>
