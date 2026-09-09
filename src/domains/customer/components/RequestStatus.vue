<script setup>
defineProps({ busy: Boolean, error: String, notice: String })
</script>
<template>
  <p v-if="busy" class="ui-note" role="status">불러오는 중입니다…</p>
  <p v-if="error" class="ui-note" role="alert">{{ error }}</p>
  <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
</template>
