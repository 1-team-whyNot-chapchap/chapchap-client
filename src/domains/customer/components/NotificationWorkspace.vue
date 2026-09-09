<script setup>
import { onMounted, ref } from 'vue'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([])
const reload = () =>
  run(async () => {
    rows.value = await api.notifications()
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
    rows.value = await api.notifications()
  })
}
onMounted(reload)
</script>
<template>
  <section class="ui-stack">
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
