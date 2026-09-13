<script setup>
import AdminFrame from '../components/AdminFrame.vue'
import FaqWorkspace from '../../customer/components/FaqWorkspace.vue'
</script>
<template>
  <AdminFrame
    title="FAQ 관리"
    description="자주 묻는 질문과 답변을 관리하고 공개 여부를 설정하세요."
    ><FaqWorkspace admin
  /></AdminFrame>
</template>
