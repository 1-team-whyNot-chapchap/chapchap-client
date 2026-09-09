<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import { MessageSquare, Plus } from 'lucide-vue-next'
import { useInquiryPreviewStore } from '../inquiryPreviewStore'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { selectButtonPt } from '../../../common/constants/primeUiPt'
const store = useInquiryPreviewStore()
const filter = ref('전체')
const items = computed(() =>
  store.inquiries.filter((i) => filter.value === '전체' || i.status === filter.value),
)
</script>
<template>
  <div class="workspace-ui design-review-page">
    <RouterLink class="button button-secondary" to="/support">고객지원으로</RouterLink>
    <header class="ui-heading">
      <div>
        <h1>내 품질 문의</h1>
        <p>남겨주신 문의와 처리 상황을 확인하세요.</p>
      </div>
      <RouterLink class="button button-primary" to="/help/inquiries/new"
        ><Plus :size="18" aria-hidden="true" />문의 작성</RouterLink
      >
    </header>
    <SelectButton
      v-model="filter"
      :options="['전체', '답변 대기', '답변 완료']"
      :allow-empty="false"
      :pt="selectButtonPt"
      aria-label="문의 상태"
    />
    <DesignPreview title="품질 문의" empty="작성한 문의가 없어요."
      ><section class="ui-surface" style="margin-top: 24px">
        <article v-for="item in items" :key="item.id" class="ui-list-item">
          <span class="ui-icon"><MessageSquare :size="22" aria-hidden="true" /></span>
          <div>
            <h2>{{ item.content.length > 50 ? item.content.slice(0, 50) + '…' : item.content }}</h2>
            <p>기타 문의 · {{ item.createdAt }} · {{ item.status }}</p>
          </div>
          <RouterLink class="button button-secondary" :to="`/help/inquiries/${item.id}`"
            >상세 보기</RouterLink
          >
        </article>
        <div v-if="!items.length" class="ui-empty">
          <MessageSquare :size="32" aria-hidden="true" />
          <h2>해당하는 문의가 없어요.</h2>
          <RouterLink class="button button-primary" to="/help/inquiries/new">문의 작성</RouterLink>
        </div>
      </section></DesignPreview
    >
  </div>
</template>
