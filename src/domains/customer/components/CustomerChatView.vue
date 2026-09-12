<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowLeft, ArrowUp, Headphones, Plus, RefreshCw } from 'lucide-vue-next'
import { displayDateTime } from '../../../common/utils/displayDate.js'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  selected: Object,
  messages: { type: Array, default: () => [] },
  titles: Object,
  busy: Boolean,
  sending: Boolean,
  mobileOpen: Boolean,
  connectionState: String,
  error: String,
  notice: String,
  draft: String,
  messageDraft: String,
})
const emit = defineEmits([
  'open',
  'new',
  'back',
  'reload',
  'handoff',
  'reconnect',
  'create',
  'send',
  'update:draft',
  'update:messageDraft',
])
const states = {
  AI_HANDLING: 'AI 상담 중',
  WAITING_ADMIN: '상담사 연결 대기',
  IN_PROGRESS: '상담사 상담 중',
  CLOSED: '종료',
}
const connectionText = {
  connecting: '연결 중…',
  connected: '실시간 연결됨',
  reconnecting: '연결 복구 중…',
  failed: '연결 실패',
  closed: '연결 종료',
}
const history = ref(null),
  nearBottom = ref(true),
  unseen = ref(false)
const isNew = computed(() => !props.selected)
const editable = computed(
  () => isNew.value || ['AI_HANDLING', 'IN_PROGRESS'].includes(props.selected?.status),
)
const value = computed(() => (isNew.value ? props.draft : props.messageDraft))
const blocked = computed(
  () =>
    props.busy ||
    props.sending ||
    !value.value?.trim() ||
    (!isNew.value && props.connectionState !== 'connected'),
)
function update(event) {
  emit(isNew.value ? 'update:draft' : 'update:messageDraft', event.target.value)
}
function submit() {
  if (editable.value && !blocked.value) emit(isNew.value ? 'create' : 'send')
}
function keydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  submit()
}
function scrolled() {
  const el = history.value
  if (!el) return
  nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (nearBottom.value) unseen.value = false
}
async function bottom() {
  await nextTick()
  if (history.value) history.value.scrollTop = history.value.scrollHeight
  nearBottom.value = true
  unseen.value = false
}
watch(() => props.selected?.consultationId, bottom)
watch(
  () => props.mobileOpen,
  (open) => {
    if (open) bottom()
  },
)
watch(
  () => props.messages.length,
  () => {
    if (nearBottom.value || props.sending) bottom()
    else unseen.value = true
  },
)
</script>

