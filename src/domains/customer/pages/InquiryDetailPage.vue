<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Paperclip, MessageSquare } from 'lucide-vue-next'
import { useInquiryPreviewStore } from '../inquiryPreviewStore'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
const route = useRoute()
const store = useInquiryPreviewStore()
const item = computed(() => store.inquiries.find((i) => i.id === route.params.qualityInquiryId))
</script>
<template>
  <div class="workspace-ui design-review-page">
    <RouterLink class="button button-secondary" to="/help/inquiries">문의 목록으로</RouterLink>
    <header class="ui-heading">
      <div>
        <h1>품질 문의 상세</h1>
        <p>{{ item ? `기타 문의 · ${item.createdAt}` : '요청한 문의를 확인해 주세요.' }}</p>
      </div>
      <span v-if="item" class="mini-badge">{{ item.status }}</span>
    </header>
    <DesignPreview title="문의 상세" :allow-empty="false"
      ><div v-if="item" class="ui-grid">
        <section class="ui-surface ui-stack">
          <h2>문의 내용</h2>
          <p class="inquiry-content">{{ item.content }}</p>
          <h3>첨부 파일 {{ item.attachments.length }}개</h3>
          <p v-for="file in item.attachments" :key="file.id" class="ui-actions">
            <Paperclip :size="16" aria-hidden="true" />{{ file.name }} ·
            {{ Math.ceil(file.size / 1024) }}KB
          </p>
          <p class="ui-muted">파일 정보만 표시합니다. 미리보기와 다운로드는 준비 중입니다.</p>
        </section>
        <section class="ui-surface ui-stack">
          <h2>처리 답변</h2>
          <p v-if="item.answer">{{ item.answer }}</p>
          <div v-else class="ui-empty">
            <MessageSquare :size="32" aria-hidden="true" />
            <h3>아직 답변이 없어요.</h3>
            <p class="ui-muted">실제 접수 후 답변이 등록되면 이곳에 표시됩니다.</p>
          </div>
        </section>
      </div>
      <div v-else class="ui-empty">
        <h2>문의를 찾을 수 없어요.</h2>
        <RouterLink class="button button-primary" to="/help/inquiries">문의 목록 보기</RouterLink>
      </div></DesignPreview
    >
  </div>
</template>
<style scoped>
.inquiry-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
