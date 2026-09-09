<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  confirmLabel: {
    type: String,
    default: '확인',
  },
  danger: {
    type: Boolean,
    default: false,
  },
  confirmDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open', 'confirm'])
const dialog = ref(null)
const trigger = ref(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      trigger.value = document.activeElement
      await nextTick()
      if (!dialog.value?.open) dialog.value?.showModal()
      return
    }
    if (dialog.value?.open) dialog.value.close()
  },
)

function closeDialog() {
  if (dialog.value?.open) dialog.value.close()
}

function handleClose() {
  emit('update:open', false)
  trigger.value?.focus?.()
}

function handleConfirm() {
  emit('confirm')
}

onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close()
})
</script>

<template>
  <dialog ref="dialog" class="confirm-dialog" :aria-label="title" @close="handleClose">
    <form class="confirm-dialog__form" @submit.prevent="handleConfirm">
      <header class="confirm-dialog__header">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </header>

      <div class="confirm-dialog__content">
        <slot />
      </div>

      <footer class="confirm-dialog__footer">
        <button class="button button--secondary" type="button" @click="closeDialog">취소</button>
        <button
          :class="['button', { 'button--danger': danger }]"
          type="submit"
          :disabled="confirmDisabled"
        >
          {{ confirmLabel }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.confirm-dialog {
  width: min(100% - 32px, 560px);
  padding: 0;
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(51, 53, 47, 0.24);
}
.confirm-dialog::backdrop {
  background: rgba(51, 53, 47, 0.42);
}
.confirm-dialog__form {
  display: grid;
  gap: 22px;
  padding: 24px;
}
.confirm-dialog__header h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.confirm-dialog__header p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.confirm-dialog__content:empty {
  display: none;
}
.confirm-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}
@media (max-width: 500px) {
  .confirm-dialog__footer {
    flex-direction: column;
  }
  .confirm-dialog__footer .button {
    width: 100%;
  }
}
</style>
