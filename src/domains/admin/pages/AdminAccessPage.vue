<script setup>
import { ref } from 'vue'
import { KeyRound, LockKeyhole, ShieldAlert } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import { roleHome } from '../../auth/authSession.js'
const router = useRouter()
const route = useRoute()
const busy = ref(false)

const props = defineProps({
  mode: {
    type: String,
    default: 'login',
  },
})

const emit = defineEmits(['navigate'])
const username = ref('')
const notice = ref('')
const password = ref('')

const stateMessages = {
  denied: {
    icon: ShieldAlert,
    kicker: 'ACCESS DENIED',
    title: '관리자 권한이 필요합니다.',
    description: '권한이 있는 운영 계정으로 다시 로그인해 주세요.',
  },
  expired: {
    icon: LockKeyhole,
    kicker: 'SESSION EXPIRED',
    title: '로그인 시간이 만료되었습니다.',
    description: '안전한 운영을 위해 관리자 로그인이 다시 필요합니다.',
  },
}

async function submitLogin() {
  if (busy.value || !username.value || !password.value) return
  busy.value = true
  notice.value = ''
  try {
    const result = await authSession.loginAdmin(username.value, password.value)
    await router.replace(
      result.mustChangePassword ? '/admin/password/initial' : roleHome(result.user.role),
    )
  } catch {
    notice.value = '로그인하지 못했습니다. 계정 정보와 상태를 확인한 뒤 다시 시도해 주세요.'
  } finally {
    password.value = ''
    busy.value = false
  }
}
</script>

<template>
  <main class="admin-access-page workspace-ui">
    <section v-if="props.mode === 'login'" class="admin-access-card">
      <span class="admin-access-card__mark"><KeyRound :size="24" aria-hidden="true" /></span>
      <h1>관리자 로그인</h1>
      <p>운영 권한이 있는 계정으로 로그인해 주세요.</p>
      <p v-if="route.query.reason === 'expired'" class="ui-note" role="status">
        로그인이 만료되었습니다. 다시 로그인해 주세요.
      </p>
      <p v-if="route.query.reason === 'password-changed'" class="ui-note" role="status">
        비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.
      </p>

      <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
      <form class="admin-login-form" @submit.prevent="submitLogin">
        <!-- v-model은 입력값과 JavaScript 변수를 서로 연결하는 Vue 문법입니다. -->
        <label>
          관리자 아이디
          <input
            v-model.trim="username"
            type="text"
            maxlength="50"
            autocomplete="username"
            required
            :disabled="busy"
          />
        </label>
        <label>
          비밀번호
          <input
            v-model="password"
            type="password"
            maxlength="64"
            autocomplete="current-password"
            required
            :disabled="busy"
          />
        </label>
        <button
          class="button button-primary"
          type="submit"
          :disabled="busy || !username || !password"
        >
          {{ busy ? '로그인 중…' : '로그인' }}
        </button>
      </form>

      <button class="text-button" type="button" @click="emit('navigate', 'home')">
        고객 화면으로 돌아가기
      </button>
    </section>

    <section v-else class="admin-access-card admin-access-card--state">
      <span class="admin-access-card__mark">
        <component :is="stateMessages[props.mode].icon" :size="24" aria-hidden="true" />
      </span>
      <h1>{{ stateMessages[props.mode].title }}</h1>
      <p>{{ stateMessages[props.mode].description }}</p>
      <button class="button button-primary" type="button" @click="emit('navigate', 'admin-login')">
        관리자 로그인
      </button>
    </section>
  </main>
</template>

<style scoped>
.admin-access-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background: #f5f6f0;
}

.admin-access-card {
  width: min(100%, 460px);
  padding: 38px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.admin-access-card__mark {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  margin-bottom: 24px;
  border-radius: 16px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.admin-access-card h1 {
  margin-top: 7px;
  font-size: var(--font-page-title);
}

.admin-access-card > p:not(.section-kicker) {
  margin-top: 10px;
}

.admin-login-form {
  display: grid;
  gap: 16px;
  margin-top: 28px;
}

.admin-login-form label {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 700;
}

.admin-login-form input {
  min-height: 46px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
}

.admin-access-card > .text-button {
  margin: 20px auto 0;
}

.admin-access-card--state .button {
  width: 100%;
  margin-top: 28px;
}

@media (max-width: 430px) {
  .admin-access-page {
    padding: 16px;
  }
}

@media (max-width: 430px) {
  .admin-access-card {
    padding: 28px 22px;
  }
}
</style>
