<script setup>
import { onMounted, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import http from '../../../common/api/http.js'
import { createAdminAuditAndIntegrationEventsApi } from '../api/adminAuditAndIntegrationEventsApi.js'

const api = createAdminAuditAndIntegrationEventsApi(http)
const events = ref([])
const state = ref('loading')
const busyId = ref(null)
async function load() {
  state.value = 'loading'
  try {
    const response = await api.listIntegrationEvents()
    events.value = response.items
    state.value = events.value.length ? 'ready' : 'empty'
  } catch {
    state.value = 'error'
  }
}
async function republish(id) {
  busyId.value = id
  try {
    await api.republishIntegrationEvent(id)
    await load()
  } finally {
    busyId.value = null
  }
}
onMounted(load)
</script>
<template>
  <AdminFrame
    title="연동 이벤트"
    description="배송 연동 이벤트의 처리 상태를 확인하고 실패한 발행을 재시도합니다."
  >
    <ContentState :state="state" empty-title="조회된 연동 이벤트가 없습니다." @retry="load">
      <section class="ui-surface ui-stack">
        <article v-for="event in events" :key="event.integrationEventRecordId" class="ui-list-item">
          <div>
            <strong>{{ event.eventType }}</strong>
            <p>{{ event.direction }} · {{ event.status }} · {{ event.occurredAt }}</p>
          </div>
          <button
            v-if="event.status === 'FAILED'"
            class="button button-secondary"
            :disabled="busyId === event.integrationEventRecordId"
            @click="republish(event.integrationEventRecordId)"
          >
            {{ busyId === event.integrationEventRecordId ? '재발행 중…' : '재발행' }}
          </button>
        </article>
      </section>
    </ContentState>
  </AdminFrame>
</template>
