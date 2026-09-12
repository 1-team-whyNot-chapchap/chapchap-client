<script setup>
import { computed, ref } from 'vue'
import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])
const invitationCode = ref('')
const submitState = ref('idle')
const normalizedCode = computed(() => invitationCode.value.trim().toUpperCase())

function submitInvitationCode() {
  if (!normalizedCode.value) {
    submitState.value = 'error'
    return
  }

  submitState.value = normalizedCode.value === 'CHAP-RD-0001' ? 'success' : 'error'
}
</script>

<template>
  <section class="page rider-invite-page">
    <header>
      <h1>점주에게 받은 초대 코드를 등록하세요.</h1>
      <p>유효한 코드를 등록하면 연결된 매장의 배정 배송을 확인할 수 있어요.</p>
    </header>

    <section
      v-if="submitState !== 'success'"
      class="invite-form-card"
      aria-labelledby="invite-form-title"
    >
      <span class="invite-form-card__icon"><KeyRound :size="24" aria-hidden="true" /></span>
      <h2 id="invite-form-title">초대 코드 입력</h2>
      <p>코드는 발급 후 24시간 동안 한 번만 사용할 수 있습니다.</p>
      <form @submit.prevent="submitInvitationCode">
        <label>
          <span>초대 코드</span>
          <input
            v-model="invitationCode"
            type="text"
            autocomplete="off"
            placeholder="예: CHAP-RD-0001"
            :aria-describedby="submitState === 'error' ? 'invite-error' : 'invite-help'"
          />
        </label>
        <p id="invite-help" class="form-help">코드를 직접 전달받은 라이더만 등록할 수 있어요.</p>
        <p v-if="submitState === 'error'" id="invite-error" class="invite-error" role="alert">
          <ShieldAlert :size="17" aria-hidden="true" />코드를 확인해 주세요. 만료되었거나 이미
          사용한 코드일 수 있어요.
        </p>
        <button class="button button-primary" type="submit">초대 코드 등록</button>
      </form>
    </section>

    <section v-else class="invite-success" role="status">
      <span><CheckCircle2 :size="28" aria-hidden="true" /></span>
      <h2>챱챱 성수점 라이더로 연결됐어요.</h2>
      <p>이제 점주가 배정한 배송을 확인하고 상태를 처리할 수 있습니다.</p>
      <button
        class="button button-primary"
        type="button"
        @click="emit('navigate', 'rider-deliveries')"
      >
        오늘 배송 확인하기
      </button>
    </section>

    <aside class="invite-policy">
      <ShieldAlert :size="19" aria-hidden="true" />
      <p>
        실제 등록은 로그인 사용자, 코드의 매장·만료·사용 여부를 서버에서 확인한 뒤 RIDER 역할을
        부여해야 합니다.
      </p>
    </aside>
  </section>
</template>

<style scoped>
.rider-invite-page {
  max-width: 680px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.rider-invite-page h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.rider-invite-page header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.invite-form-card,
.invite-success {
  margin-top: 32px;
  padding: clamp(24px, 5vw, 38px);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}
.invite-form-card__icon,
.invite-success > span {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.invite-form-card h2,
.invite-success h2 {
  margin: 20px 0 0;
  font-size: var(--font-section-title);
  letter-spacing: -0.04em;
}
.invite-form-card > p,
.invite-success > p:last-of-type {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.invite-form-card form {
  display: grid;
  gap: 13px;
  margin-top: 26px;
}
.invite-form-card label {
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.invite-form-card input {
  width: 100%;
  min-height: 48px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  box-sizing: border-box;
  text-transform: uppercase;
}
.invite-form-card input:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: -3px;
}
.form-help {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.invite-error {
  display: flex;
  gap: 7px;
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.invite-form-card .button,
.invite-success .button {
  min-height: 48px;
  margin-top: 6px;
}
.invite-success {
  background: var(--color-primary-soft);
}
.invite-success > .eyebrow {
  margin-top: 20px;
}
.invite-success > p:last-of-type {
  color: var(--color-text-muted);
}
.invite-policy {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  border-radius: 14px;
  background: var(--color-warning-soft);
  color: #78601c;
}
.invite-policy p {
  margin: 0;
  color: inherit;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
</style>
