<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { socialLoginUrl } from '../../../common/api/http.js'
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute()
function startSocial(provider) {
  if (selectedProvider.value) return
  selectedProvider.value = provider
  window.location.assign(socialLoginUrl(provider))
}

const props = defineProps({
  pageId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const showPassword = ref(false)
const isSubmitted = ref(false)
const selectedProvider = ref('')

const pages = {
  '002': {
    title: '챱챱에 로그인해요.',
    description: '매일의 식사, 챱챱과 가볍게 시작하세요.',
    fields: [
      { id: 'email', label: '이메일', type: 'email', autocomplete: 'email' },
      { id: 'password', label: '비밀번호', type: 'password', autocomplete: 'current-password' },
    ],
    action: '로그인',
    next: 'home',
    helper: '계정이 없으신가요?',
    helperAction: '회원가입',
    helperTarget: 'signup',
    social: true,
  },
  '003': {
    title: '챱챱을 시작해요.',
    description: '배송과 결제 안내를 받을 기본 정보를 입력해 주세요.',
    fields: [
      { id: 'name', label: '이름', type: 'text', autocomplete: 'name' },
      { id: 'email', label: '이메일', type: 'email', autocomplete: 'email' },
      { id: 'password', label: '비밀번호', type: 'password', autocomplete: 'new-password' },
    ],
    action: '회원가입',
    next: 'wf-007',
    helper: '이미 계정이 있으신가요?',
    helperAction: '로그인',
    helperTarget: 'login',
  },
  '004': {
    title: '비밀번호를 다시 설정해요.',
    description: '가입한 이메일로 재설정 안내를 보내드립니다.',
    fields: [{ id: 'email', label: '이메일', type: 'email', autocomplete: 'email' }],
    action: '재설정 메일 보내기',
    next: 'wf-005',
  },
  '005': {
    title: '새 비밀번호를 입력해요.',
    description: '다른 서비스에서 사용하지 않는 비밀번호를 권장합니다.',
    fields: [
      { id: 'password', label: '새 비밀번호', type: 'password', autocomplete: 'new-password' },
      {
        id: 'password-confirm',
        label: '새 비밀번호 확인',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
    action: '비밀번호 변경',
    next: 'login',
  },
  '006': {
    title: '소셜 계정을 연결해요.',
    description: '기존 챱챱 구독을 유지하면서 더 편하게 로그인할 수 있어요.',
    fields: [{ id: 'email', label: '챱챱 가입 이메일', type: 'email', autocomplete: 'email' }],
    action: '기존 계정 확인',
    next: 'wf-007',
    social: true,
  },
  '007': {
    title: '가입 정보를 완성해요.',
    description: '배송 안내에 필요한 정보만 추가로 확인합니다.',
    fields: [
      { id: 'name', label: '이름', type: 'text', autocomplete: 'name' },
      { id: 'phone', label: '휴대폰 번호', type: 'tel', autocomplete: 'tel' },
    ],
    action: '가입 완료',
    next: 'home',
  },
}

// computed는 현재 pageId에 맞는 화면 설정을 자동으로 골라 줍니다.
const page = computed(() => pages[props.pageId])

function submitForm() {
  isSubmitted.value = true
}

function continueAfterSubmit() {
  emit('navigate', page.value.next)
}
</script>

<template>
  <div class="page auth-page design-review-page">
    <component :is="pageId === '002' ? 'div' : DesignPreview" title="로그인" :allow-empty="false">
      <button
        class="auth-brand"
        type="button"
        aria-label="챱챱 홈으로"
        @click="emit('navigate', 'home')"
      >
        <img class="brand-mark" src="/images/chapchap-brand-logo.png" alt="" />
        <span>챱챱</span>
      </button>

      <section class="auth-card">
        <div class="auth-card__intro">
          <h1>{{ page.title }}</h1>
          <p>{{ page.description }}</p>
        </div>

        <div v-if="isSubmitted" class="auth-result" role="status">
          <span><ShieldCheck :size="30" aria-hidden="true" /></span>
          <strong>예시 화면에서 요청을 확인했어요.</strong>
          <p>실제 인증 결과는 서버 응답을 받은 뒤 다음 화면으로 이동해야 합니다.</p>
          <button class="button button-primary" type="button" @click="continueAfterSubmit">
            다음 화면 보기
            <ArrowRight :size="18" aria-hidden="true" />
          </button>
        </div>

        <div v-else-if="pageId === '002'" class="social-entry">
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

        <form v-else class="auth-form" @submit.prevent="submitForm">
          <label v-for="field in page.fields" :key="field.id" class="form-field">
            <span>{{ field.label }}</span>
            <span class="password-input">
              <input
                :id="field.id"
                :type="field.type === 'password' && showPassword ? 'text' : field.type"
                :autocomplete="field.autocomplete"
                required
              />
              <button
                v-if="field.type === 'password'"
                type="button"
                :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="18" aria-hidden="true" />
                <Eye v-else :size="18" aria-hidden="true" />
              </button>
            </span>
          </label>

          <button
            v-if="pageId === '002'"
            class="auth-forgot-link"
            type="button"
            @click="emit('navigate', 'wf-004')"
          >
            비밀번호를 잊으셨나요?
          </button>

          <button class="button button-primary auth-primary-action" type="submit">
            {{ page.action }}
          </button>

          <template v-if="page.social">
            <div class="auth-divider"><span>또는</span></div>
            <div class="social-login-grid">
              <button
                class="social-login-button social-login-button--google"
                type="button"
                aria-label="Google로 로그인"
                @click="selectedProvider = 'Google'"
              >
                <img src="/images/social/google-signin-light.png" alt="" width="720" height="160" />
              </button>
              <button
                class="social-login-button social-login-button--kakao"
                type="button"
                aria-label="카카오로 로그인"
                @click="selectedProvider = '카카오'"
              >
                <img
                  src="/images/social/kakao-login-ko-narrow.png"
                  alt=""
                  width="366"
                  height="90"
                />
              </button>
            </div>
            <p v-if="selectedProvider" class="social-preview" role="status">
              {{ selectedProvider }} 버튼을 선택했어요. 디자인 미리보기에서는 계정을 연결하지
              않아요.
            </p>
          </template>
        </form>

        <p v-if="page.helper && pageId !== '002'" class="auth-helper">
          {{ page.helper }}
          <button type="button" @click="emit('navigate', page.helperTarget)">
            {{ page.helperAction }}
          </button>
        </p>

        <p v-if="pageId !== '002'" class="form-help">
          디자인 미리보기 · 실제 계정은 연결되지 않아요.
        </p>
      </section>
    </component>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 620px;
}
.auth-brand {
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
