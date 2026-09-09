<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Paperclip } from 'lucide-vue-next'
import { useInquiryPreviewStore } from '../inquiryPreviewStore'
const router = useRouter()
const store = useInquiryPreviewStore()
const content = ref('')
const attachments = ref([])
const fileError = ref('')
const canSubmit = computed(() => Boolean(content.value.trim()) && !fileError.value)
function selectFiles(event) {
  const files = [...event.target.files]
  const types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (
    files.some((f) => !types.includes(f.type) || f.size > 10 * 1024 * 1024) ||
    files.reduce((sum, f) => sum + f.size, 0) > 11 * 1000 * 1000
  ) {
    fileError.value =
      'JPEG·PNG·WebP·PDF 파일을 선택해 주세요. 파일당 10MiB, 합계 11MB까지 가능합니다.'
    attachments.value = []
    return
  }
  fileError.value = ''
  attachments.value = files.map(({ name, size, type }) => ({
    id: crypto.randomUUID(),
    name,
    size,
    type,
  }))
}
function submit() {
  if (!canSubmit.value) return
  const id = store.add(content.value.trim(), attachments.value)
  router.push({ name: 'inquiry-detail', params: { qualityInquiryId: id } })
}
</script>
<template>
  <div class="workspace-ui design-review-page">
    <RouterLink class="button button-secondary" to="/help/inquiries">문의 목록으로</RouterLink>
    <header class="ui-heading">
      <div>
        <h1>품질 문의 작성</h1>
        <p>확인이 필요한 상황을 자세히 알려주세요.</p>
      </div>
    </header>
    <div class="ui-grid">
      <form class="ui-surface ui-stack" @submit.prevent="submit">
        <label class="ui-field"
          >문의 유형<select>
            <option value="OTHER">기타 문의</option>
            <option disabled>상품 품질 · 연결 준비 중</option>
            <option disabled>누락·파손 · 연결 준비 중</option>
            <option disabled>배송 문제 · 연결 준비 중</option>
          </select></label
        >
        <label class="ui-field" for="inquiry-content"
          >문의 내용 (필수)<textarea
            id="inquiry-content"
            v-model="content"
            rows="7"
            required
            placeholder="문의 내용을 입력해 주세요."
          />
        </label>
        <label class="ui-field" for="inquiry-file"
          >첨부 파일 (선택)<input
            id="inquiry-file"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            :aria-invalid="Boolean(fileError)"
            aria-describedby="file-help file-error"
            @change="selectFiles"
        /></label>
        <p id="file-help" class="ui-muted">파일당 10MiB, 전체 11MB까지 · 이미지 또는 PDF</p>
        <p v-if="fileError" id="file-error" class="ui-error" role="alert">{{ fileError }}</p>
        <p v-for="file in attachments" :key="file.id" class="ui-actions">
          <Paperclip :size="16" aria-hidden="true" />{{ file.name }} ·
          {{ Math.ceil(file.size / 1024) }}KB
        </p>
        <div class="ui-actions">
          <RouterLink class="button button-secondary" to="/help/inquiries">취소</RouterLink
          ><button class="button button-primary" type="submit" :disabled="!canSubmit">
            문의 저장
          </button>
        </div>
      </form>
      <aside class="ui-surface ui-stack">
        <h2>작성 전 확인해 주세요.</h2>
        <p>
          주문·상품과 연결되는 문의 기능은 준비 중입니다. 현재는 기타 문의 화면을 확인할 수 있어요.
        </p>
        <p class="ui-muted">
          비밀번호나 카드번호 등 민감한 정보는 작성하지 마세요. 첨부는 파일명과 크기만 화면에 남으며
          실제 파일은 전송하지 않습니다.
        </p>
        <RouterLink class="button button-secondary" to="/help/faq">자주 묻는 질문</RouterLink>
      </aside>
    </div>
  </div>
</template>