<template>
  <section
    class="chat-workspace"
    :class="{ 'chat-workspace--open': mobileOpen }"
    aria-label="상담 채팅"
  >
    <aside class="chat-sidebar" aria-label="상담 내역">
      <header class="chat-sidebar__heading">
        <h2>상담 내역</h2>
        <button class="chat-action" :disabled="busy || sending" @click="emit('new')">
          <Plus :size="16" aria-hidden="true" />새 상담
        </button>
      </header>
      <button class="chat-refresh" :disabled="busy || sending" @click="emit('reload')">
        <RefreshCw :size="14" aria-hidden="true" />{{ busy ? '불러오는 중…' : '목록 새로고침' }}
      </button>
      <div class="chat-conversations">
        <p v-if="error && !mobileOpen" class="chat-empty-note" role="alert">{{ error }}</p>
        <button
          v-for="row in rows"
          :key="row.consultationId"
          class="chat-conversation"
          :class="{
            'is-selected': String(selected?.consultationId) === String(row.consultationId),
          }"
          :aria-current="
            String(selected?.consultationId) === String(row.consultationId) ? 'true' : undefined
          "
          :disabled="busy || sending"
          @click="emit('open', row.consultationId)"
        >
          <strong>{{ titles?.[row.consultationId] || `상담 기록 #${row.consultationId}` }}</strong>
          <span class="chat-status" :class="{ 'is-closed': row.status === 'CLOSED' }">{{
            states[row.status] || row.status
          }}</span>
          <time>{{ displayDateTime(row.createdAt) }}</time>
        </button>
        <p v-if="!busy && !rows.length" class="chat-empty-note">
          아직 상담 내역이 없어요.<br />새 상담으로 문의를 남겨 주세요.
        </p>
      </div>
    </aside>

    <article class="chat-conversation-panel">
      <header class="chat-heading">
        <button class="chat-action chat-back" aria-label="상담 목록으로" @click="emit('back')">
          <ArrowLeft :size="20" aria-hidden="true" />
        </button>
        <span class="chat-avatar"><Headphones :size="22" aria-hidden="true" /></span>
        <div class="chat-heading__title">
          <h2>{{ isNew ? '새 상담' : '챱챱 상담' }}</h2>
          <span>{{ isNew ? '궁금한 내용을 편하게 남겨 주세요.' : states[selected.status] }}</span>
        </div>
        <button
          v-if="selected?.status === 'AI_HANDLING'"
          class="chat-action chat-handoff"
          :disabled="busy || sending"
          @click="emit('handoff')"
        >
          상담사 연결
        </button>
      </header>

      <div v-if="error || notice" class="chat-feedback" :role="error ? 'alert' : 'status'">
        {{ error || notice }}
        <button
          v-if="error"
          class="chat-action"
          :disabled="busy || sending"
          @click="emit('reload')"
        >
          다시 조회
        </button>
      </div>
      <div ref="history" class="chat-history" @scroll="scrolled">
        <div v-if="isNew" class="chat-welcome">
          <Headphones :size="36" aria-hidden="true" />
          <h3>어떤 도움이 필요하신가요?</h3>
          <p>
            배송, 구독, 서비스 이용 중 궁금한 내용을 남겨 주세요.<br />첫 메시지를 보내면 AI 상담을
            시작합니다.
          </p>
        </div>
        <ol
          v-else
          class="chat-messages"
          aria-label="대화 내용"
          aria-live="polite"
          aria-relevant="additions"
          role="log"
        >
          <li
            v-for="message in messages"
            :key="message.messageId"
            class="chat-message"
            :class="{
              'is-mine': message.senderType === 'USER',
              'is-system': message.senderType === 'SYSTEM',
            }"
          >
            <span v-if="message.senderType !== 'USER'" class="chat-avatar"
              ><Headphones :size="18" aria-hidden="true"
            /></span>
            <div class="chat-message__body">
              <span class="chat-sender">{{
                { USER: '나', ADMIN: '상담사', AI: 'AI 상담 도우미', SYSTEM: '안내' }[
                  message.senderType
                ] || '상담'
              }}</span>
              <p class="chat-bubble">{{ message.content }}</p>
              <time :datetime="message.createdAt">{{ displayDateTime(message.createdAt) }}</time>
            </div>
          </li>
        </ol>
      </div>
      <button v-if="unseen" class="chat-new-messages" @click="bottom">새 메시지 보기 ↓</button>
      <footer class="chat-composer">
        <p v-if="selected?.status === 'CLOSED'" class="chat-empty-note">
          종료된 상담입니다. 새로운 문의는 새 상담으로 남겨 주세요.<button
            class="chat-action"
            @click="emit('new')"
          >
            새 상담
          </button>
        </p>
        <p v-else-if="selected?.status === 'WAITING_ADMIN'" class="chat-empty-note" role="status">
          상담사 연결을 기다리고 있어요. 연결되면 메시지를 보낼 수 있습니다.
        </p>
        <template v-if="selected && selected.status !== 'CLOSED'">
          <div class="chat-connection" role="status">
            {{ connectionText[connectionState]
            }}<button
              v-if="['failed', 'closed'].includes(connectionState)"
              class="chat-action"
              @click="emit('reconnect')"
            >
              다시 연결
            </button>
          </div>
        </template>
        <form v-if="editable" @submit.prevent="submit">
          <div class="chat-input-row">
            <textarea
              :value="value"
              aria-label="메시지"
              placeholder="메시지를 입력해 주세요"
              rows="2"
              :maxlength="isNew ? 5000 : 2000"
              :disabled="busy || sending"
              @input="update"
              @keydown="keydown"
            />
            <button
              class="chat-send"
              type="submit"
              :disabled="blocked"
              :aria-label="
                busy || sending ? '전송 확인 중' : isNew ? '새 상담 시작' : '메시지 전송'
              "
            >
              <ArrowUp :size="22" aria-hidden="true" />
            </button>
          </div>
          <p class="chat-input-hint">
            {{
              busy || sending ? '전송 결과를 확인하고 있어요…' : 'Enter 전송 · Shift+Enter 줄바꿈'
            }}
          </p>
        </form>
      </footer>
    </article>
  </section>
</template>

