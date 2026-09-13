<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CircleAlert, ClipboardCheck } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import http from '../../../common/api/http.js'
import { createDeliveryExecutionApi } from '../api/deliveryExecutionApi.js'
import { assignmentIssueOptions } from '../constants/assignmentIssueOptions.js'

const emit = defineEmits(['navigate'])
const route = useRoute()
const api = createDeliveryExecutionApi(http)
const issueCode = ref('')
const description = ref('')
const notice = ref('')
const submitting = ref(false)
const assignmentId = computed(() => String(route.query.assignmentId || ''))
const isOtherIssue = computed(() => issueCode.value === 'OTHER')

async function submitIssue() {
  if (!assignmentId.value || !issueCode.value || (isOtherIssue.value && !description.value.trim())) return

  submitting.value = true
  notice.value = ''
  try {
    await api.reportAssignmentIssue(assignmentId.value, {
      issueCode: issueCode.value,
      issueDetail: description.value.trim() || null,
    })
    notice.value = '배정 이슈를 운영팀에 보고했습니다.'
    issueCode.value = ''
    description.value = ''
  } catch (error) {
    notice.value = error.message || '배정 이슈를 보고하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page rider-issue-page">
    <PageBackButton label="오늘 배송으로" @back="emit('navigate', 'rider-deliveries')" />
    <header>
      <h1>배송 이슈를<br />빠르게 남겨주세요.</h1>
      <p>현재 배정 전체의 수행이 어려운 사유를 선택하면 운영팀이 검토합니다.</p>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <form class="issue-form" @submit.prevent="submitIssue">
      <label>
        이슈 유형
        <select v-model="issueCode" required>
          <option disabled value="">선택해 주세요</option>
          <option v-for="option in assignmentIssueOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        상황 설명{{ isOtherIssue ? '' : ' (선택)' }}
        <textarea
          v-model.trim="description"
          rows="5"
          :placeholder="isOtherIssue ? '기타 사유를 입력해 주세요.' : '운영팀에 전달할 내용을 입력해 주세요.'"
          :required="isOtherIssue"
        />
      </label>
      <button
        class="button button-primary"
        type="submit"
        :disabled="submitting || !assignmentId || !issueCode || (isOtherIssue && !description.trim())"
      >
        <ClipboardCheck :size="17" aria-hidden="true" />이슈 기록하기
      </button>
    </form>
    <aside class="policy">
      <CircleAlert :size="19" aria-hidden="true" />
      <p>
        위험 상황이나 개인정보가 포함된 상세 사유는 정해진 운영 채널과 권한 검증을 거쳐 처리해야
        합니다.
      </p>
    </aside>
  </section>
</template>

<style scoped>
.rider-issue-page {
  max-width: 720px;
}
.eyebrow {
  margin: 28px 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.notice,
.policy {
  display: flex;
  gap: 9px;
  margin-top: 22px;
  padding: 14px;
  border-radius: 13px;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.notice {
  background: var(--color-primary-soft);
}
.issue-form {
  display: grid;
  gap: 18px;
  margin-top: 22px;
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.issue-form label {
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 800;
}
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
textarea {
  resize: vertical;
}
.issue-form .button {
  justify-content: center;
}
.policy {
  background: var(--color-warning-soft);
  color: #78601c;
}
.policy p {
  margin: 0;
  color: inherit;
}
</style>
