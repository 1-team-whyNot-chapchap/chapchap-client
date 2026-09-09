<script setup>
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowUp, Check, MessageCircle, Plus, X } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'

const conversations = ref([
  {
    id: 'sample-delivery',
    title: '배송 일정이 궁금해요',
    category: '배송 문의',
    date: '9월 9일',
    closed: false,
    draft: '',
    messages: [
      {
        id: 1,
        sender: 'agent',
        text: '안녕하세요. 챱챱 상담입니다. 궁금한 내용을 편하게 남겨 주세요.',
        time: '오전 10:00',
      },
      {
        id: 2,
        sender: 'user',
        text: '다음 배송 일정을 어디에서 확인할 수 있나요?',
        time: '오전 10:01',
      },
      {
        id: 3,
        sender: 'agent',
        text: '마이의 배송 내역에서 확인할 수 있어요. 확인이 어려우시면 어떤 부분에서 막히셨는지 알려 주세요.',
        time: '오전 10:02',
      },
    ],
  },
  {
    id: 'sample-plan',
    title: '플랜을 고르는 방법',
    category: '이용 문의',
    date: '9월 7일',
    closed: true,
    draft: '',
    messages: [
      { id: 4, sender: 'user', text: '플랜에 포함된 메뉴를 보고 싶어요.', time: '오후 2:10' },
      {
        id: 5,
        sender: 'agent',
        text: '플랜 상세에서 포함된 메뉴를 확인할 수 있어요.',
        time: '오후 2:11',
      },
    ],
  },
])
const selectedId = ref('sample-delivery')
const active = computed(() => conversations.value.find((c) => c.id === selectedId.value))
const dialog = ref(null)
const category = ref('이용 문의')
const topic = ref('')
const messagePanel = ref(null)
const composer = ref(null)
let nextId = 10

async function scrollMessages() {
  await nextTick()
  if (messagePanel.value) messagePanel.value.scrollTop = messagePanel.value.scrollHeight
}
function selectConversation(id) {
  selectedId.value = id
  scrollMessages()
}
function send() {
  if (active.value.closed || !active.value.draft.trim()) return
  active.value.messages.push({
    id: nextId++,
    sender: 'user',
    text: active.value.draft.trim(),
    time: '방금',
  })
  active.value.draft = ''
  scrollMessages()
  composer.value?.focus()
}
function handleEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    send()
  }
}
function openNew() {
  topic.value = ''
  category.value = '이용 문의'
  dialog.value.showModal()
}
function createConversation() {
  if (!topic.value.trim()) return
  const id = `sample-${nextId++}`
  conversations.value.unshift({
    id,
    title: topic.value.trim(),
    category: category.value,
    date: '오늘',
    closed: false,
    draft: '',
    messages: [],
  })
  selectedId.value = id
  dialog.value.close()
  nextTick(() => composer.value?.focus())
}
</script>

