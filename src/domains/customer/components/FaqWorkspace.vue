<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const props = defineProps({ admin: Boolean })
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([])
const keyword = ref('')
const editing = ref(null)
const editor = ref(null)
const form = reactive({ category: '', question: '', answer: '', displayOrder: 0, published: true })
const filtered = computed(() =>
  rows.value.filter((row) =>
    `${row.category} ${row.question} ${row.answer}`.includes(keyword.value.trim()),
  ),
)
const reload = () =>
  run(async () => {
    rows.value = await api.faqs(props.admin)
  })
function edit(row) {
  editing.value = row.faqId
  Object.assign(form, row)
  editor.value?.scrollIntoView({ block: 'nearest' })
  editor.value?.querySelector('input')?.focus({ preventScroll: true })
}
function reset() {
  editing.value = null
  Object.assign(form, { category: '', question: '', answer: '', displayOrder: 0, published: true })
}
async function save() {
  await run(async () => {
    await api.saveFaq(
      {
        category: form.category,
        question: form.question,
        answer: form.answer,
        displayOrder: form.displayOrder,
        published: form.published,
      },
      editing.value,
    )
    reset()
    rows.value = await api.faqs(true)
    notice.value = '질문을 저장했습니다.'
  })
}
function deactivate(row) {
  if (window.confirm('이 질문을 비활성화할까요?'))
    run(async () => {
      await api.deactivateFaq(row.faqId)
      rows.value = await api.faqs(true)
    })
}
onMounted(reload)
</script>
<template>
  <section class="ui-stack" :class="{ 'faq-admin': admin }">
    <div class="ui-actions faq-toolbar">
      <label class="ui-field"
        >질문 검색<input
          v-model="keyword"
          type="search"
          maxlength="120"
          placeholder="분류, 질문 또는 답변 검색" /></label
      ><button class="button button-secondary" :disabled="busy" @click="reload">새로고침</button>
    </div>
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <div :class="{ 'faq-layout': admin }">
      <section :class="admin ? 'faq-list-panel' : 'ui-stack'" aria-label="FAQ 목록">
        <header v-if="admin" class="faq-panel-heading">
          <div>
            <h2>질문 목록</h2>
            <p>질문을 펼치면 답변을 확인하고 수정할 수 있습니다.</p>
          </div>
        </header>
        <div v-if="!busy && !error && !filtered.length" class="ui-empty">
          {{ keyword.trim() ? '검색 조건에 맞는 질문이 없습니다.' : '등록된 질문이 없습니다.' }}
        </div>
        <details
          v-for="row in filtered"
          :key="row.faqId"
          :class="admin ? 'faq-item' : 'ui-surface'"
        >
          <summary>
            <span class="faq-summary-content"
              ><span v-if="admin" class="faq-category">{{ row.category }}</span
              ><span class="faq-question"
                >{{ admin ? '' : `${row.category} · ` }}{{ row.question }}</span
              >
            </span>
            <ChevronDown v-if="admin" class="faq-chevron" :size="18" aria-hidden="true" />
          </summary>
          <p class="faq-answer" style="white-space: pre-wrap">{{ row.answer }}</p>
          <div v-if="admin" class="ui-actions faq-item-actions">
            <span class="faq-published" :class="{ 'faq-published--hidden': !row.published }">{{
              row.published ? '공개' : '비공개'
            }}</span>
            <button class="button button-secondary" :disabled="busy" @click="edit(row)">수정</button
            ><button class="button button-secondary" :disabled="busy" @click="deactivate(row)">
              비활성화
            </button>
          </div>
        </details>
      </section>
      <form v-if="admin" ref="editor" class="faq-editor ui-stack" @submit.prevent="save">
        <header class="faq-panel-heading">
          <div>
            <h2>{{ editing !== null ? '질문 수정' : '새 질문 등록' }}</h2>
            <p>
              {{
                editing !== null
                  ? `FAQ #${editing} 내용을 수정하고 있습니다.`
                  : '고객이 자주 묻는 질문과 답변을 작성해 주세요.'
              }}
            </p>
          </div>
        </header>
        <fieldset :disabled="busy" class="ui-stack">
          <label class="ui-field"
            >분류<input v-model="form.category" required maxlength="40"
          /></label>
          <label class="ui-field"
            >질문<input v-model="form.question" required maxlength="500"
          /></label>
          <label class="ui-field">답변<textarea v-model="form.answer" required rows="5" /></label>
          <div class="faq-form-options">
            <label class="ui-field"
              >노출 순서<input v-model.number="form.displayOrder" type="number" min="0" required
            /></label>
            <label class="faq-publish-control"
              ><input v-model="form.published" type="checkbox" /> 고객에게 공개</label
            >
          </div>
          <div class="ui-actions faq-form-actions">
            <button class="button button-primary">{{ busy ? '처리 중…' : '저장' }}</button
            ><button class="button button-secondary" type="button" @click="reset">
              {{ editing !== null ? '수정 취소' : '입력 초기화' }}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  </section>
