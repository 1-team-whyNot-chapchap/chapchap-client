<script setup>
import AdminSidebar from '../components/AdminSidebar.vue'
import RiderPromotionWorkspace from '../components/RiderPromotionWorkspace.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-role-management" @navigate="emit('navigate', $event)" />
    <div class="admin-main workspace-ui design-review-page"><RiderPromotionWorkspace /></div>
  </div>
</template>