<style scoped>
.chat-workspace {
  color: var(--color-text);
  --color-text-muted: #55594f;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  height: min(780px, calc(100dvh - 220px));
  min-height: 480px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  overflow: hidden;
}
.chat-workspace button,
.chat-workspace textarea {
  font: inherit;
}
.chat-sidebar {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}
.chat-sidebar__heading,
.chat-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}
.chat-sidebar__heading {
  justify-content: space-between;
}
.chat-sidebar h2,
.chat-heading h2 {
  margin: 0;
  font-size: 18px;
}
.chat-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px !important;
  cursor: pointer;
}
.chat-action:hover {
  background: var(--color-primary-soft);
}
.chat-refresh {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin: 0 20px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px !important;
}
.chat-conversations {
  overflow: auto;
  padding: 8px;
}
.chat-conversation {
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 16px;
  margin-bottom: 6px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text);
}
.chat-conversation strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.chat-conversation time {
  color: var(--color-text-muted);
  font-size: 12px;
}
.chat-conversation.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
.chat-status {
  justify-self: start;
  font-size: 11px;
  color: var(--color-primary-pressed);
}
.chat-status.is-closed {
  color: var(--color-text-muted);
}
.chat-conversation-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.chat-heading {
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.chat-heading__title {
  min-width: 0;
  flex: 1;
}
.chat-heading__title span {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  color: var(--color-primary-pressed);
}
.chat-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--color-primary-pressed);
  background: var(--color-primary-soft);
}
.chat-history {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px;
}
.chat-welcome {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  text-align: center;
  color: var(--color-primary-pressed);
}
.chat-welcome p {
  color: var(--color-text-muted);
  line-height: 1.7;
  font-size: 14px;
}
.chat-messages {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.chat-message.is-mine {
  justify-content: flex-end;
}
.chat-message__body {
  min-width: 0;
  max-width: 80%;
}
.chat-sender {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.is-mine .chat-sender,
.is-mine time {
  text-align: right;
}
.chat-bubble {
  color: #292d25;
  font-weight: 500;
  padding: 12px 16px;
  margin: 0;
  background: var(--color-surface-subtle);
  border-radius: 4px 16px 16px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.65;
}
.is-mine .chat-bubble {
  background: var(--color-primary-soft);
  border-radius: 16px 4px 16px 16px;
}
.chat-message time {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 6px;
}
.is-system .chat-bubble {
  border: 1px dashed var(--color-border);
}
.chat-composer {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.chat-input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.chat-input-row textarea {
  min-width: 0;
  width: 100%;
  resize: none;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  background: var(--color-surface);
  line-height: 1.5;
}
.chat-send {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 12px;
  background: var(--color-primary-pressed);
  color: white;
}
.chat-workspace button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.chat-input-hint,
.chat-connection {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--color-text-muted);
}
.chat-connection {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}
.chat-feedback {
  padding: 12px 20px;
  background: var(--color-primary-soft);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.chat-empty-note {
  padding: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.7;
}
.chat-new-messages {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  padding: 10px 16px;
}
.chat-back {
  display: none;
}
@media (max-width: 760px) {
  .chat-workspace {
    grid-template-columns: minmax(0, 1fr);
    height: calc(100dvh - 250px);
    min-height: 420px;
  }
  .chat-sidebar {
    border-right: 0;
  }
  .chat-conversation-panel {
    display: none;
  }
  .chat-workspace--open .chat-sidebar {
    display: none;
  }
  .chat-workspace--open {
    position: fixed;
    inset: 64px 0 auto;
    z-index: 21;
    height: calc(100dvh - 144px - env(safe-area-inset-bottom));
    min-height: 0;
    border-radius: 0;
  }
  .chat-workspace--open .chat-conversation-panel {
    display: flex;
  }
  .chat-back {
    display: inline-flex;
    padding: 8px;
    width: 44px;
    flex-shrink: 0;
  }
  .chat-heading {
    padding: 12px;
    gap: 8px;
  }
  .chat-heading > .chat-avatar {
    display: none;
  }
  .chat-heading h2 {
    font-size: 16px;
  }
  .chat-handoff {
    padding: 6px 8px;
    white-space: nowrap;
  }
  .chat-history {
    padding: 16px 12px;
  }
  .chat-message__body {
    max-width: 85%;
  }
  .chat-message .chat-avatar {
    width: 28px;
    height: 28px;
  }
  .chat-composer {
    padding: 12px;
  }
  .chat-input-hint {
    font-size: 10px;
  }
}
</style>
