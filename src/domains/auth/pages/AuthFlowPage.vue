<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'

const props = defineProps({ screen: { type: String, default: 'login' } })
const router = useRouter()

const content = {
  login: {
    title: '서비스를 시작하세요',
    description:
      '카카오 또는 Google 계정으로 시작할 수 있습니다. 관리자 계정은 별도 로그인 화면을 사용합니다.',
  },
  'signup-session': {
    title: '가입을 이어가세요',
    description: '가입 세션은 15분 동안 유지됩니다. 만료되면 소셜 로그인부터 다시 시작합니다.',
  },
  verify: {
    title: '휴대폰 본인인증',
    description: '가입 목적과 최소한의 개인정보 이용을 확인한 뒤 본인인증을 요청합니다.',
  },
  policies: {
    title: '정책 동의',
    description: '필수 정책과 선택 동의를 구분해 확인할 수 있습니다.',
  },
  profile: {
    title: '기본 정보를 확인하세요',
    description: '서버가 제공하거나 허용한 정보만 확인해 가입을 완료합니다.',
  },
  link: {
    title: '기존 계정을 연결할까요?',
    description: '같은 사람의 기존 계정만 연결할 수 있습니다. 연결 결과는 서버가 최종 확인합니다.',
  },
  complete: {
    title: '가입 완료 안내',
    description:
      '가입 결과와 다음 이용 안내는 서버 응답 뒤 표시됩니다. 현재는 화면 흐름을 확인하는 시연 상태입니다.',
  },
  'link-result': {
    title: '계정 연결 결과 안내',
    description: '연결 완료 여부와 연결 가능한 계정 정보는 인증 서버의 응답으로 확정됩니다.',
  },
  expired: {
    title: '가입 세션이 만료되었어요',
    description:
      '보안을 위해 진행 중이던 가입 정보를 종료했습니다. 소셜 로그인부터 다시 시작해 주세요.',
  },
  'admin-login': {
    title: '관리자 로그인',
    description:
      '관리자 계정으로만 접근할 수 있습니다. 오류는 계정 상태와 무관하게 동일한 문구로 안내합니다.',
  },
  'admin-password': {
    title: '비밀번호를 변경하세요',
    description:
      '임시 비밀번호를 사용 중이면 변경을 마칠 때까지 다른 관리자 화면에 접근할 수 없습니다.',
  },
}

const current = computed(() => content[props.screen] ?? content.login)
const form = reactive({
  phone: '',
  nickname: '',
  adminId: '',
  password: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  requiredTerms: false,
  privacyTerms: false,
  ageTerms: false,
  linkConfirmed: false,
})
const requestMessage = ref('')

const isSignup = computed(() =>
  ['signup-session', 'verify', 'policies', 'profile'].includes(props.screen),
)
const isResult = computed(() => ['complete', 'link-result', 'expired'].includes(props.screen))
const phoneDigits = computed(() => form.phone.replace(/\D/g, ''))
const valid = computed(() => {
  if (props.screen === 'verify')
    return phoneDigits.value.length >= 10 && phoneDigits.value.length <= 11
  if (props.screen === 'policies') return form.requiredTerms && form.privacyTerms && form.ageTerms
  if (props.screen === 'profile') return form.nickname.trim().length >= 2
  if (props.screen === 'link') return form.linkConfirmed
  if (props.screen === 'admin-login') return true
  if (props.screen === 'admin-password') {
    return (
      form.currentPassword.length > 0 &&
      form.newPassword.length >= 8 &&
      form.newPassword === form.confirmPassword
    )
  }
  return true
})
const actionLabel = computed(() => {
  const labels = {
    verify: '인증 요청 준비',
    policies: '동의하고 계속',
    profile: '가입 완료 요청 준비',
    link: '계정 연결 요청 준비',
    'admin-login': '관리자 화면으로 이동',
    'admin-password': '변경 요청 준비',
  }
  return labels[props.screen] ?? '계속하기'
})

function submitForm() {
  if (!valid.value) return
  const nextScreen = {
    verify: 'signup-policies',
    policies: 'signup-profile',
    profile: 'signup-complete',
    link: 'social-account-link-result',
  }[props.screen]
  if (nextScreen) {
    router.push({ name: nextScreen })
    return
  }
  if (props.screen === 'admin-login') {
    router.push({ name: 'admin-dashboard' })
    return
  }
  requestMessage.value =
    '요청을 보낼 준비가 되었습니다. 실제 인증·가입·계정 연결·비밀번호 변경 결과는 서버 응답으로만 확정됩니다.'
}

function startProvider() {
  router.push({ name: 'app-mypage' })
}
</script>

