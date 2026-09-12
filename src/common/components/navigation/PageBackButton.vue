<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
defineProps({
  label: { type: String, default: '마이페이지' },
  to: { type: [String, Object], default: null },
})
const emit = defineEmits(['back'])
</script>
<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to || undefined"
    :type="to ? undefined : 'button'"
    class="page-back"
    :aria-label="label"
    :title="label"
    @click="!to && emit('back')"
  >
    <ArrowLeft :size="20" aria-hidden="true" />
  </component>
</template>
<style scoped>
.page-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  min-height: 44px;
  max-width: 100%;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
  cursor: pointer;
  vertical-align: middle;
}
.page-back svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.page-back:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}
.page-back:active {
  background: var(--color-surface-subtle);
}
.page-back:focus-visible {
  outline: 3px solid var(--color-primary-pressed);
  outline-offset: -3px;
}
:global(.page-back + .ui-heading),
:global(.page-back + .page-intro),
:global(.page-back + .intro) {
  margin-top: 24px;
}
</style>
