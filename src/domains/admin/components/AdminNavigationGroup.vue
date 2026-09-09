<script setup>
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  currentRoute: {
    type: String,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle', 'navigate'])

function isCurrentItem(route) {
  return props.currentRoute === route
}
</script>

<template>
  <section class="admin-navigation-group">
    <button
      class="admin-navigation-group__trigger"
      :class="{
        'is-open': isOpen,
        'is-current-group': group.items.some((item) => isCurrentItem(item.route)),
      }"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="`admin-navigation-group-${group.id}`"
      @click="emit('toggle', group.id)"
    >
      <span>{{ group.label }}</span>
      <ChevronDown :size="17" aria-hidden="true" />
    </button>

    <Transition name="admin-navigation-expand">
      <ul
        v-if="isOpen"
        :id="`admin-navigation-group-${group.id}`"
        class="admin-navigation-group__items"
      >
        <li v-for="item in group.items" :key="item.route">
          <button
            type="button"
            :class="{ 'is-active': isCurrentItem(item.route) }"
            :aria-current="isCurrentItem(item.route) ? 'page' : undefined"
            @click="emit('navigate', item.route)"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </Transition>
  </section>
</template>

<style scoped>
.admin-navigation-group {
  display: grid;
  gap: 5px;
}

.admin-navigation-group__trigger {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 13px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-body);
  font-weight: 800;
  text-align: left;
}

.admin-navigation-group__trigger:hover,
.admin-navigation-group__trigger.is-open,
.admin-navigation-group__trigger.is-current-group {
  background: var(--color-surface-subtle);
}

.admin-navigation-group__trigger.is-current-group:not(.is-open) {
  color: var(--color-primary-pressed);
}

.admin-navigation-group__trigger svg {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  transition: transform 180ms ease;
}

.admin-navigation-group__trigger.is-open svg {
  transform: rotate(180deg);
}

.admin-navigation-group__trigger:focus-visible,
.admin-navigation-group__items button:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 2px;
}

.admin-navigation-group__items {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 2px 0 4px 12px;
  overflow: hidden;
  list-style: none;
}

.admin-navigation-group__items button {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: left;
}

.admin-navigation-group__items button:hover,
.admin-navigation-group__items button.is-active {
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.admin-navigation-expand-enter-active,
.admin-navigation-expand-leave-active {
  overflow: hidden;
  transition:
    max-height 180ms ease,
    opacity 150ms ease,
    transform 180ms ease;
}

.admin-navigation-expand-enter-from,
.admin-navigation-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-5px);
}

.admin-navigation-expand-enter-to,
.admin-navigation-expand-leave-from {
  max-height: 420px;
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .admin-navigation-group__trigger svg,
  .admin-navigation-expand-enter-active,
  .admin-navigation-expand-leave-active {
    transition-duration: 1ms;
  }
}
</style>
