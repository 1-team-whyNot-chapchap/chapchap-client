<script setup>
import AdminSidebar from '../components/AdminSidebar.vue'
import AccountIssuanceWorkspace from '../components/AccountIssuanceWorkspace.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-rider-accounts" @navigate="emit('navigate', $event)" />
    <div class="admin-main workspace-ui design-review-page"><AccountIssuanceWorkspace rider /></div>
  </div>
</template>
