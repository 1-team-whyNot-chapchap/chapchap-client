<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Dialog from 'primevue/dialog'
import { CreditCard, Plus, ShieldCheck } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../../subscription/api/accountDataApi.js'
const api = createAccountDataApi(http)
import { dialogPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const isOpen = ref(false)
const notice = ref('')
const busy = ref(false),
  loading = ref(false),
  error = ref(''),
  confirming = ref(null)
const cards = ref([])
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  cards.value = []
  try {
    const result = await api.paymentMethods()
    if (current === version) {
      cards.value = result
      store.paymentMethods = result
    }
  } catch {
    if (current === version) error.value = '결제수단을 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (current === version) loading.value = false
  }
}
function confirmCard(card) {
  error.value = ''
  confirming.value = card
}
async function choose() {
  if (busy.value || !confirming.value) return
  busy.value = true
  error.value = ''
  try {
    await api.defaultPaymentMethod(confirming.value.id)
    confirming.value = null
    notice.value = '기본 결제수단이 변경되었습니다.'
    await load()
  } catch {
    error.value = '기본 결제수단을 변경하지 못했습니다. 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
onMounted(load)
onUnmounted(() => {
  version++
})
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <header class="ui-heading">
      <div>
        <h1>결제수단</h1>
        <p>정기결제에 사용할 기본 카드를 확인하세요.</p>
      </div>
      <button class="button button-primary" @click="isOpen = true">
        <Plus :size="18" aria-hidden="true" />카드 등록
      </button>
    </header>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <p v-if="loading" role="status">결제수단을 불러오고 있어요.</p>
    <div v-else-if="error &amp;&amp; !confirming" role="alert" class="ui-note">
      <p>{{ error }}</p>
      <button class="button button-secondary" @click="load">다시 시도</button>
    </div>
    <div v-else>
      <div class="ui-grid">
        <article v-for="card in cards" :key="card.id" class="ui-surface ui-stack">
          <div class="ui-row">
            <span class="ui-icon"><CreditCard :size="24" aria-hidden="true" /></span
            ><span v-if="card.isDefault" class="mini-badge">기본 결제수단</span>
          </div>
          <h2>{{ card.brand }}</h2>
          <p class="card-number">{{ card.maskedCardNumber }}</p>
          <button
            class="button button-secondary"
            :disabled="card.isDefault || busy"
            @click="confirmCard(card)"
          >
            {{ card.isDefault ? '기본 카드로 선택됨' : '기본 카드로 선택' }}
          </button>
        </article>
      </div>
      <div v-if="!cards.length" class="ui-empty">
        <CreditCard :size="32" aria-hidden="true" />
        <h2>등록된 카드가 없어요.</h2>
        <button class="button button-primary" @click="isOpen = true">카드 등록 안내</button>
      </div>
    </div>
    <aside class="ui-note ui-actions" style="margin-top: 24px">
      <ShieldCheck :size="20" aria-hidden="true" />
      <p>카드 등록은 결제사의 보안 화면에서 진행됩니다.</p>
    </aside>
    <Dialog
      :visible="Boolean(confirming)"
      modal
      :draggable="false"
      :closable="!busy"
      :close-on-escape="!busy"
      header="기본 결제수단 변경"
      :pt="dialogPt"
      @update:visible="confirming = null"
    >
      <p>
        {{ confirming?.brand }} {{ confirming?.maskedCardNumber }} 카드를 기본 결제수단으로
        사용할까요?
      </p>
      <p class="ui-muted">이후 정기결제에 사용됩니다. 지금 결제되지는 않습니다.</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <template #footer
        ><button class="button button-secondary" :disabled="busy" @click="confirming = null">
          취소</button
        ><button class="button button-primary" :disabled="busy" @click="choose">
          {{ busy ? '변경 중…' : '변경' }}
        </button></template
      >
    </Dialog>
    <Dialog v-model:visible="isOpen" modal :draggable="false" header="카드 등록 안내" :pt="dialogPt"
      ><div class="ui-stack">
        <CreditCard :size="32" aria-hidden="true" />
        <p>결제 서비스 연결을 준비하고 있어요.</p>
        <p class="ui-muted">
          연결 후 결제사의 보안 화면에서 등록할 수 있습니다. 현재 화면에서는 카드번호를 입력하지
          않습니다.
        </p>
      </div>
      <template #footer
        ><button class="button button-primary" @click="isOpen = false">확인</button></template
      ></Dialog
    >
  </div>
</template>
<style scoped>
.ui-grid article > .button {
  align-self: end;
  margin-left: auto;
}
.card-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  padding-block: 16px;
  overflow-wrap: anywhere;
}
</style>
