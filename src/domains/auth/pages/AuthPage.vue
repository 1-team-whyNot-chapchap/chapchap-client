<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { socialLoginUrl } from '../../../common/api/http.js'
const route = useRoute()
const emit = defineEmits(['navigate'])
defineProps({ pageId: String })
const selectedProvider = ref('')
function resetProvider() {
  selectedProvider.value = ''
}
onMounted(() => window.addEventListener('pageshow', resetProvider))
onUnmounted(() => window.removeEventListener('pageshow', resetProvider))
function startSocial(provider) {
  if (selectedProvider.value) return
  selectedProvider.value = provider
  window.location.assign(socialLoginUrl(provider))
}
</script>
<template>
  <div class="page auth-page">
    <div>
      <button
        class="auth-brand"
        type="button"
        aria-label="챱챱 홈으로"
        @click="emit('navigate', 'home')"
      >
        <img class="brand-mark" src="/images/chapchap-brand-logo.png" alt="" /><span>챱챱</span>
      </button>
      <section class="auth-card">
        <div class="auth-card__intro">
          <h1>챱챱에 로그인해요.</h1>
          <p>매일의 식사, 챱챱과 가볍게 시작하세요.</p>
        </div>
        <div class="social-entry">
          <p class="social-entry__caption">자주 쓰는 계정으로 간편하게</p>
          <div class="social-login-grid">
            <button
              class="social-login-button social-login-button--kakao"
              type="button"
              aria-label="카카오로 로그인"
              :disabled="Boolean(selectedProvider)"
              @click="startSocial('kakao')"
            >
              <img src="/images/social/kakao-login-ko-narrow.png" alt="" width="366" height="90" />
            </button>
            <button
              class="social-login-button social-login-button--google"
              type="button"
              aria-label="Google로 로그인"
              :disabled="Boolean(selectedProvider)"
              @click="startSocial('google')"
            >
              <img src="/images/social/google-signin-light.png" alt="" width="720" height="160" />
            </button>
          </div>
          <p v-if="selectedProvider" class="social-preview" role="status">
            소셜 로그인으로 이동하고 있습니다.
          </p>
          <p v-if="route.query.reason === 'expired'" class="social-entry__note" role="status">
            로그인이 만료되었거나 계정 상태가 바뀌었습니다. 같은 소셜 계정으로 다시 로그인해 주세요.
          </p>
          <p class="social-entry__note">가입한 카카오·구글 계정으로 로그인해 주세요.</p>
          <div class="rider-login-entry">
            <p>라이더로 등록하거나 배송 업무를 시작하시나요?</p>
            <RouterLink :to="{ name: 'rider-login' }">라이더 로그인</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.auth-page {
  max-width: 620px;
}
.auth-brand {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 800;
  letter-spacing: -0.06em;
}
.auth-card {
  padding: clamp(24px, 5vw, 46px);
  border: 1px solid var(--color-border);
  border-radius: 26px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}
.auth-card__intro {
  text-align: center;
}
.auth-card__intro h1 {
  margin-top: 0;
  font-size: var(--font-page-title);
}
.auth-card__intro > p:last-child {
  max-width: 430px;
  margin: 12px auto 0;
}
.auth-form {
  display: grid;
  gap: 18px;
  margin-top: 34px;
}
.password-input {
  position: relative;
}
.password-input input {
  padding-right: 48px;
}
.password-input button {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  transform: translateY(-50%);
}
.auth-forgot-link,
.auth-helper button {
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.auth-forgot-link {
  justify-self: end;
  margin-top: -8px;
}
.auth-primary-action {
  width: 100%;
}
.auth-divider {
  position: relative;
  display: grid;
  place-items: center;
  margin: 4px 0;
}
.auth-divider::before {
  position: absolute;
  width: 100%;
  height: 1px;
  background: var(--color-border);
  content: '';
}
.auth-divider span {
  z-index: 1;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.social-login-grid {
  display: grid;
  width: 100%;
  max-width: 300px;
  margin-inline: auto;
  gap: 12px;
}
.social-login-button {
  min-height: 48px;
  aspect-ratio: 4.5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
.social-login-button img {
  display: block;
  width: 100%;
  height: auto;
}
.social-login-button--kakao img {
  width: 90%;
}
.social-login-button--kakao {
  background: #fee500;
}
.social-login-button:focus-visible {
  outline: 3px solid var(--color-primary-pressed);
  outline-offset: 4px;
}
.social-entry {
  margin-top: 32px;
  text-align: center;
}
.social-entry__caption {
  margin: 0 0 18px;
  font-weight: 700;
}
.social-entry__note {
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.rider-login-entry {
  display: grid;
  justify-items: center;
  gap: 5px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.rider-login-entry p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.rider-login-entry a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding-inline: 12px;
  color: var(--color-primary-pressed);
  font-weight: 800;
  text-underline-offset: 3px;
}
.social-preview {
  padding: 12px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
}
.auth-helper {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-top: 24px;
  font-size: var(--font-caption);
}
.auth-card > .form-help {
  margin-top: 20px;
  text-align: center;
}
.auth-result {
  display: grid;
  justify-items: center;
  gap: 11px;
  margin-top: 34px;
  padding: 30px;
  border-radius: 18px;
  background: var(--color-primary-soft);
  text-align: center;
}
.auth-result > span {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary);
}
.auth-result .button {
  margin-top: 10px;
}
</style>
