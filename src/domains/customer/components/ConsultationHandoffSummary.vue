<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { customerApi } from '../api/customerApi.js'
import { createSummaryLoader, summaryMessage } from '../handoffSummary.js'
import { authSession } from '../../../common/api/http.js'
const props = defineProps({ consultationId: { type: [String, Number], required: true } })
const result = ref(null)
const retrying = ref(false),
  retryError = ref('')
let generation = 0
let loader
async function retry() {
  if (retrying.value) return
  const current = generation
  retrying.value = true
  retryError.value = ''
  try {
    const value = await customerApi.retryConsultationSummary(props.consultationId)
    if (current === generation) result.value = value
  } catch {
    if (current === generation)
      retryError.value = '재처리를 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    if (current === generation) retrying.value = false
  }
}
watch(
  [() => props.consultationId, () => authSession.state.user],
  ([id, user]) => {
    generation++
    retrying.value = false
    retryError.value = ''
    loader?.stop()
    result.value = null
    if (!user) return
    loader = createSummaryLoader({
      fetchSummary: () => customerApi.consultationSummary(id),
      onChange: (value) => {
        result.value = value
      },
    })
    loader.start()
  },
  { immediate: true },
)
onUnmounted(() => {
  generation++
  loader?.stop()
})
</script>
<template>
  <section class="ui-stack" aria-label="AI 상담 요약">
    <h3>AI 상담 요약</h3>
    <p v-if="result?.status === 'COMPLETED'" class="handoff-summary-text">{{ result.summary }}</p>
    <p v-else role="status">
      {{
        result?.error
          ? '요약을 불러오지 못했습니다. 잠시 후 자동으로 다시 확인합니다.'
          : result
            ? summaryMessage(result.status)
            : '요약을 불러오고 있습니다.'
      }}
    </p>
    <p v-if="retryError" role="alert">{{ retryError }}</p>
    <button
      v-if="result?.retryAllowed"
      class="ui-btn ui-btn-secondary"
      :disabled="retrying"
      @click="retry"
    >
      {{ retrying ? '요청 중…' : '요약 다시 생성' }}
    </button>
  </section>
</template>
<style scoped>
.handoff-summary-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
