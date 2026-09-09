<script setup>
import { Inbox } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <span class="empty-state__icon">
      <Inbox :size="28" aria-hidden="true" />
    </span>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
    <button v-if="actionLabel" class="button button-outline" type="button" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.profile-form,
.detail-card,
.empty-state {
  margin-top: 36px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}

.profile-data-card__icon,
.history-list-item__icon,
.empty-state__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding-block: 54px;
  text-align: center;
}

.empty-state p {
  max-width: 430px;
}

.empty-state .button {
  margin-top: 8px;
}

@media (max-width: 760px) {
  .profile-form,
  .detail-card,
  .empty-state {
    padding: 20px;
  }
}
</style>
