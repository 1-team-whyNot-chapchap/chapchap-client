<script setup>
import AdminSidebar from '../components/AdminSidebar.vue'
import AccountIssuanceWorkspace from '../components/AccountIssuanceWorkspace.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-accounts" @navigate="emit('navigate', $event)" />
    <div class="admin-main workspace-ui design-review-page"><AccountIssuanceWorkspace /></div>
  </div>
</template>
