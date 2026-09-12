<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
import http, { authSession } from '../../../common/api/http.js'
import { createConsultationConnection } from '../realtime/consultationConnection.js'
const props = defineProps({ admin: Boolean, detail: Boolean })
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
  connectionState = ref('closed')
let connection, confirmationTimer, statusTimer
let statusLoading = false
const connectionLabels = {
  connecting: '상담에 연결 중입니다.',
  connected: '실시간 연결됨',
  reconnecting: '연결을 복구하고 있습니다.',
  failed: '연결하지 못했습니다. 다시 연결해 주세요.',
  closed: '연결 종료',
}
function connectConversation() {
  connection?.stop()
  if (!selected.value || !authSession.state.user || selected.value.status === 'CLOSED') return
  const consultationId = selected.value.consultationId
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
        if (sending.value) notice.value = '연결이 끊겼습니다. 대화에서 전송 결과를 확인해 주세요.'
        sending.value = false
        clearTimeout(confirmationTimer)
      }
    },
    onConnected: async () => {
      try {
        const [current, history] = await Promise.all([
          api.consultation(consultationId, props.admin),
          api.messages(consultationId, props.admin),
        ])
        if (String(selected.value?.consultationId) !== String(consultationId)) return
        selected.value = current
        // 조회 중 수신한 새 메시지를 오래된 HTTP 스냅샷으로 덮어쓰지 않는다.
        messages.value = [
          ...new Map(
            [...history.messages, ...messages.value].map((row) => [String(row.messageId), row]),
          ).values(),
        ].sort((a, b) => a.sequenceNo - b.sequenceNo)
      } catch {
        error.value = '대화 이력을 다시 불러오지 못했습니다. 새로고침해 주세요.'
      }
    },
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
  if (sending.value) return
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
  () => {
    messageDraft.value = ''
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
      connection?.stop()
      selected.value = null
      messages.value = []
      rows.value = []
      assigned.value = []
    }
  },
)
onUnmounted(() => {
  connection?.stop()
  clearTimeout(confirmationTimer)
  clearInterval(statusTimer)
})
const states = {
  AI_HANDLING: '상담 중',
  WAITING_ADMIN: '관리자 연결 대기',
  IN_PROGRESS: '관리자 상담 중',
  CLOSED: '종료',
}
async function select(id) {
  const [conversation, history] = await Promise.all([
    api.consultation(id, props.admin),
    api.messages(id, props.admin),
  ])
  selected.value = conversation
  messages.value = history.messages
}
const reload = () =>
  run(async () => {
    if (props.detail) {
      await select(route.params.consultationId)
      return
    }
    rows.value = await api.consultations(props.admin)
    if (props.admin) assigned.value = await api.assignedConsultations()
    if (selected.value) await select(selected.value.consultationId)
  })
function create() {
  run(async () => {
    const created = await api.createConsultation(draft.value.trim())
    draft.value = ''
    rows.value = await api.consultations()
    await select(created.consultationId)
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
  if (window.confirm('상담을 종료할까요?'))
    run(async () => {
      selected.value = await api.close(selected.value.consultationId)
      notice.value = '상담을 종료했습니다.'
    })
}
watch(
  () => route.params.consultationId,
  () => {
    selected.value = null
    messages.value = []
    reload()
  },
)
onMounted(() => {
  reload()
  // 수락/종료는 메시지 이벤트가 아니므로 화면에 열린 상담의 상태를 별도로 확인한다.
  statusTimer = setInterval(async () => {
    const id = selected.value?.consultationId
    if (!id || selected.value.status === 'CLOSED' || statusLoading || busy.value) return
    statusLoading = true
    try {
      const current = await api.consultation(id, props.admin)
      if (String(selected.value?.consultationId) === String(id)) selected.value = current
    } catch {
      connection?.stop()
      error.value = '상담 상태를 확인하지 못했습니다. 새로고침해 주세요.'
    } finally {
      statusLoading = false
    }
  }, 15000)
})
</script>
<template>
  <section class="ui-stack">
    <div class="ui-actions">
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
    <div :class="detail ? 'ui-stack' : 'ui-grid'">
      <aside v-if="!detail" class="ui-surface ui-stack">
        <h2>{{ admin ? '연결 대기 상담' : '내 상담' }}</h2>
        <article v-for="row in rows" :key="row.consultationId" class="ui-stack">
          <h3>상담 #{{ row.consultationId }}</h3>
          <p>{{ states[row.status] }} · {{ row.createdAt }}</p>
          <button
            class="button button-secondary"
            :disabled="busy"
            @click="admin ? accept(row) : run(() => select(row.consultationId))"
          >
            {{ admin ? '수락하고 연결' : '대화 보기' }}
          </button>
        </article>
        <p v-if="!busy && !error && !rows.length">상담이 없습니다.</p>
        <template v-if="admin"
          ><h2>내 담당 상담</h2>
          <RouterLink
            v-for="row in assigned"
            :key="row.consultationId"
            class="button button-secondary"
            :to="`/admin/consultations/${row.consultationId}`"
            >#{{ row.consultationId }} · {{ states[row.status] }}</RouterLink
          ></template
        >
      </aside>
      <article v-if="selected" class="ui-surface ui-stack">
        <h2>상담 #{{ selected.consultationId }} · {{ states[selected.status] }}</h2>
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
            @click="close"
          >
            상담 종료
          </button>
        </div>
        <ol class="ui-list" aria-label="대화 내용" style="max-height: 55vh; overflow-y: auto">
          <li v-for="message in messages" :key="message.messageId" class="ui-list-item">
            <div>
              <strong>{{
                { USER: '고객', ADMIN: '관리자', AI: '상담 도우미', SYSTEM: '안내' }[
                  message.senderType
                ] || '상담'
              }}</strong>
              <p style="white-space: pre-wrap; overflow-wrap: anywhere">{{ message.content }}</p>
              <time>{{ message.createdAt }}</time>
            </div>
          </li>
        </ol>
        <p role="status">{{ connectionLabels[connectionState] }}</p>
        <button
          v-if="connectionState === 'failed'"
          class="button button-secondary"
          @click="connectConversation"
        >
          다시 연결
        </button>
        <form
          v-if="['AI_HANDLING', 'IN_PROGRESS'].includes(selected.status)"
          class="ui-stack"
          @submit.prevent="sendMessage"
        >
          <label class="ui-field"
            >메시지<textarea
              v-model="messageDraft"
              rows="3"
              maxlength="2000"
              required
              :disabled="sending"
            />
          </label>
          <button
            class="button button-primary"
            :disabled="sending || busy || connectionState !== 'connected' || !messageDraft.trim()"
          >
            {{ sending ? '전송 확인 중…' : '메시지 전송' }}
          </button>
        </form>
      </article>
    </div>
  </section>
</template>
