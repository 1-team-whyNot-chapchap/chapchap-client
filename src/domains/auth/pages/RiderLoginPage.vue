<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { socialLoginUrl } from '../../../common/api/http.js'
import { Bike } from 'lucide-vue-next'
const selectedProvider = ref('')
const route = useRoute()
function startSocial(provider) {
  if (selectedProvider.value) return
  selectedProvider.value = provider
  window.location.assign(socialLoginUrl(provider))
}
</script>

<template>
  <div class="rider-login-page">
    <section class="rider-login-card" aria-labelledby="rider-login-heading">
      <RouterLink class="rider-brand" :to="{ name: 'home' }" aria-label="챱챱 홈으로">
        <img src="/images/chapchap-brand-logo.png" alt="" /><span>챱챱</span>
      </RouterLink>
      <header class="rider-intro">
        <span class="rider-label"><Bike :size="18" aria-hidden="true" />라이더 로그인</span>
        <h1 id="rider-login-heading">가입한 소셜 계정으로 배송을 시작하세요.</h1>
        <p>관리자가 라이더로 변경한 카카오·구글 계정을 그대로 사용하세요.</p>
      </header>
      <div class="rider-social-buttons">
        <button
          type="button"
          class="rider-social rider-kakao"
          aria-label="카카오로 로그인"
          :disabled="Boolean(selectedProvider)"
          @click="startSocial('kakao')"
        >
          <img src="/images/social/kakao-login-ko-narrow.png" alt="" />
        </button>
        <button
          type="button"
          class="rider-social rider-google"
          aria-label="Google로 로그인"
          :disabled="Boolean(selectedProvider)"
          @click="startSocial('google')"
        >
          <img src="/images/social/google-signin-light.png" alt="" />
        </button>
      </div>
      <p class="rider-preview" role="status">
        {{
          selectedProvider
            ? '소셜 로그인으로 이동하고 있습니다.'
            : route.query.reason === 'expired'
              ? '로그인이 만료되었거나 계정 상태가 바뀌었습니다. 다시 로그인해 주세요.'
              : '로그인 후 현재 계정 역할에 맞는 화면으로 이동합니다.'
        }}
      </p>
      <section class="rider-guide" aria-labelledby="rider-registration-heading">
        <h2 id="rider-registration-heading">처음 라이더로 등록하시나요?</h2>
        <ol>
          <li>
            <strong>소셜 계정으로 가입</strong
            ><span>챱챱에 가입하고 휴대폰 번호를 등록하세요.</span>
          </li>
          <li>
            <strong>관리자에게 등록 요청</strong
            ><span>가입한 번호를 전달하고 본인 확인을 받으세요.</span>
          </li>
          <li>
            <strong>승격 안내 후 다시 로그인</strong
            ><span>같은 소셜 계정으로 로그인하세요. 업무 설정과 배정 후 배송을 시작합니다.</span>
          </li>
        </ol>
        <p>변경 안내를 받았는데 고객 화면이 보이면 로그아웃 후 다시 로그인해 주세요.</p>
      </section>
      <RouterLink class="rider-back" :to="{ name: 'login' }">가입·고객 로그인으로 이동</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.rider-login-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: var(--space-5) var(--space-4);
  background: var(--color-background);
}
.rider-login-card {
  width: min(100%, 520px);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow-wrap: anywhere;
}
.rider-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-bold);
  min-height: 44px;
}
.rider-brand img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.rider-intro {
  margin-block: var(--space-5);
  display: grid;
  gap: var(--space-3);
}
.rider-label {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-primary-hover);
}
.rider-intro h1 {
  font-size: var(--font-page-title);
  line-height: 1.35;
}
.rider-intro p,
.rider-guide p,
.rider-guide li span {
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.rider-social-buttons {
  display: grid;
  gap: var(--space-3);
}
.rider-social {
  width: 100%;
  min-height: 50px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  padding: 0;
  overflow: hidden;
}
.rider-social img {
  display: block;
  object-fit: contain;
  height: 48px;
  max-width: 100%;
}
.rider-kakao {
  background: #fee500;
  border: 1px solid #fee500;
}
.rider-google {
  background: #fff;
  border: 1px solid var(--color-border);
}
.rider-preview {
  margin-block: var(--space-4);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
  color: var(--color-text);
}
.rider-guide {
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}
.rider-guide h2 {
  font-size: var(--font-item-title);
}
.rider-guide ol {
  padding-left: var(--space-5);
  display: grid;
  gap: var(--space-4);
  margin-block: var(--space-4);
}
.rider-guide li span {
  display: block;
  margin-top: var(--space-1);
}
.rider-guide strong {
  font-size: var(--font-body);
}
.rider-back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: var(--space-4);
  text-decoration: underline;
  text-underline-offset: 4px;
}
@media (max-width: 375px) {
  .rider-login-card {
    padding: var(--space-5) var(--space-4);
  }
}
</style>