<template>
  <div class="page consultation-page design-review-page">
    <DesignPreview title="상담" empty="아직 나눈 상담이 없어요.">
      <RouterLink to="/mypage" class="chat-back"
        ><ArrowLeft :size="17" aria-hidden="true" />마이로 돌아가기</RouterLink
      >
      <header class="consultation-intro">
        <div>
          <h1>어떤 도움이 필요하세요?</h1>
          <p>궁금한 내용을 남기고, 나눈 이야기를 다시 확인하세요.</p>
        </div>
        <button class="button button-primary" type="button" @click="openNew">
          <Plus :size="18" aria-hidden="true" />새 상담
        </button>
      </header>
      <p class="sample-disclosure">
        예시 상담 미리보기 · 입력한 내용은 현재 화면에만 표시되고 전송되지 않아요.
      </p>
      <div class="consultation-workspace">
        <aside class="conversation-list" aria-label="내 상담 목록">
          <h2>
            내 상담 <span>{{ conversations.length }}</span>
          </h2>
          <div class="conversation-list__items">
            <button
              v-for="conversation in conversations"
              :key="conversation.id"
              type="button"
              :aria-pressed="active.id === conversation.id"
              @click="selectConversation(conversation.id)"
            >
              <span class="conversation-meta"
                >{{ conversation.category }}<small>{{ conversation.date }}</small></span
              ><strong>{{ conversation.title }}</strong
              ><span class="conversation-status"
                ><Check v-if="conversation.closed" :size="14" aria-hidden="true" /><MessageCircle
                  v-else
                  :size="14"
                  aria-hidden="true"
                />{{ conversation.closed ? '종료된 상담' : '상담 중' }}</span
              >
            </button>
          </div>
        </aside>
        <section class="conversation" aria-label="선택한 상담">
          <header class="conversation-header">
            <div>
              <span>{{ active.category }}</span>
              <h2>{{ active.title }}</h2>
            </div>
            <span class="status-pill">{{ active.closed ? '종료' : '상담 중' }}</span>
          </header>
          <div
            ref="messagePanel"
            class="message-panel"
            role="log"
            aria-label="상담 메시지"
            aria-relevant="additions"
          >
            <p class="message-date">{{ active.date }}</p>
            <div v-if="!active.messages.length" class="conversation-empty">
              <MessageCircle :size="32" aria-hidden="true" /><strong
                >이야기를 시작해 주세요.</strong
              >
              <p>궁금한 내용을 아래에 남겨 주세요.</p>
            </div>
            <article
              v-for="message in active.messages"
              :key="message.id"
              class="message"
              :class="{ 'message--user': message.sender === 'user' }"
            >
              <strong>{{ message.sender === 'user' ? '나' : '챱챱 상담' }}</strong>
              <p>{{ message.text }}</p>
              <time>{{ message.time }}</time>
            </article>
          </div>
          <div v-if="active.closed" class="closed-conversation">
            <span>종료된 상담이에요. 새로운 문의를 남겨 주세요.</span
            ><button type="button" class="button button-secondary" @click="openNew">
              새 상담 시작
            </button>
          </div>
          <form v-else class="composer" @submit.prevent="send">
            <label class="sr-only" for="sample-message">상담 내용</label
            ><textarea
              id="sample-message"
              ref="composer"
              v-model="active.draft"
              maxlength="1000"
              rows="2"
              placeholder="궁금한 내용을 입력해 주세요."
              @keydown="handleEnter"
            />
            <div class="composer-bottom">
              <small>Shift + Enter 줄바꿈 · {{ active.draft.length }}/1,000</small
              ><button
                class="send-button"
                type="submit"
                :disabled="!active.draft.trim()"
                aria-label="예시 메시지 표시"
              >
                <ArrowUp :size="20" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      </div>
      <dialog
        ref="dialog"
        class="new-conversation"
        aria-labelledby="new-conversation-title"
        @click="
          (event) => {
            if (event.target === dialog) dialog.close()
          }
        "
      >
        <form @submit.prevent="createConversation">
          <header>
            <h2 id="new-conversation-title">새 상담 시작하기</h2>
            <button class="dialog-close" type="button" aria-label="닫기" @click="dialog.close()">
              <X :size="20" aria-hidden="true" />
            </button>
          </header>
          <p>어떤 내용이 궁금하신가요?</p>
          <label
            >문의 유형<select v-model="category">
              <option>이용 문의</option>
              <option>배송 문의</option>
              <option>결제 문의</option>
            </select></label
          ><label
            >상담 제목<input
              v-model="topic"
              maxlength="60"
              placeholder="예: 배송 일정이 궁금해요"
              required /></label
          ><small>{{ topic.length }}/60 상담으로 생성돼요.</small>
          <div class="dialog-actions">
            <button class="button button-secondary" type="button" @click="dialog.close()">
              취소</button
            ><button class="button button-primary" type="submit" :disabled="!topic.trim()">
              시작하기
            </button>
          </div>
        </form>
      </dialog>
    </DesignPreview>
  </div>
</template>

