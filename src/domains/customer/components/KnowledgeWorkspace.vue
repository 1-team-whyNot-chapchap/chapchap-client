<script setup>
import { reactive, ref } from 'vue'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const { busy, error, notice, run } = useCustomerRequest()
const form = reactive({
  sourceService: '',
  documentKey: '',
  category: '',
  title: '',
  version: '',
  effectiveFrom: '',
})
const labels = {
  sourceService: '담당 서비스',
  documentKey: '문서 식별자',
  category: '분류',
  title: '제목',
  version: '버전',
}
const file = ref(null),
  result = ref(null),
  lookupId = ref('')
const statuses = {
  UPLOADED: '접수됨',
  PROCESSING: '처리 중',
  COMPLETED: '처리 완료',
  FAILED: '처리 실패',
  PENDING: '대기 중',
}
function submit() {
  run(async () => {
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('file', file.value)
    result.value = await api.registerKnowledge(data)
    lookupId.value = String(result.value.knowledgeVersionId)
    notice.value = '문서가 접수되었습니다. 처리 상태를 확인해 주세요.'
  })
}
function lookup() {
  run(async () => {
    result.value = await api.knowledge(lookupId.value)
  })
}
</script>
<template>
  <section class="ui-stack">
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <form class="ui-surface ui-stack" @submit.prevent="submit">
      <h2>지식 문서 등록</h2>
      <fieldset :disabled="busy" class="ui-stack" style="border: 0; padding: 0">
        <label v-for="(label, key) in labels" :key="key" class="ui-field"
          >{{ label
          }}<input
            v-model="form[key]"
            required
            :maxlength="
              { sourceService: 50, documentKey: 100, category: 40, title: 200, version: 30 }[key]
            "
        /></label>
        <label class="ui-field"
          >적용 시작일 (한국 시간)<input
            v-model="form.effectiveFrom"
            type="datetime-local"
            required
        /></label>
        <label class="ui-field"
          >문서 파일<input
            type="file"
            accept=".pdf,.md,.txt"
            required
            @change="file = $event.target.files[0]"
        /></label>
        <button class="button button-primary" :disabled="!file">등록</button>
      </fieldset>
    </form>
    <form class="ui-surface ui-stack" @submit.prevent="lookup">
      <label class="ui-field"
        >접수된 버전 번호<input
          v-model="lookupId"
          required
          pattern="[1-9][0-9]*"
          inputmode="numeric" /></label
      ><button class="button button-secondary" :disabled="busy">처리 상태 조회</button>
    </form>
    <article v-if="result" class="ui-surface ui-stack">
      <h2>접수 #{{ result.knowledgeVersionId }}</h2>
      <p>
        {{ statuses[result.processingStatus] || result.processingStatus }} ·
        {{ result.active ? '사용 중' : '미활성' }}
      </p>
      <p>버전 {{ result.version }} · {{ result.effectiveFrom }}</p>
      <p v-if="result.failureCode">처리가 완료되지 않았습니다. 오류: {{ result.failureCode }}</p>
    </article>
  </section>
</template>
