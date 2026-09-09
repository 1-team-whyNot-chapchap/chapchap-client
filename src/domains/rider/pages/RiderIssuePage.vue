<script setup>
import { ref } from 'vue'
import { CircleAlert, ClipboardCheck } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const emit = defineEmits(['navigate'])
const issueType = ref('수령인 연락 불가')
const description = ref('')
const notice = ref('')

function submitIssue() {
  notice.value =
    '이슈 내용을 시연 화면에 기록했습니다. 실제 접수와 운영팀 알림은 서버 연동 후 처리됩니다.'
}
</script>

<template>
  <section class="page rider-issue-page">
    <PageBackButton label="오늘 배송으로" @back="emit('navigate', 'rider-deliveries')" />
    <header>
      <p class="ui-sample">시연 화면</p>
      <h1>배송 이슈를<br />빠르게 남겨주세요.</h1>
      <p>이슈 접수는 배송 건·시간·처리 담당자를 서버에서 함께 기록해야 합니다.</p>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <form class="issue-form" @submit.prevent="submitIssue">
      <label>
        이슈 유형
        <select v-model="issueType">
          <option>수령인 연락 불가</option>
          <option>주소·출입 정보 확인 필요</option>
          <option>상품 상태 확인 필요</option>
          <option>기타</option>
        </select>
      </label>
      <label>
        상황 설명
        <textarea
          v-model.trim="description"
          rows="5"
          placeholder="배송 번호와 현재 상황을 입력하세요."
          required
        />
      </label>
      <button class="button button-primary" type="submit">
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
