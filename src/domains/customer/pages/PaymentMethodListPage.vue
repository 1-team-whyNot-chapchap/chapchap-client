<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import { CreditCard, Plus, ShieldCheck } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const isOpen = ref(false)
const notice = ref('')
function choose(id) {
  store.setDefaultPaymentMethod(id)
  notice.value = '기본 카드가 변경되었어요. 실제 결제수단은 변경되지 않습니다.'
}
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
    <DesignPreview title="결제수단" empty="등록된 카드가 없어요.">
      <div class="ui-grid">
        <article v-for="card in store.paymentMethods" :key="card.id" class="ui-surface ui-stack">
          <div class="ui-row">
            <span class="ui-icon"><CreditCard :size="24" aria-hidden="true" /></span
            ><span v-if="card.isDefault" class="mini-badge">기본 결제수단</span>
          </div>
          <h2>{{ card.brand }}</h2>
          <p class="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; {{ card.lastFourDigits }}</p>
          <button
            class="button button-secondary"
            :disabled="card.isDefault"
            @click="choose(card.id)"
          >
            {{ card.isDefault ? '기본 카드로 선택됨' : '기본 카드로 선택' }}
          </button>
        </article>
      </div>
      <div v-if="!store.paymentMethods.length" class="ui-empty">
        <CreditCard :size="32" aria-hidden="true" />
        <h2>등록된 카드가 없어요.</h2>
        <button class="button button-primary" @click="isOpen = true">카드 등록 안내</button>
      </div>
    </DesignPreview>
    <aside class="ui-note ui-actions" style="margin-top: 24px">
      <ShieldCheck :size="20" aria-hidden="true" />
      <p>카드 등록은 결제사의 보안 화면에서 진행됩니다.</p>
    </aside>
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
.card-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  padding-block: 16px;
  overflow-wrap: anywhere;
}
</style>
