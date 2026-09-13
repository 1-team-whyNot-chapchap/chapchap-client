<script setup>
import { computed, onMounted, ref } from 'vue'
import { ChevronDown, ChevronUp, Check } from 'lucide-vue-next'
import { authSession } from '../../../common/api/http.js'
import { notificationState as state, notifications } from '../realtime/sharedNotifications.js'
import { notificationDestination } from '../notificationDestination.js'
defineProps({ compact: Boolean })
const expanded = ref(new Set())
const unread = computed(() => state.rows.filter((row) => !row.read).length)
const connectionLabel = computed(
  () =>
    ({
      connected: '실시간 알림 연결됨',
      connecting: '알림 연결 중',
      reconnecting: '알림 연결 복구 중',
      failed: '알림 연결을 확인해 주세요.',
      closed: '알림 연결 종료',
    })[state.connection],
)
function toggle(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}
function destination(row) {
  return notificationDestination(row, authSession.state.user?.role)
}
function timestamp(value) {
  return String(value || '')
    .replace('T', ' ')
    .slice(0, 16)
}
onMounted(notifications.reload)
</script>

<template>
  <section
    class="notification-workspace"
    :class="{ 'is-compact': compact }"
    aria-label="내 알림"
    :aria-busy="state.loading"
  >
    <div class="notification-toolbar">
      <div>
        <h2>
          받은 알림 <span class="unread-count">{{ unread }}개 미확인</span>
        </h2>
        <p class="connection-status" role="status">{{ connectionLabel }}</p>
      </div>
      <div class="notification-actions">
        <button
          type="button"
          class="button button-secondary"
          :disabled="state.loading"
          @click="notifications.reload"
        >
          새로고침
        </button>
        <button
          type="button"
          class="button button-primary"
          :disabled="state.busy || !unread"
          @click="notifications.readAll"
        >
          모두 확인
        </button>
      </div>
    </div>
    <div v-if="state.error || state.connection === 'failed'" class="ui-note" role="alert">
      <p>{{ state.error || '실시간 연결이 끊겼습니다. 다시 연결해 주세요.' }}</p>
      <button
        v-if="state.connection === 'failed'"
        type="button"
        class="button button-secondary"
        @click="notifications.reconnect"
      >
        다시 연결
      </button>
    </div>
    <p v-if="state.loading && !state.rows.length" class="ui-empty">알림을 불러오고 있어요.</p>
    <div v-else-if="state.rows.length" class="notification-list-card">
      <article
        v-for="row in state.rows"
        :key="row.notificationId"
        class="notification-item"
        :class="{ 'is-unread': !row.read }"
      >
        <div class="notification-summary">
          <div class="notification-heading">
            <h3><span v-if="!row.read" class="unread-dot" aria-label="미확인" />{{ row.title }}</h3>
            <time :datetime="row.occurredAt">{{ timestamp(row.occurredAt) }}</time>
          </div>
          <div class="notification-actions">
            <button
              type="button"
              class="button button-secondary"
              :aria-expanded="expanded.has(row.notificationId)"
              :aria-controls="`notification-detail-${row.notificationId}`"
              @click="toggle(row.notificationId)"
            >
              상세보기<component
                :is="expanded.has(row.notificationId) ? ChevronUp : ChevronDown"
                :size="16"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              class="button"
              :class="row.read ? 'button-secondary' : 'button-primary'"
              :disabled="row.read || state.busy"
              @click="notifications.read(row)"
            >
              <Check v-if="row.read" :size="16" aria-hidden="true" />{{
                row.read ? '확인 완료' : '알림 확인'
              }}
            </button>
          </div>
        </div>
        <div
          v-if="expanded.has(row.notificationId)"
          :id="`notification-detail-${row.notificationId}`"
          class="notification-detail"
        >
          <p>{{ row.content }}</p>
          <RouterLink v-if="destination(row)" :to="destination(row)" class="notification-related"
            >관련 화면으로 이동 →</RouterLink
          >
        </div>
      </article>
    </div>
    <p v-else-if="!state.error" class="ui-empty">새로운 알림이 없습니다.</p>
  </section>
</template>

<style scoped>
.notification-workspace {
  display: grid;
  gap: 20px;
}
.is-compact {
  gap: 12px;
}
.is-compact .notification-toolbar {
  flex-wrap: wrap;
  gap: 12px;
  padding-inline: 13px;
  align-items: center;
}
.is-compact .connection-status {
  display: none;
}
.is-compact .notification-toolbar h2 {
  font-size: 18px;
}
.is-compact .notification-item {
  padding: 14px 12px;
}
.is-compact .notification-summary {
  gap: 12px;
  flex-wrap: wrap;
}
.is-compact .notification-summary .notification-actions {
  margin-left: auto;
}
.is-compact .notification-actions {
  gap: 6px;
}
.is-compact .notification-toolbar .notification-actions {
  margin-left: auto;
}
.is-compact .notification-actions .button {
  width: 104px;
  min-width: 104px;
  height: 44px;
  white-space: nowrap;
  padding: 8px 10px;
  font-size: 13px;
}
.notification-toolbar,
.notification-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.notification-toolbar h2 {
  margin: 0;
  font-size: 20px;
}
.unread-count {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-left: 8px;
  font-weight: 500;
}
.connection-status {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: 6px 0 0;
}
.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}
.notification-actions .button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  min-width: 100px;
  margin: 0;
}
.notification-list-card {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-surface, white);
}
.notification-item {
  padding: 20px 24px;
}
.notification-item + .notification-item {
  border-top: 1px solid var(--color-border);
}
.notification-heading {
  min-width: 0;
}
.notification-heading h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.notification-heading time {
  font-size: 12px;
  color: var(--color-text-muted);
}
.unread-dot {
  flex: 0 0 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary, #758644);
}
.notification-detail {
  margin-top: 16px;
  padding: 16px;
  border-radius: 10px;
  background: var(--color-background);
  line-height: 1.7;
}
.notification-detail p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.notification-related {
  display: inline-block;
  margin-top: 12px;
  color: var(--color-primary, #758644);
  font-weight: 700;
}
@media (max-width: 640px) {
  .notification-toolbar {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
  .notification-summary {
    flex-wrap: wrap;
    gap: 12px;
  }
  .notification-item {
    padding: 18px 16px;
  }
  .notification-summary .notification-actions {
    margin-left: auto;
  }
  .notification-actions .button {
    min-width: 96px;
  }
}
</style>
