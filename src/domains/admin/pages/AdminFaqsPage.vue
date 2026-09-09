<script setup>
import { computed, reactive, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { publicFaqs } from '../adminSupportPreview'
const search = ref('')
const open = ref(false)
const editing = ref(false)
const form = reactive({ category: '', question: '', answer: '', displayOrder: 0, published: true })
let initial = ''
const rows = computed(() =>
  publicFaqs.filter((f) => (f.category + f.question).includes(search.value.trim())),
)
const dirty = computed(() => JSON.stringify(form) !== initial)
function openForm(faq) {
  editing.value = Boolean(faq)
  Object.assign(
    form,
    faq
      ? {
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          displayOrder: faq.displayOrder,
          published: faq.published,
        }
      : { category: '', question: '', answer: '', displayOrder: 0, published: true },
  )
  initial = JSON.stringify(form)
  open.value = true
}
</script>
<template>
  <AdminFrame title="FAQ 관리" description="공개 FAQ를 확인하고 등록·수정할 내용을 준비합니다.">
    <template #actions
      ><button class="button button-primary" @click="openForm()">FAQ 등록 준비</button></template
    >
    <p class="ui-note">
      공개 항목의 예시 목록입니다. 비공개·비활성 항목까지 포함한 전체 관리 목록이 아닙니다.
    </p>
    <div class="ops-toolbar">
      <label class="ui-field">분류·질문 검색<input v-model="search" type="search" /></label
      ><button class="button button-secondary" @click="search = ''">검색 초기화</button>
    </div>
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>공개 FAQ</h2>
        <RouterLink class="ops-link" to="/help/faq">고객 FAQ 보기</RouterLink>
      </div>
      <ul class="ui-list">
        <li v-for="faq in rows" :key="faq.id" class="ui-list-item">
          <div>
            <small>{{ faq.category }} · 표시 순서 {{ faq.displayOrder }}</small>
            <h3>{{ faq.question }}</h3>
            <p class="ops-copy">{{ faq.answer }}</p>
          </div>
          <button class="button button-secondary" @click="openForm(faq)">편집 검토</button>
        </li>
        <li v-if="!rows.length" class="ui-empty">
          <h3>검색된 공개 항목이 없습니다.</h3>
          <p>비공개 항목의 유무를 뜻하지 않습니다.</p>
        </li>
      </ul>
    </section>
    <OperationReviewDialog
      v-model:visible="open"
      :title="editing ? 'FAQ 편집 검토' : 'FAQ 등록 준비'"
      :dirty="dirty"
    >
      <label class="ui-field"
        >분류<input v-model.trim="form.category" maxlength="40" required /></label
      ><label class="ui-field"
        >질문<input v-model.trim="form.question" maxlength="500" required /></label
      ><label class="ui-field">답변<textarea v-model.trim="form.answer" rows="5" required /></label>
      <div class="ui-grid">
        <label class="ui-field"
          >표시 순서<input
            v-model.number="form.displayOrder"
            type="number"
            min="0"
            step="1"
            required /></label
        ><label class="ui-field"
          >공개 여부<select v-model="form.published">
            <option :value="true">공개</option>
            <option :value="false">비공개</option>
          </select></label
        >
      </div>
      <p v-if="!form.published" class="ui-note">
        비공개 등록 후 재탐색은 전체 목록 계약이 보완되어야 가능합니다. 현재는 게시하지 않습니다.
      </p>
      <button v-if="editing" class="button button-danger-outline" type="button" disabled>
        비활성화 · 연결 전
      </button>
    </OperationReviewDialog>
  </AdminFrame>
</template>
