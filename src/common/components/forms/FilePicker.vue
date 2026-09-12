<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { FileUp, X } from 'lucide-vue-next'
const props = defineProps({
  modelValue: { default: null },
  label: { type: String, default: '파일 선택' },
  hint: { type: String, default: '' },
  accept: String,
  capture: String,
  multiple: Boolean,
  required: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue', 'change'])
const input = ref(null)
const files = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [],
)
watch(
  () => props.modelValue,
  () => {
    if (!files.value.length && input.value) input.value.value = ''
  },
)
function select(event) {
  const selected = [...event.target.files]
  emit('update:modelValue', props.multiple ? selected : selected[0] || null)
  emit('change', event)
  nextTick(() => {
    if (!files.value.length && input.value) input.value.value = ''
  })
}
function clear() {
  emit('update:modelValue', props.multiple ? [] : null)
  if (input.value) {
    input.value.value = ''
    input.value.focus()
  }
}
</script>
<template>
  <div class="file-picker" :class="{ 'is-disabled': disabled }">
    <label class="file-picker__select">
      <FileUp :size="24" aria-hidden="true" />
      <span
        ><strong>{{ label }}</strong
        ><small>{{
          hint || (multiple ? '여러 파일을 선택할 수 있어요.' : '기기에 있는 파일을 선택하세요.')
        }}</small></span
      >
      <span class="file-picker__badge">{{ files.length ? '다시 선택' : '파일 선택' }}</span>
      <input
        ref="input"
        type="file"
        :accept="accept"
        :capture="capture"
        :multiple="multiple"
        :required="required && !files.length"
        :disabled="disabled"
        :aria-label="label"
        @change="select"
      />
    </label>
    <div v-if="files.length" class="file-picker__selection" aria-live="polite">
      <ul>
        <li v-for="file in files" :key="`${file.name}:${file.size}:${file.lastModified}`">
          {{ file.name }} <small>{{ (file.size / 1024 / 1024).toFixed(2) }} MB</small>
        </li>
      </ul>
      <button type="button" class="button button-secondary" :disabled="disabled" @click="clear">
        <X :size="16" aria-hidden="true" />선택 해제
      </button>
    </div>
  </div>
</template>
<style scoped>
.file-picker {
  min-width: 0;
  display: grid;
  gap: 12px;
}
.file-picker__select {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
  cursor: pointer;
  min-height: 76px;
}
.file-picker__select > svg {
  color: var(--color-primary-pressed);
  flex-shrink: 0;
}
.file-picker__select > span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.file-picker__select strong,
.file-picker__select small {
  display: block;
}
.file-picker__select small {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.file-picker__badge {
  margin-left: auto;
  font-weight: 700;
  color: var(--color-primary-pressed);
}
.file-picker__select input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.file-picker__select:focus-within {
  outline: 3px solid var(--color-primary-pressed);
  outline-offset: 3px;
}
.file-picker__selection {
  display: grid;
  gap: 8px;
}
.file-picker__selection ul {
  margin: 0;
  padding-left: 20px;
  overflow-wrap: anywhere;
}
.file-picker__selection .button {
  justify-self: end;
  min-height: 44px;
}
.is-disabled {
  opacity: 0.65;
}
</style>