</template>

<style scoped>
.faq-toolbar {
  align-items: end;
  gap: 12px;
}
.faq-toolbar .ui-field {
  flex: 1;
  max-width: 560px;
  min-width: 0;
}
.faq-toolbar input,
.faq-toolbar .button {
  height: 48px;
  min-height: 48px;
  box-sizing: border-box;
}
.faq-toolbar .button {
  flex-shrink: 0;
}
.faq-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: start;
}
.faq-list-panel,
.faq-editor {
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
.faq-panel-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}
.faq-panel-heading h2 {
  margin: 0;
  font-size: 18px;
}
.faq-panel-heading p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-muted);
}
.faq-item {
  border-top: 1px solid var(--color-border);
  padding: 0 24px;
}
.faq-item summary {
  display: flex;
  align-items: center;
  gap: 16px;
  list-style: none;
  padding: 20px 0;
  cursor: pointer;
}
.faq-item summary::-webkit-details-marker {
  display: none;
}
.faq-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.faq-item[open] .faq-chevron {
  transform: rotate(180deg);
}
.faq-summary-content {
  display: inline;
}
.faq-admin .faq-summary-content {
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 7px 12px;
  flex: 1;
  min-width: 0;
  vertical-align: middle;
}
.faq-category {
  grid-column: 1 / -1;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
}
.faq-admin .faq-question {
  line-height: 1.6;
  overflow-wrap: anywhere;
  font-weight: 600;
}
.faq-published {
  height: 48px;
  line-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  min-width: 64px;
  padding: 12px 16px;
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  margin-right: auto;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  white-space: nowrap;
}
.faq-published--hidden {
  background: var(--color-background);
  color: var(--color-text-muted);
}
.faq-admin .faq-answer {
  margin: 0 0 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-background);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.faq-item-actions {
  justify-content: end;
  padding-bottom: 20px;
}
.faq-item-actions .button {
  min-width: 64px;
}
.faq-admin .button {
  min-height: 48px;
}
.faq-editor {
  gap: 0;
}
.faq-editor .faq-panel-heading {
  border-bottom: 1px solid var(--color-border);
}
.faq-editor fieldset {
  margin: 0;
  border: 0;
  padding: 24px;
  min-width: 0;
}
.faq-editor textarea {
  resize: vertical;
  min-height: 180px;
  line-height: 1.7;
}
.faq-form-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: 16px;
}
.faq-publish-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  font-size: 14px;
}
.faq-form-actions {
  justify-content: end;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
@media (max-width: 1100px) {
  .faq-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .faq-panel-heading,
  .faq-item {
    padding: 18px 16px;
  }
  .faq-item summary {
    padding: 0;
  }
  .faq-item[open] summary {
    padding-bottom: 16px;
  }
  .faq-editor fieldset {
    padding: 16px;
  }
  .faq-form-options {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .faq-toolbar {
    gap: 8px;
  }
  .faq-toolbar .button {
    padding-inline: 12px;
  }
}
</style>
