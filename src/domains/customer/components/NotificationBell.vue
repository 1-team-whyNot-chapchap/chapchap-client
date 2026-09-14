<script setup>
import { computed, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, X } from 'lucide-vue-next'
import Popover from 'primevue/popover'
import NotificationWorkspace from './NotificationWorkspace.vue'
import { notificationState as state } from '../realtime/sharedNotifications.js'
defineProps({ iconOnly: Boolean })
const panel = ref(null)
const open = ref(false)
const panelId = useId()
const route = useRoute()
const count = computed(() => state.rows.filter((row) => !row.read).length)
watch(
  () => [route.fullPath, state.owner],
  () => panel.value?.hide(),
)
</script>

<template>
  <button
    v-if="state.owner"
    type="button"
    class="notification-bell"
    :aria-expanded="open"
    :aria-controls="panelId"
    aria-haspopup="dialog"
    @click="panel.toggle($event)"
    :aria-label="`알림${count ? `, 읽지 않은 알림 ${count}개` : ''}`"
  >
    <Bell :size="19" aria-hidden="true" /><span v-if="!iconOnly">알림</span>
    <span v-if="count" class="notification-bell__count">{{ count > 99 ? '99+' : count }}</span>
  </button>
  <Popover
    :id="panelId"
    ref="panel"
    aria-label="알림 목록"
    class="notification-popover"
    :style="{
      width: 'min(560px, calc(100vw - 24px))',
      maxHeight: 'min(640px, 75dvh)',
      overflowY: 'auto',
      background: 'var(--color-surface, white)',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      boxShadow: '0 12px 36px #00000026',
      padding: '16px',
    }"
    @show="open = true"
    @hide="open = false"
  >
    <div class="notification-popover__close">
      <button type="button" aria-label="알림 닫기" @click="panel.hide()">
        <X :size="20" aria-hidden="true" />
      </button>
    </div>
    <NotificationWorkspace compact />
  </Popover>
</template>

<style scoped>
.notification-bell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  background: var(--color-surface, white);
  text-decoration: none;
  font-weight: 700;
}
.notification-bell__count {
  background: var(--color-primary, #758644);
  color: white;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 12px;
}
.notification-popover__close {
  display: flex;
  justify-content: flex-end;
}
.notification-popover__close button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}
</style>
