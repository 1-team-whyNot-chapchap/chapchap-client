<script setup>
import { useRoute, useRouter } from 'vue-router'
import AdminSidebar from './AdminSidebar.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import '../admin-operations.css'
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  current: { type: String, default: '' },
})
const route = useRoute()
const router = useRouter()
</script>
<template>
  <div class="admin-layout ops-layout">
    <AdminSidebar
      :current-route="current || String(route.name)"
      @navigate="router.push({ name: $event })"
    />
    <div class="admin-main workspace-ui admin-operations design-review-page">
      <header class="ui-heading">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <slot name="actions" />
      </header>
      <DesignPreview :title="title"><slot /></DesignPreview>
    </div>
  </div>
</template>
