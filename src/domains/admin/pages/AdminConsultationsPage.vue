<script setup>
import AdminFrame from '../components/AdminFrame.vue'
import ConsultationWorkspace from '../../customer/components/ConsultationWorkspace.vue'
</script>
<template>
  <AdminFrame
    title="상담 관리"
    description="연결을 기다리는 상담을 확인하고, 내 담당 상담을 이어가세요."
    ><ConsultationWorkspace admin
  /></AdminFrame>
</template>
