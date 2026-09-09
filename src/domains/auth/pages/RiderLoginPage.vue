<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Bike, Eye, EyeOff, KeyRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'

const riderId = ref('')
const password = ref('')
const showPassword = ref(false)
const isPreviewReady = ref(false)

const canSubmit = computed(() => riderId.value.trim().length > 0 && password.value.length > 0)

function prepareLoginPreview() {
  if (!canSubmit.value) return
  isPreviewReady.value = true
}
</script>

<template>
  <main class="rider-login-page" aria-labelledby="rider-login-title">
    <section class="rider-login-card">
      <header class="rider-login-card__header">
        <RouterLink class="rider-login-brand" :to="{ name: 'home' }" aria-label="챱챱 홈으로">
          <img src="/images/chapchap-brand-logo.png" alt="" />
          <span>챱챱</span>
        </RouterLink>
        <span class="status status--info"><Bike :size="15" aria-hidden="true" />라이더 전용</span>
      </header>

      <div class="rider-login-intro">
        <h1 id="rider-login-title">오늘의 배송을 시작하세요.</h1>
        <p>관리자가 발급한 라이더 아이디와 비밀번호로 로그인합니다.</p>
      </div>

      <section class="account-boundary" aria-labelledby="rider-account-guide">
        <span class="account-boundary__icon"><KeyRound :size="20" aria-hidden="true" /></span>
        <div>
          <strong id="rider-account-guide">라이더 계정은 관리자가 발급합니다.</strong>
          <p>
            별도 회원가입은 제공하지 않습니다. 계정이 없거나 사용할 수 없다면 관리자에게 문의해
            주세요.
          </p>
        </div>
      </section>

      <StateNotice
        v-if="isPreviewReady"
        tone="success"
        title="화면 입력 확인 완료"
        message="백엔드 로그인은 아직 연결하지 않았습니다. 아래 버튼으로 라이더 업무 화면만 미리 볼 수 있습니다."
      />

      <form class="rider-login-form" novalidate @submit.prevent="prepareLoginPreview">
        <label for="rider-id">라이더 아이디</label>
        <input
          id="rider-id"
          v-model.trim="riderId"
          name="riderId"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          required
          @input="isPreviewReady = false"
        />

        <label for="rider-password">비밀번호</label>
        <span class="rider-password-field">
          <input
            id="rider-password"
            v-model="password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            @input="isPreviewReady = false"
          />
          <button
            type="button"
            :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="19" aria-hidden="true" />
            <Eye v-else :size="19" aria-hidden="true" />
          </button>
        </span>

        <p v-if="!canSubmit" id="rider-login-help" class="rider-login-help">
          아이디와 비밀번호를 모두 입력하면 로그인 준비 버튼이 활성화됩니다.
        </p>

        <button
          class="button rider-login-submit"
          type="submit"
          :disabled="!canSubmit"
          :aria-describedby="canSubmit ? undefined : 'rider-login-help'"
        >
          로그인 준비
        </button>
      </form>

      <RouterLink
        v-if="isPreviewReady"
        class="rider-preview-link"
        :to="{ name: 'rider-deliveries' }"
      >
        라이더 업무 화면 미리보기
        <ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>

      <footer class="rider-login-footer">
        <p>고객 계정은 소셜 로그인을 이용해 주세요.</p>
        <RouterLink :to="{ name: 'login' }">고객 로그인으로 돌아가기</RouterLink>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.rider-login-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background:
    linear-gradient(135deg, var(--color-primary-soft), transparent 46%), var(--color-background);
}

.rider-login-card {
  width: min(100%, 520px);
  padding: clamp(var(--space-5), 5vw, var(--space-7));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-floating);
}

.rider-login-card__header,
.rider-login-brand,
.account-boundary,
.rider-preview-link {
  display: flex;
  align-items: center;
}

.rider-login-card__header {
  justify-content: space-between;
  gap: var(--space-4);
}

.rider-login-brand {
  gap: var(--space-2);
  min-height: 44px;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.06em;
  text-decoration: none;
}

.rider-login-brand img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.rider-login-intro {
  margin: var(--space-7) 0 var(--space-5);
}

.rider-login-kicker {
  margin: 0 0 var(--space-2);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-heavy);
  letter-spacing: 0.08em;
}

.rider-login-intro h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
  line-height: var(--line-height-title);
}

.rider-login-intro > p:last-child,
.account-boundary p,
.rider-login-footer p {
  color: var(--color-text-muted);
}

.rider-login-intro > p:last-child {
  margin: var(--space-3) 0 0;
}

.account-boundary {
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}

.account-boundary__icon {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-primary-pressed);
}

.account-boundary strong,
.account-boundary p {
  display: block;
}

.account-boundary p {
  margin: var(--space-1) 0 0;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.rider-login-form {
  display: grid;
  gap: var(--space-2);
}

.rider-login-form label {
  margin-top: var(--space-2);
  font-weight: var(--font-weight-bold);
}

.rider-login-form input {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.rider-password-field {
  position: relative;
}

.rider-password-field input {
  padding-right: 50px;
}

.rider-password-field button {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  transform: translateY(-50%);
}

.rider-login-help {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.rider-login-submit {
  width: 100%;
  margin-top: var(--space-3);
}

.rider-preview-link {
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
  margin-top: var(--space-3);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-primary-pressed);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.rider-login-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.rider-login-footer p {
  margin: 0 0 var(--space-1);
  font-size: var(--font-caption);
}

.rider-login-footer a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: var(--color-primary-pressed);
  font-weight: var(--font-weight-bold);
  text-underline-offset: 3px;
}

@media (max-width: 560px) {
  .rider-login-page {
    place-items: start center;
    padding: var(--space-4);
  }

  .rider-login-card {
    padding: var(--space-5) var(--space-4);
  }

  .rider-login-intro {
    margin-top: var(--space-6);
  }
}
</style>
