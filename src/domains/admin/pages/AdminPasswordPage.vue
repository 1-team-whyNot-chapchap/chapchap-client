<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import http, { authSession } from '../../../common/api/http.js'
import { KeyRound } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'
const emit = defineEmits(['navigate'])
const route = useRoute()
const initial = computed(
  () => route.path === '/admin/password/initial' || route.query.mode === 'initial',
)
const router = useRouter()
const busy = ref(false)
const username = ref('')
const current = ref('')
const next = ref('')
const confirm = ref('')
const error = ref('')
const ready = computed(
  () =>
    !busy.value &&
    current.value &&
    next.value &&
    confirm.value &&
    (!initial.value || username.value),
)
async function review() {
  if (!ready.value) return
  error.value = ''
  if (
    next.value.length < 10 ||
    next.value.length > 64 ||
    !/[A-Za-z]/.test(next.value) ||
    !/\d/.test(next.value) ||
    /\s/.test(next.value)
  ) {
    error.value = '새 비밀번호는 문자·숫자 포함 10~64자, 공백 없이 입력해 주세요.'
    return
  }
  if (next.value === current.value) {
    error.value = '현재 비밀번호와 다른 값을 입력해 주세요.'
    return
  }
  if (next.value !== confirm.value) {
    error.value = '새 비밀번호와 확인 값이 일치하지 않습니다.'
    return
  }
  busy.value = true
  try {
    const request = {
      currentPassword: current.value,
      newPassword: next.value,
      newPasswordConfirmation: confirm.value,
    }
    if (initial.value)
      await authSession.changeInitialPassword({ ...request, username: username.value })
    else {
      await http.post('/api/auth/admin/password', request, { skipAuthRetry: true })
      authSession.clear()
    }
    await router.replace({ path: '/admin/login', query: { reason: 'password-changed' } })
  } catch {
    error.value = '변경하지 못했습니다. 현재 비밀번호와 계정 상태를 확인해 주세요.'
  } finally {
    current.value = ''
    next.value = ''
    confirm.value = ''
    busy.value = false
  }
}
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar
      v-if="!initial"
      current-route="admin-password"
      @navigate="emit('navigate', $event)"
    />
    <div class="admin-main workspace-ui design-review-page">
      <header class="ui-heading">
        <div>
          <h1>관리자 비밀번호 변경</h1>
          <p>
            {{
              initial
                ? '최초 로그인 비밀번호를 새로 설정합니다.'
                : '현재 비밀번호를 확인하고 새 비밀번호를 설정합니다.'
            }}
          </p>
        </div>
      </header>
      <p class="ui-note">변경 후 새 비밀번호로 다시 로그인해야 합니다.</p>
      <form class="ui-surface ui-stack password-panel" @submit.prevent="review">
        <span class="ui-icon"><KeyRound :size="24" aria-hidden="true" /></span>
        <label v-if="initial" class="ui-field"
          >관리자 아이디<input v-model="username" maxlength="50" required autocomplete="username"
        /></label>
        <label class="ui-field"
          >현재 비밀번호<input
            v-model="current"
            type="password"
            maxlength="64"
            required
            autocomplete="current-password"
        /></label>
        <label class="ui-field"
          >새 비밀번호<input
            v-model="next"
            type="password"
            minlength="10"
            maxlength="64"
            required
            autocomplete="new-password"
            aria-describedby="password-policy"
        /></label>
        <p id="password-policy" class="ui-muted">
          문자·숫자 포함 10~64자 · 공백 불가 · 현재 비밀번호와 다르게
        </p>
        <label class="ui-field"
          >새 비밀번호 확인<input
            v-model="confirm"
            type="password"
            maxlength="64"
            required
            autocomplete="new-password"
        /></label>
        <p v-if="error" class="ui-error" role="alert">{{ error }}</p>
        <button class="button button-primary" type="submit" :disabled="!ready">
          {{ busy ? '변경 중…' : '비밀번호 변경' }}</button
        ><RouterLink class="button button-secondary" to="/admin/login">로그인으로</RouterLink>
      </form>
    </div>
  </div>
</template>
<style scoped>
.password-panel {
  max-width: 560px;
  margin-inline: auto;
}
</style>
