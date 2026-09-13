<script setup>
import { displayDateTime } from '../../../common/utils/displayDate.js'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
import ConsultationHandoffSummary from './ConsultationHandoffSummary.vue'
import CustomerChatView from './CustomerChatView.vue'
import AdminConsultationQueue from '../../admin/components/AdminConsultationQueue.vue'
import http, { authSession } from '../../../common/api/http.js'
import { createConsultationConnection } from '../realtime/consultationConnection.js'
import { createConsultationHistorySync } from '../realtime/consultationHistory.js'
const props = defineProps({ admin: Boolean, detail: Boolean })
const mobileOpen = ref(false),
  titles = ref({})
const drafts = new Map()
const route = useRoute(),
  router = useRouter()
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([]),
  assigned = ref([]),
  selected = ref(null),
  messages = ref([]),
  draft = ref('')
const messageDraft = ref(''),
  sending = ref(false),
  connectionState = ref('closed'),
  confirmingClose = ref(false)
let connection, confirmationTimer, statusTimer, historySync
let statusLoading = false
let disposed = false,
  selectionVersion = 0
const connectionLabels = {
  connecting: '상담에 연결 중입니다.',
  connected: '실시간 연결됨',
  reconnecting: '연결을 복구하고 있습니다.',
  failed: '연결하지 못했습니다. 다시 연결해 주세요.',
  closed: '연결 종료',
}
function connectConversation() {
  historySync?.stop()
  connection?.stop()
  if (disposed || !selected.value || !authSession.state.user || selected.value.status === 'CLOSED')
    return
  const consultationId = selected.value.consultationId
  const sync = createConsultationHistorySync({
    load: () =>
      Promise.all([
        api.consultation(consultationId, props.admin),
        api.messages(consultationId, props.admin),
      ]),
    apply: ([current, history]) => {
      selected.value = current
      messages.value = [
        ...new Map(
          [...history.messages, ...messages.value].map((row) => [String(row.messageId), row]),
        ).values(),
      ].sort((a, b) => a.sequenceNo - b.sequenceNo)
      if (error.value === '대화 이력을 복구하고 있습니다. 잠시 후 자동으로 다시 확인합니다.')
        error.value = ''
    },
    onError: () => {
      error.value = '대화 이력을 복구하고 있습니다. 잠시 후 자동으로 다시 확인합니다.'
    },
  })
  historySync = sync
  const url = new URL(
    '/ws/customer/consultations',
    import.meta.env?.VITE_GATEWAY_BASE_URL || window.location.origin,
  )
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  connection = createConsultationConnection({
    consultationId,
    url: url.toString(),
    ticket: async () => {
      await authSession.ensureSession()
      const response = await http.post('/api/customer/consultations/ws-ticket')
      return response.data.ticket
    },
    onState: (state) => {
      connectionState.value = state
      if (state !== 'connected') {
        sync.stop()
        if (sending.value) notice.value = '연결이 끊겼습니다. 대화에서 전송 결과를 확인해 주세요.'
        sending.value = false
        clearTimeout(confirmationTimer)
      }
    },
    onConnected: () => sync.start(),
    onMessage: (message) => {
      if (String(selected.value?.consultationId) !== String(consultationId)) return
      if (!messages.value.some((row) => String(row.messageId) === String(message.messageId)))
        messages.value.push(message)
      messages.value.sort((a, b) => a.sequenceNo - b.sequenceNo)
      if (
        sending.value &&
        message.senderType === (props.admin ? 'ADMIN' : 'USER') &&
        message.content === messageDraft.value.trim()
      ) {
        messageDraft.value = ''
        sending.value = false
        clearTimeout(confirmationTimer)
      }
    },
  })
  connection.start()
}
function sendMessage() {
  if (
    sending.value ||
    busy.value ||
    connectionState.value !== 'connected' ||
    !messageDraft.value.trim() ||
    !['AI_HANDLING', 'IN_PROGRESS'].includes(selected.value?.status)
  )
    return
  try {
    connection.send(messageDraft.value)
    sending.value = true
    confirmationTimer = setTimeout(() => {
      sending.value = false
      notice.value =
        '전송 결과를 확인하지 못했습니다. 대화를 새로고침해 확인한 뒤 다시 시도해 주세요.'
    }, 10000)
  } catch {
    error.value = '상담 연결을 확인한 뒤 다시 전송해 주세요.'
  }
}
watch(
  () => selected.value?.consultationId,
  (id, previousId) => {
    if (previousId) drafts.set(String(previousId), messageDraft.value)
    messageDraft.value = id ? drafts.get(String(id)) || '' : ''
    confirmingClose.value = false
    sending.value = false
    clearTimeout(confirmationTimer)
    connectConversation()
  },
)
watch(
  () => selected.value?.status,
  (status) => {
    if (status === 'CLOSED') connection?.stop()
  },
)
watch(
  () => authSession.state.user,
  (user) => {
    if (!user) {
      selectionVersion++
      historySync?.stop()
      connection?.stop()
      selected.value = null
      messages.value = []
      rows.value = []
      assigned.value = []
      drafts.clear()
      draft.value = ''
      titles.value = {}
    }
  },
)
onUnmounted(() => {
  disposed = true
  selectionVersion++
  historySync?.stop()
  connection?.stop()
  clearTimeout(confirmationTimer)
  clearInterval(statusTimer)
})
const states = {
  AI_HANDLING: 'AI 상담 중',
  WAITING_ADMIN: '상담사 연결 대기',
  IN_PROGRESS: '상담사 상담 중',
  CLOSED: '종료',
}
async function select(id) {
  const version = ++selectionVersion
  const [conversation, history] = await Promise.all([
    api.consultation(id, props.admin),
    api.messages(id, props.admin),
  ])
  if (disposed || version !== selectionVersion || !authSession.state.user) return
  const same = String(selected.value?.consultationId) === String(id)
  messages.value = [
    ...new Map(
      [...history.messages, ...(same ? messages.value : [])].map((row) => [
        String(row.messageId),
        row,
      ]),
    ).values(),
  ].sort((a, b) => a.sequenceNo - b.sequenceNo)
  selected.value = conversation
  const first = history.messages.find((message) => message.senderType === 'USER')
  if (first) titles.value[id] = first.content.slice(0, 80)
}
async function open(id) {
  mobileOpen.value = true
  await router.replace({ query: { ...route.query, consultationId: String(id) } })
}
async function newConversation() {
  if (busy.value || sending.value) return
  selectionVersion++
  selected.value = null
  messages.value = []
  error.value = ''
  notice.value = ''
  mobileOpen.value = true
  const query = { ...route.query }
  delete query.consultationId
  await router.replace({ query })
}
const reload = () =>
  run(async () => {
    if (props.detail) {
      await select(route.params.consultationId)
      return
    }
    rows.value = await api.consultations(props.admin)
    if (props.admin) assigned.value = await api.assignedConsultations()
    const id = route.query.consultationId || selected.value?.consultationId
    if (id && /^[1-9][0-9]*$/.test(String(id))) await select(id)
    if (
      selected.value &&
      selected.value.status !== 'CLOSED' &&
      connectionState.value !== 'connected'
    )
      connectConversation()
  })
