<script setup>
defineProps({
  tone: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <aside :class="['state-notice', `state-notice--${tone}`]" role="status" aria-live="polite">
    <strong>{{ title }}</strong>
    <span>{{ message }}</span>
  </aside>
</template>

<style scoped>
.state-notice {
  display: grid;
  gap: 4px;
  margin: 0 0 18px;
  padding: 14px 16px;
  border-left: 4px solid var(--color-info);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.state-notice--warning {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
.state-notice--danger {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.state-notice--success {
  border-color: var(--color-success);
  background: var(--color-success-soft);
  color: var(--color-success);
}
</style>
