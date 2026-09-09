<script setup>
import { ChevronLeft } from 'lucide-vue-next'

defineProps({
  label: {
    type: String,
    default: '마이페이지로',
  },
})

defineEmits(['back'])
</script>

<template>
  <button class="back-button" type="button" @click="$emit('back')">
    <ChevronLeft :size="18" aria-hidden="true" />
    {{ label }}
  </button>
</template>