function create() {
  if (!draft.value.trim()) return
  run(async () => {
    const created = await api.createConsultation(draft.value.trim())
    draft.value = ''
    await open(created.consultationId)
    await select(created.consultationId)
    rows.value = await api.consultations()
  })
}
function accept(row) {
  run(async () => {
    await api.accept(row.consultationId)
    await router.push({
      name: 'admin-consultation-detail',
      params: { consultationId: row.consultationId },
    })
  })
}
function handoff() {
  run(async () => {
    selected.value = await api.handoff(selected.value.consultationId)
  })
}
function close() {
  run(async () => {
    selected.value = await api.close(selected.value.consultationId)
    confirmingClose.value = false
    notice.value = '상담을 종료했습니다.'
  })
}
watch(
  () => (props.detail ? route.params.consultationId : route.query.consultationId),
  () => {
    selectionVersion++
    selected.value = null
    messages.value = []
    reload()
  },
)
watch(
  () => selected.value,
  (value) => {
    if (!value) return
    const index = rows.value.findIndex(
      (row) => String(row.consultationId) === String(value.consultationId),
    )
    if (index >= 0) rows.value[index] = value
  },
)
onMounted(() => {
  mobileOpen.value = Boolean(route.query.consultationId)
  reload()
  // 수락/종료는 메시지 이벤트가 아니므로 화면에 열린 상담의 상태를 별도로 확인한다.
  statusTimer = setInterval(async () => {
    const id = selected.value?.consultationId
    const version = selectionVersion
    if (!id || selected.value.status === 'CLOSED' || statusLoading || busy.value) return
    statusLoading = true
    try {
      const current = await api.consultation(id, props.admin)
      if (
        !disposed &&
        version === selectionVersion &&
        String(selected.value?.consultationId) === String(id)
      ) {
        selected.value = current
        if (
          error.value === '상담 상태를 다시 확인하고 있습니다. 연결이 복구되면 자동으로 갱신됩니다.'
        )
          error.value = ''
      }
    } catch {
      if (
        !disposed &&
        version === selectionVersion &&
        String(selected.value?.consultationId) === String(id)
      )
        error.value = '상담 상태를 다시 확인하고 있습니다. 연결이 복구되면 자동으로 갱신됩니다.'
    } finally {
      statusLoading = false
    }
  }, 15000)
})
</script>
<template>
  <CustomerChatView
    v-if="!admin"
    :rows="rows"
    :selected="selected"
    :messages="messages"
    :titles="titles"
    :busy="busy"
    :sending="sending"
    :mobile-open="mobileOpen"
    :connection-state="connectionState"
    :error="error"
    :notice="notice"
    v-model:draft="draft"
    v-model:message-draft="messageDraft"
    @open="open"
    @new="newConversation"
    @back="mobileOpen = false"
    @reload="reload"
    @handoff="handoff"
    @reconnect="connectConversation"
    @create="create"
    @send="sendMessage"
  />
  <section v-else class="ui-stack">
    <div class="ui-actions ui-actions--end">
      <button class="button button-secondary" :disabled="busy" @click="reload">새로고침</button
      ><RouterLink v-if="detail" class="button button-secondary" to="/admin/consultations"
        >상담 목록</RouterLink
      >
    </div>
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <form v-if="!admin" class="ui-surface ui-stack" @submit.prevent="create">
      <label class="ui-field"
        >새 상담 내용<textarea
          v-model="draft"
          required
          maxlength="5000"
          rows="3"
          :disabled="busy"
        /></label
      ><button class="button button-primary" :disabled="busy || !draft.trim()">새 상담 시작</button>
    </form>
    <div class="ui-stack">
      <AdminConsultationQueue
        v-if="!detail"
        :rows="rows"
        :assigned="assigned"
        :busy="busy"
        :error="error"
        :states="states"
        @accept="accept"
      />
      <article v-if="selected" class="admin-conversation">
        <header class="conversation-header">
          <div class="conversation-title">
            <h2>상담 #{{ selected.consultationId }}</h2>
            <span class="conversation-status">{{
              states[selected.status] || '상태 확인 필요'
            }}</span>
          </div>
          <div class="ui-actions">
            <button
              v-if="!admin && selected.status === 'AI_HANDLING'"
              class="button button-secondary"
              :disabled="busy"
              @click="handoff"
            >
              관리자 연결 요청</button
            ><button
              v-if="admin && selected.status === 'IN_PROGRESS'"
              class="button button-secondary"
              :disabled="busy"
              @click="confirmingClose = true"
            >
              상담 종료
            </button>
          </div>
        </header>
        <div
          v-if="confirmingClose && selected.status === 'IN_PROGRESS'"
          class="ui-stack conversation-confirm"
          role="group"
          aria-label="상담 종료 확인"
        >
          <p>상담을 종료하면 더 이상 메시지를 보낼 수 없습니다. 종료할까요?</p>
          <div class="ui-actions">
            <button class="button button-primary" :disabled="busy" @click="close">종료 확인</button>
            <button
              class="button button-secondary"
              :disabled="busy"
              @click="confirmingClose = false"
            >
              계속 상담
            </button>
          </div>
        </div>
        <div class="conversation-layout">
          <aside class="conversation-summary">
            <ConsultationHandoffSummary
              v-if="admin"
              :key="selected.consultationId"
              :consultation-id="selected.consultationId"
            />
          </aside>
          <section class="conversation-chat" aria-label="상담 대화">
            <div class="conversation-chat-heading">
              <h3>대화 내용</h3>
              <p role="status">{{ connectionLabels[connectionState] }}</p>
            </div>
            <ol class="conversation-messages" aria-label="대화 내용" tabindex="0">
              <li
                v-for="message in messages"
                :key="message.messageId"
                class="conversation-message"
                :class="{ 'conversation-message--admin': message.senderType === 'ADMIN' }"
              >
                <div class="conversation-message-content">
                  <strong>{{
                    { USER: '고객', ADMIN: '상담사', AI: 'AI 상담 도우미', SYSTEM: '안내' }[
                      message.senderType
                    ] || '상담'
                  }}</strong>
                  <p style="white-space: pre-wrap; overflow-wrap: anywhere">
                    {{ message.content }}
                  </p>
                  <time :datetime="message.createdAt" :title="message.createdAt">{{
                    displayDateTime(message.createdAt)
                  }}</time>
                </div>
              </li>
            </ol>
            <p v-if="!messages.length" class="conversation-empty">아직 대화 내용이 없습니다.</p>
            <button
              v-if="selected.status !== 'CLOSED' && ['failed', 'closed'].includes(connectionState)"
              class="button button-secondary conversation-reconnect"
              @click="connectConversation"
            >
              다시 연결
            </button>
            <form
              v-if="['AI_HANDLING', 'IN_PROGRESS'].includes(selected.status)"
              class="conversation-composer"
              @submit.prevent="sendMessage"
            >
              <label class="ui-field"
                >답변 작성<textarea
                  v-model="messageDraft"
                  rows="3"
                  maxlength="2000"
                  required
                  placeholder="고객에게 보낼 답변을 입력해 주세요."
                  :disabled="sending"
                />
              </label>
              <button
                class="button button-primary"
                :disabled="
                  sending || busy || connectionState !== 'connected' || !messageDraft.trim()
                "
              >
                {{ sending ? '전송 확인 중…' : '메시지 전송' }}
              </button>
            </form>
            <p v-else class="conversation-empty">
              {{
                selected.status === 'CLOSED'
                  ? '종료된 상담입니다. 대화 내용을 확인할 수 있습니다.'
                  : '현재 상담 상태에서는 메시지를 보낼 수 없습니다.'
              }}
            </p>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.admin-conversation {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  min-width: 0;
}
.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}
.conversation-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.conversation-title h2 {
  font-size: 20px;
  margin: 0;
}
.conversation-status {
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  padding: 6px 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.conversation-confirm {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}
.conversation-layout {
  display: grid;
  grid-template-columns: minmax(230px, 0.8fr) minmax(0, 2fr);
}
.conversation-summary {
  padding: 24px;
  border-right: 1px solid var(--color-border);
  min-width: 0;
}
.conversation-summary :deep(h3) {
  font-size: 16px;
  margin: 0;
}
.conversation-summary :deep(p) {
  font-size: 14px;
  line-height: 1.9;
  margin: 0;
}
.conversation-chat {
  min-width: 0;
}
.conversation-chat-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 18px 24px;
}
.conversation-chat-heading h3 {
  margin: 0;
  font-size: 16px;
}
.conversation-chat-heading p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}
.conversation-messages {
  list-style: none;
  margin: 0;
  padding: 24px;
  min-height: 280px;
  max-height: 55vh;
  overflow-y: auto;
  background: var(--color-info-soft);
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.conversation-message {
  display: flex;
}
.conversation-message--admin {
  justify-content: flex-end;
}
.conversation-message-content {
  max-width: 88%;
  min-width: 0;
}
.conversation-message strong {
  font-size: 12px;
  color: var(--color-text-muted);
}
.conversation-message p {
  margin: 8px 0;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0 12px 12px 12px;
  font-size: 14px;
  line-height: 1.8;
}
.conversation-message--admin p {
  background: var(--color-primary-soft);
  border-color: transparent;
  border-radius: 12px 0 12px 12px;
}
.conversation-message--admin strong,
.conversation-message--admin time {
  display: block;
  text-align: right;
}
.conversation-message time {
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.conversation-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
}
.conversation-composer .ui-field {
  font-size: 13px;
}
.conversation-composer textarea {
  min-height: 96px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.6;
}
.conversation-composer .button {
  min-height: 48px;
}
.conversation-empty {
  padding: 16px 24px;
  margin: 0;
  font-size: 14px;
  color: var(--color-text-muted);
}
.conversation-reconnect {
  margin: 16px 24px;
}
@media (max-width: 1100px) {
  .conversation-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .conversation-summary {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
}
@media (max-width: 600px) {
  .conversation-header,
  .conversation-summary,
  .conversation-chat-heading,
  .conversation-messages,
  .conversation-composer {
    padding: 16px;
  }
  .conversation-title h2 {
    font-size: 18px;
  }
  .conversation-composer {
    grid-template-columns: minmax(0, 1fr);
  }
  .conversation-composer .button {
    justify-self: end;
  }
  .conversation-message-content {
    max-width: 95%;
  }
}
</style>
