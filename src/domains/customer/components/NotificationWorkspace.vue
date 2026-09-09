<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
import http, { authSession } from '../../../common/api/http.js'
import { createNotificationStream } from '../realtime/notificationStream.js'
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([])
const reload = () =>
  run(async () => {
    const fetched = await api.notifications()
    rows.value = [
      ...new Map(
        [...rows.value, ...fetched].map((row) => [String(row.notificationId), row]),
      ).values(),
    ].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
  })
function read(row) {
  run(async () => {
    await api.readNotification(row.notificationId)
    row.read = true
  })
}
function readAll() {
  run(async () => {
    await api.readAllNotifications()
    const fetched = await api.notifications()
    rows.value = [
      ...new Map(
        [...rows.value, ...fetched].map((row) => [String(row.notificationId), row]),
      ).values(),
    ].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
  })
}
const streamState = ref('closed')
const stream = createNotificationStream({
  open: async (signal) => {
    await authSession.ensureSession()
    return http.get('/api/customer/notifications/stream', {
      adapter: 'fetch',
      responseType: 'stream',
      timeout: 0,
      signal,
    })
  },
  onState: (state) => {
    streamState.value = state
  },
  onConnected: reload,
  onNotification: (row) => {
    const index = rows.value.findIndex(
      (item) => String(item.notificationId) === String(row.notificationId),
    )
    if (index < 0) rows.value.unshift(row)
    else rows.value[index] = { ...row, read: row.read || rows.value[index].read }
  },
})
function startStream() {
  if (authSession.state.user?.role === 'CUSTOMER') stream.start()
  else stream.stop()
}
watch(
  () => `${authSession.state.user?.userId}:${authSession.state.user?.role}`,
  () => {
    rows.value = []
    startStream()
  },
)
onMounted(() => {
  reload()
  startStream()
})
onUnmounted(() => stream.stop())
</script>
<template>
  <section class="ui-stack">
    <p v-if="authSession.state.user?.role === 'CUSTOMER'" role="status">
      {{
        {
          connected: '실시간 알림 연결됨',
          connecting: '알림 연결 중',
          reconnecting: '알림 연결 복구 중',
          failed: '알림 연결을 확인해 주세요.',
          closed: '알림 연결 종료',
        }[streamState]
      }}
    </p>
    <button v-if="streamState === 'failed'" class="button button-secondary" @click="startStream">
      다시 연결
    </button>
    <div class="ui-actions">
      <button class="button button-secondary" :disabled="busy" @click="reload">새로고침</button
      ><button
        class="button button-primary"
        :disabled="busy || !rows.some((row) => !row.read)"
        @click="readAll"
      >
        모두 읽음
      </button>
    </div>
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <article v-for="row in rows" :key="row.notificationId" class="ui-surface ui-stack">
      <h2>
        {{ row.title }} <small>{{ row.read ? '읽음' : '새 알림' }}</small>
      </h2>
      <p>{{ row.content }}</p>
      <time>{{ row.occurredAt }}</time
      ><button v-if="!row.read" class="button button-secondary" :disabled="busy" @click="read(row)">
        읽음 표시
      </button>
    </article>
    <p v-if="!busy && !error && !rows.length" class="ui-empty">새로운 알림이 없습니다.</p>
  </section>
</template>
