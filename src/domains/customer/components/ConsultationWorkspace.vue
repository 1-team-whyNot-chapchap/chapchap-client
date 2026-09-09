<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const props = defineProps({ admin: Boolean, detail: Boolean })
const route = useRoute(),
  router = useRouter()
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([]),
  assigned = ref([]),
  selected = ref(null),
  messages = ref([]),
  draft = ref('')
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
onMounted(reload)
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
    <div class="ui-grid">
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
        <ol class="ui-list" aria-label="대화 내용">
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
      </article>
    </div>
  </section>
</template>
