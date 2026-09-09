<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const props = defineProps({ admin: Boolean })
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([])
const keyword = ref('')
const editing = ref(null)
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
  <section class="ui-stack">
    <div class="ui-actions">
      <label class="ui-field"
        >질문 검색<input v-model="keyword" type="search" maxlength="120" /></label
      ><button class="button button-secondary" :disabled="busy" @click="reload">새로고침</button>
    </div>
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <div v-if="!busy && !error && !filtered.length" class="ui-empty">등록된 질문이 없습니다.</div>
    <details v-for="row in filtered" :key="row.faqId" class="ui-surface">
      <summary>
        {{ row.category }} · {{ row.question }}
        <span v-if="admin">({{ row.published ? '공개' : '비공개' }})</span>
      </summary>
      <p style="white-space: pre-wrap">{{ row.answer }}</p>
      <div v-if="admin" class="ui-actions">
        <button class="button button-secondary" :disabled="busy" @click="edit(row)">수정</button
        ><button class="button button-secondary" :disabled="busy" @click="deactivate(row)">
          비활성화
        </button>
      </div>
    </details>
    <form v-if="admin" class="ui-surface ui-stack" @submit.prevent="save">
      <h2>{{ editing ? '질문 수정' : '질문 등록' }}</h2>
      <fieldset :disabled="busy" class="ui-stack" style="border: 0; padding: 0">
        <label class="ui-field"
          >분류<input v-model="form.category" required maxlength="40"
        /></label>
        <label class="ui-field"
          >질문<input v-model="form.question" required maxlength="500"
        /></label>
        <label class="ui-field">답변<textarea v-model="form.answer" required rows="5" /></label>
        <label class="ui-field"
          >노출 순서<input v-model.number="form.displayOrder" type="number" min="0" required
        /></label>
        <label><input v-model="form.published" type="checkbox" /> 공개</label>
        <div class="ui-actions">
          <button class="button button-primary">저장</button
          ><button class="button button-secondary" type="button" @click="reset">새 질문</button>
        </div>
      </fieldset>
    </form>
  </section>
</template>
