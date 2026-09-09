<script setup>
import { nextTick, ref } from 'vue'
import { ArrowUp, Headphones, Paperclip } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'

const emit = defineEmits(['navigate'])
const message = ref('')
const chatLog = ref([
  {
    id: 1,
    sender: 'agent',
    text: '안녕하세요. 챱챱 상담사입니다. 환불을 원하는 결제 내역과 사유를 확인해 드릴게요.',
    time: '오전 10:02',
  },
  {
    id: 2,
    sender: 'user',
    text: '다음 배송이 시작되기 전에 구독 결제 환불을 상담하고 싶어요.',
    time: '오전 10:03',
  },
])
const chatEnd = ref(null)

async function sendMessage() {
  const trimmedMessage = message.value.trim()

  if (!trimmedMessage) {
    return
  }

  chatLog.value.push({
    id: Date.now(),
    sender: 'user',
    text: trimmedMessage,
    time: '방금',
  })
  message.value = ''

  // nextTick은 새 메시지가 화면에 그려진 다음 스크롤하도록 실행 순서를 기다립니다.
  await nextTick()
  chatEnd.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="page management-page chat-page">
    <PageBackButton label="환불 내역으로" @back="emit('navigate', 'wf-035')" />

    <section class="page-intro">
      <h1>환불 상담</h1>
      <p>결제와 배송 상태를 확인한 뒤 상담사가 가능한 처리 방법을 안내합니다.</p>
    </section>

    <aside class="chat-order-summary">
      <span><Headphones :size="21" aria-hidden="true" /></span>
      <div>
        <small>상담 대상 결제</small>
        <strong>PAY-202607-0012 · 영양식</strong>
        <p>결제 금액: 가격 미정 · 신한카드 ···· 1234</p>
      </div>
      <StatusBadge status="환불 검토" />
    </aside>

    <section class="chat-panel" aria-label="환불 상담 메시지">
      <div class="chat-messages" aria-live="polite">
        <div
          v-for="item in chatLog"
          :key="item.id"
          class="chat-message"
          :class="`chat-message--${item.sender}`"
        >
          <strong>{{ item.sender === 'agent' ? '챱챱 상담사' : '나' }}</strong>
          <p>{{ item.text }}</p>
          <small>{{ item.time }}</small>
        </div>
        <span ref="chatEnd"></span>
      </div>

      <form class="chat-composer" @submit.prevent="sendMessage">
        <button type="button" aria-label="파일 첨부" disabled>
          <Paperclip :size="20" aria-hidden="true" />
        </button>
        <label>
          <span class="sr-only">상담 메시지</span>
          <textarea
            v-model="message"
            rows="1"
            placeholder="상담 내용을 입력해 주세요."
            @keydown.enter.exact.prevent="sendMessage"
          />
        </label>
        <button
          class="chat-send-button"
          type="submit"
          :disabled="!message.trim()"
          aria-label="전송"
        >
          <ArrowUp :size="19" aria-hidden="true" />
        </button>
      </form>
    </section>

    <p class="form-help">상담 연결과 파일 첨부는 고객지원 시스템 연결 후 사용할 수 있습니다.</p>
  </div>
</template>

<style scoped>
/* 환불 상담 */
.chat-order-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
  padding: 17px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface);
}

.chat-order-summary > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.chat-order-summary > div {
  display: grid;
  gap: 3px;
}

.chat-order-summary small,
.chat-order-summary p {
  font-size: var(--font-caption);
}

.chat-panel {
  overflow: hidden;
  margin-top: 14px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.chat-messages {
  min-height: 420px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 24px;
  background: var(--color-surface-subtle);
}

.chat-message {
  max-width: 76%;
  display: grid;
  gap: 5px;
  padding: 13px 15px;
  border-radius: 15px;
  background: var(--color-surface);
}

.chat-message--user {
  align-self: flex-end;
  border-bottom-right-radius: 5px;
  background: var(--color-primary-soft);
}

.chat-message--agent {
  align-self: flex-start;
  border-bottom-left-radius: 5px;
}

.chat-message strong,
.chat-message small {
  font-size: var(--font-caption);
}

.chat-message small {
  color: var(--color-text-muted);
}

.chat-message p {
  color: var(--color-text);
  font-size: var(--font-caption);
}

.chat-composer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 9px;
  padding: 14px;
  border-top: 1px solid var(--color-border);
}

.chat-composer > button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 11px;
  background: var(--color-surface-subtle);
}

.chat-composer label textarea {
  width: 100%;
  min-height: 42px;
  max-height: 110px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font: inherit;
  resize: vertical;
}

.chat-composer .chat-send-button {
  background: var(--color-primary);
  color: var(--color-text);
}

.chat-composer .chat-send-button:disabled {
  background: var(--color-disabled);
}
</style>

<style scoped>
@media (max-width: 760px) {
  .chat-order-summary {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .chat-messages {
    min-height: 360px;
    padding: 16px;
  }
}

@media (max-width: 760px) {
  .chat-message {
    max-width: 88%;
  }
}
</style>
