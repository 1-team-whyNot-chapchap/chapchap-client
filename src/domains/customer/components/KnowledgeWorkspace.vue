<script setup>
import FilePicker from '../../../common/components/forms/FilePicker.vue'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createKnowledgePoller, knowledgeStatuses as statuses } from '../knowledgeProgress.js'
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
const route = useRoute(),
  router = useRouter()
let poller,
  disposed = false
function observe(id) {
  if (disposed) return
  poller?.stop()
  error.value = ''
  poller = createKnowledgePoller({
    fetchVersion: () => api.knowledge(id),
    onResult: (value) => {
      result.value = value
    },
    onError: () => {
      error.value = '처리 상태를 불러오지 못했습니다. 처리 상태 조회로 다시 확인해 주세요.'
    },
  })
  poller.start()
}
onMounted(() => {
  const id = String(route.query.knowledgeVersionId || '')
  if (/^[1-9][0-9]*$/.test(id)) {
    lookupId.value = id
    observe(id)
  }
})
onUnmounted(() => {
  disposed = true
  poller?.stop()
})
function submit() {
  run(async () => {
    poller?.stop()
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('file', file.value)
    const registered = await api.registerKnowledge(data)
    if (disposed) return
    result.value = registered
    lookupId.value = String(result.value.knowledgeVersionId)
    notice.value = '문서가 접수되었습니다. 처리 상태를 자동으로 확인합니다.'
    await router.replace({ query: { ...route.query, knowledgeVersionId: lookupId.value } })
    observe(lookupId.value)
  })
}
function lookup() {
  if (busy.value || !/^[1-9][0-9]*$/.test(lookupId.value)) return
  result.value = null
  router.replace({ query: { ...route.query, knowledgeVersionId: lookupId.value } })
  observe(lookupId.value)
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
        <FilePicker
          v-model="file"
          label="지식 문서"
          accept=".pdf,.md,.txt"
          hint="PDF, Markdown, 텍스트 문서"
          required
          :disabled="busy"
        />
        <button class="button button-primary ui-action-end" :disabled="!file">등록</button>
      </fieldset>
    </form>
    <form class="ui-surface ui-stack" @submit.prevent="lookup">
      <label class="ui-field"
        >접수된 버전 번호<input
          v-model="lookupId"
          required
          pattern="[1-9][0-9]*"
          inputmode="numeric" /></label
      ><button class="button button-secondary ui-action-end" :disabled="busy">
        처리 상태 조회
      </button>
    </form>
    <article v-if="result" class="ui-surface ui-stack">
      <h2>접수 #{{ result.knowledgeVersionId }}</h2>
      <p>
        {{ statuses[result.processingStatus] || result.processingStatus }} ·
        {{ result.active ? '사용 중' : '미활성' }}
      </p>
      <p>버전 {{ result.version }} · {{ result.effectiveFrom }}</p>
      <p v-if="result.processingStatus === 'FAILED'">
        문서 처리가 실패했습니다. 파일 내용과 서버 연결 상태를 확인해 주세요.
      </p>
    </article>
  </section>
</template>