<style scoped>
.consultation-page {
  max-width: var(--content-max-width);
}
.chat-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 13px;
}
.consultation-intro {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0;
}
.eyebrow {
  color: var(--color-primary-pressed);
  font-weight: 800;
}
.consultation-intro h1 {
  margin: 8px 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.04em;
}
.sample-disclosure {
  color: var(--color-text-muted);
  font-size: 12px;
  margin: 16px 0 24px;
}
.consultation-workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  overflow: hidden;
}
.conversation-list {
  min-width: 0;
  background: var(--color-surface-subtle);
  border-right: 1px solid var(--color-border);
  padding: 20px 12px;
}
.conversation-list h2 {
  margin: 0 12px 20px;
  font-size: 16px;
}
.conversation-list h2 span {
  color: var(--color-text-muted);
  font-size: 13px;
  margin-left: 8px;
}
.conversation-list__items {
  display: grid;
  gap: 8px;
}
.conversation-list button {
  width: 100%;
  padding: 16px;
  text-align: left;
  display: grid;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--color-text);
  background: transparent;
}
.conversation-list button[aria-pressed='true'] {
  background: var(--color-surface);
  border-color: var(--color-border);
  box-shadow: var(--shadow-soft);
}
.conversation-list button:hover {
  background: var(--color-surface);
}
.conversation-list strong {
  font-size: 14px;
  overflow-wrap: anywhere;
}
.conversation-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.conversation-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-primary-pressed);
}
.conversation {
  min-width: 0;
}
.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 16px;
  border-bottom: 1px solid var(--color-border);
}
.conversation-header h2 {
  font-size: 18px;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.conversation-header div {
  min-width: 0;
}
.conversation-header div > span {
  font-size: 12px;
  color: var(--color-text-muted);
}
.status-pill {
  flex-shrink: 0;
  padding: 6px 10px;
  background: var(--color-primary-soft);
  border-radius: 20px;
  font-size: 12px;
}
.message-panel {
  height: 390px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: var(--color-surface-subtle);
}
.message-date {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}
.message {
  max-width: 85%;
  display: grid;
  gap: 6px;
  align-self: flex-start;
}
.message strong,
.message time {
  font-size: 12px;
  color: var(--color-text-muted);
}
.message p {
  background: var(--color-surface);
  padding: 13px 16px;
  border: 1px solid var(--color-border);
  border-radius: 4px 16px 16px;
  line-height: 1.7;
  font-size: 14px;
  color: var(--color-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.message--user {
  align-self: flex-end;
}
.message--user strong,
.message--user time {
  text-align: right;
}
.message--user p {
  background: var(--color-primary-soft);
  border-color: transparent;
  border-radius: 16px 4px 16px 16px;
}
.composer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}
.composer textarea {
  width: 100%;
  min-height: 70px;
  max-height: 180px;
  resize: vertical;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 16px;
}
.composer-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  margin-top: 10px;
}
.composer-bottom small {
  color: var(--color-text-muted);
  font-size: 12px;
}
.send-button,
.dialog-close {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: var(--color-primary);
  color: var(--color-text);
}
.send-button:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}
.conversation-empty {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 12px;
  flex: 1;
  text-align: center;
  color: var(--color-text-muted);
}
.closed-conversation {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
}
.new-conversation {
  width: min(440px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  color: var(--color-text);
}
.new-conversation::backdrop {
  background: rgba(37, 40, 31, 0.4);
}
.new-conversation header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.new-conversation h2 {
  margin: 0;
  font-size: 20px;
}
.dialog-close {
  background: var(--color-surface-subtle);
}
.new-conversation label {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  font-weight: 700;
}
.new-conversation input,
.new-conversation select {
  min-width: 0;
  width: 100%;
  min-height: 46px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 16px;
}
.new-conversation small {
  display: block;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
}
.dialog-actions {
  margin-top: 28px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
@media (max-width: 760px) {
  .consultation-intro {
    flex-wrap: wrap;
    gap: 16px;
  }
  .consultation-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .conversation-list {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
    padding: 16px;
  }
  .conversation-list h2 {
    margin: 0 0 12px;
  }
  .conversation-list__items {
    display: flex;
    overflow-x: auto;
    padding: 4px;
  }
  .conversation-list button {
    flex: 0 0 220px;
  }
  .conversation-header {
    padding: 18px;
  }
  .message-panel {
    padding: 18px;
    height: 340px;
  }
  .composer {
    padding: 16px;
  }
  .closed-conversation {
    flex-direction: column;
    align-items: flex-start;
  }
  .new-conversation {
    padding: 20px;
  }
}
</style>