<template>
  <main class="auth-page" :class="`auth-page--${screen}`" aria-labelledby="auth-title">
    <section class="auth-card">
      <header class="auth-card__header">
        <RouterLink class="brand" :to="{ name: 'home' }">챱챱</RouterLink>
        <span
          v-if="screen === 'admin-login' || screen === 'admin-password'"
          class="status status--warning"
          >관리자 전용</span
        >
      </header>

      <ol v-if="isSignup" class="signup-steps" aria-label="가입 단계">
        <li :class="{ active: screen === 'signup-session' }">시작</li>
        <li :class="{ active: screen === 'verify' }">인증</li>
        <li :class="{ active: screen === 'policies' }">동의</li>
        <li :class="{ active: screen === 'profile' }">확인</li>
      </ol>

      <div class="auth-card__intro">
        <h1 id="auth-title">{{ current.title }}</h1>
        <p>{{ current.description }}</p>
      </div>

      <StateNotice v-if="requestMessage" tone="info" title="요청 상태" :message="requestMessage" />

      <div v-if="screen === 'login'" class="providers">
        <button class="provider provider--kakao" type="button" @click="startProvider">
          카카오로 계속하기
        </button>
        <button class="provider" type="button" @click="startProvider">Google로 계속하기</button>
        <RouterLink class="text-link" :to="{ name: 'admin-login' }">관리자 로그인</RouterLink>
      </div>

      <StateNotice
        v-if="screen === 'login' || screen === 'admin-login'"
        tone="warning"
        title="개발용 접근"
        message="현재는 서버 인증 없이 화면 탐색을 위해 로그인 후 해당 작업 영역으로 이동합니다."
      />

      <section v-if="screen === 'signup-session'" class="session-panel" aria-label="가입 세션 안내">
        <span class="status status--info">15분 유효 · 서버 시간 기준</span>
        <p>진행 중인 인증과 동의 단계는 서버 세션이 유지되는 동안에만 이어집니다.</p>
        <RouterLink class="button" :to="{ name: 'signup-verify' }">본인인증으로 이동</RouterLink>
        <RouterLink class="text-link" :to="{ name: 'login' }">처음부터 다시 시작</RouterLink>
      </section>

      <section v-else-if="isResult" class="result-panel" aria-label="인증 결과 안내">
        <span class="status" :class="screen === 'expired' ? 'status--warning' : 'status--success'">
          {{ screen === 'expired' ? '다시 시작 필요' : '시연 결과 화면' }}
        </span>
        <p>
          {{
            screen === 'expired'
              ? '세션 만료·취소·실패는 가입 완료로 처리하지 않습니다.'
              : '실제 가입·계정 연결 성공 여부는 인증 서버 응답을 받은 뒤에만 확정됩니다.'
          }}
        </p>
        <div class="result-panel__actions">
          <RouterLink v-if="screen === 'complete'" class="button" :to="{ name: 'app-addresses' }"
            >배송지 등록으로 이동</RouterLink
          >
          <RouterLink v-if="screen === 'link-result'" class="button" :to="{ name: 'app-mypage' }"
            >마이페이지로 이동</RouterLink
          >
          <RouterLink v-if="screen === 'expired'" class="button" :to="{ name: 'login' }"
            >소셜 로그인으로 다시 시작</RouterLink
          >
          <RouterLink v-if="screen !== 'expired'" class="text-link" :to="{ name: 'home' }"
            >홈으로</RouterLink
          >
        </div>
      </section>

      <form v-else-if="screen !== 'login'" class="form" novalidate @submit.prevent="submitForm">
        <template v-if="screen === 'verify'">
          <label
            >휴대폰 번호<input
              v-model="form.phone"
              inputmode="tel"
              autocomplete="tel"
              placeholder="010-0000-0000"
              aria-describedby="phone-help"
          /></label>
          <small id="phone-help"
            >인증 요청에 필요한 번호만 입력합니다. 저장과 확인은 인증 서버가 처리합니다.</small
          >
        </template>
        <template v-else-if="screen === 'policies'">
          <fieldset class="policy-list">
            <legend>필수 동의</legend>
            <label
              ><input v-model="form.requiredTerms" type="checkbox" /> 서비스 이용약관에
              동의합니다.</label
            ><label
              ><input v-model="form.privacyTerms" type="checkbox" /> 개인정보 수집·이용에
              동의합니다.</label
            ><label
              ><input v-model="form.ageTerms" type="checkbox" /> 만 14세 이상임을 확인합니다.</label
            >
          </fieldset>
          <fieldset class="policy-list policy-list--optional">
            <legend>선택 동의</legend>
            <label><input type="checkbox" /> 혜택 알림 수신에 동의합니다.</label>
          </fieldset>
        </template>
        <template v-else-if="screen === 'profile'">
          <label
            >표시 이름<input
              v-model="form.nickname"
              autocomplete="nickname"
              maxlength="24"
              placeholder="2자 이상 입력"
          /></label>
          <StateNotice
            tone="info"
            title="정보 확인 범위"
            message="소셜 계정 정보의 수정 가능 여부와 가입 완료는 서버 정책을 따릅니다."
          />
        </template>
        <template v-else-if="screen === 'link'">
          <StateNotice
            tone="warning"
            title="계정 연결 전 확인"
            message="다른 사람의 계정은 연결할 수 없습니다. 연결 후에는 인증 서버의 결과를 확인해 주세요."
          />
          <label class="check"
            ><input v-model="form.linkConfirmed" type="checkbox" /> 동일인 계정 연결 안내를
            확인했습니다.</label
          >
        </template>
        <template v-else-if="screen === 'admin-login'">
          <label>아이디<input v-model="form.adminId" autocomplete="username" /></label>
          <label
            >비밀번호<input v-model="form.password" type="password" autocomplete="current-password"
          /></label>
          <p class="form-hint">
            로그인 실패 시 계정 존재·비밀번호 오류·비활성·잠금을 구분하지 않고 동일한 안내를
            제공합니다.
          </p>
        </template>
        <template v-else-if="screen === 'admin-password'">
          <label
            >현재 비밀번호<input
              v-model="form.currentPassword"
              type="password"
              autocomplete="current-password"
          /></label>
          <label
            >새 비밀번호<input
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              aria-describedby="password-help"
          /></label>
          <label
            >새 비밀번호 확인<input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
          /></label>
          <small id="password-help"
            >8자 이상 입력과 확인 일치 여부만 화면에서 확인합니다. 실제 정책은 서버가
            검증합니다.</small
          >
        </template>

        <p v-if="!valid" id="auth-validation-hint" class="form-error">
          필수 입력을 완료하면 요청 준비 버튼이 활성화됩니다.
        </p>
        <button
          class="button"
          type="submit"
          :disabled="!valid"
          :aria-describedby="valid ? undefined : 'auth-validation-hint'"
        >
          {{ actionLabel }}
        </button>
      </form>

      <aside class="auth-boundary" aria-label="서버 처리 안내">
        OAuth·본인인증·관리자 로그인·비밀번호 변경 결과는 실제 서버 응답을 기준으로 처리합니다.
      </aside>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-block-size: 100dvh;
  padding: 28px;
  place-items: center;
}
.auth-card {
  width: min(100%, 560px);
  padding: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-floating);
}
.auth-page--login .auth-card {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(260px, 1fr);
  column-gap: 48px;
  width: min(100%, 860px);
}
.auth-page--login .auth-card__header,
.auth-page--login .auth-boundary,
.auth-page--login :deep(.state-notice) {
  grid-column: 1 / -1;
}
.auth-page--login .auth-card__intro {
  grid-column: 1;
  margin: 58px 0 30px;
}
.auth-page--login .providers {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
}
.auth-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.brand {
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
  text-decoration: none;
}
.auth-card__intro {
  margin: 30px 0 25px;
}
.auth-card h1 {
  margin: 0 0 10px;
  font-size: var(--font-page-title);
  letter-spacing: -0.04em;
  line-height: var(--line-height-title);
}
.auth-card__intro p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.signup-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  padding: 0;
  margin: 26px 0 0;
  list-style: none;
}
.signup-steps li {
  padding-top: 8px;
  border-top: 3px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.signup-steps li.active {
  border-color: var(--color-primary);
  color: var(--color-text);
}
.providers,
.form,
.session-panel {
  display: grid;
  gap: 12px;
}
.provider {
  min-height: 50px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 800;
  text-align: left;
}
.provider--kakao {
  border-color: #f0d800;
  background: #fee500;
}
.text-link {
  color: var(--color-text-muted);
  font-size: var(--font-body);
  font-weight: 700;
  text-align: center;
}
.session-panel {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}
.session-panel p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.session-panel .button {
  text-align: center;
  text-decoration: none;
}
.result-panel {
  display: grid;
  gap: 14px;
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}
.result-panel > p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.result-panel__actions {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}
.result-panel .button {
  display: inline-grid;
  place-items: center;
  text-decoration: none;
}
.form label {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 800;
}
.form input {
  width: 100%;
  min-height: 48px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
}
.form small,
.form-hint {
  margin: -3px 0 2px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.policy-list {
  min-width: 0;
  overflow-wrap: anywhere;
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.policy-list legend {
  float: left;
  width: 100%;
  min-width: 0;
  padding: 0;
  font-weight: 900;
}
.policy-list label,
.form .check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-weight: 500;
  line-height: var(--line-height-compact);
}
.policy-list input,
.form .check input {
  width: 18px;
  min-height: 18px;
  margin-top: 1px;
  padding: 0;
}
.policy-list--optional {
  background: var(--color-primary-soft);
}
.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-body);
  font-weight: 800;
}
.auth-boundary {
  margin-top: 22px;
  padding: 14px 16px;
  border-left: 4px solid var(--color-info);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 560px) {
  .auth-page {
    padding: 16px;
    place-items: start center;
  }
  .auth-card {
    margin-top: 18px;
    padding: 24px 20px;
  }
  .auth-page--login .auth-card {
    display: block;
    width: min(100%, 560px);
  }
  .auth-page--login .auth-card__intro {
    margin: 34px 0 24px;
  }
  .signup-steps {
    gap: 3px;
  }
  .signup-steps li {
    font-size: var(--font-caption);
  }
  .button {
    width: 100%;
  }
}
</style>
