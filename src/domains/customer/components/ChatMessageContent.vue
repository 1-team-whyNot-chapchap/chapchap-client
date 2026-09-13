<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { chatMessageParts } from '../chatNavigation.js'

const props = defineProps({ message: { type: Object, required: true } })
const parts = computed(() => chatMessageParts(props.message))
</script>

<template>
  <div class="chat-bubble">
    <span>{{ parts.text }}</span>
    <RouterLink v-if="parts.page" :to="parts.page.path" class="chat-page-link">
      {{ parts.page.label }} <span aria-hidden="true">→</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.chat-page-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 44px;
  margin-top: 0.5rem;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.chat-page-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
</style>
