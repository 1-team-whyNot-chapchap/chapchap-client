<script setup>
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-vue-next'

defineProps({
  state: {
    type: String,
    default: 'ready',
    validator: (value) => ['ready', 'loading', 'empty', 'error'].includes(value),
  },
  emptyTitle: {
    type: String,
    default: '표시할 내용이 없어요.',
  },
})

defineEmits(['retry'])
</script>

<template>
  <div v-if="state === 'loading'" class="content-state" role="status" aria-live="polite">
    <LoaderCircle class="content-state__spinner" :size="27" aria-hidden="true" />
    <strong>내용을 불러오고 있어요.</strong>
  </div>

  <div v-else-if="state === 'empty'" class="content-state">
    <Inbox :size="28" aria-hidden="true" />
    <strong>{{ emptyTitle }}</strong>
    <p>조건을 바꾸거나 새로운 내용을 등록해 주세요.</p>
  </div>

  <div v-else-if="state === 'error'" class="content-state" role="alert">
    <AlertCircle :size="28" aria-hidden="true" />
    <strong>내용을 불러오지 못했어요.</strong>
    <p>잠시 후 다시 시도해 주세요.</p>
    <button class="button button-outline" type="button" @click="$emit('retry')">다시 시도</button>
  </div>

  <slot v-else />
</template>

<style scoped>
.content-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  margin-top: 30px;
  padding: 36px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  text-align: center;
}

.content-state svg {
  color: var(--color-primary-pressed);
}

.content-state__spinner {
  animation: content-state-spin 0.9s linear infinite;
}
</style>
