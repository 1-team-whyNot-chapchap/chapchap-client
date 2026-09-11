<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import { loginPath } from '../authSession.js'
const route = useRoute()
const router = useRouter()
const busy = ref(false)
const error = ref('')
async function logout() {
  if (busy.value) return
  busy.value = true
  const target = loginPath(route.path)
  try {
    await authSession.logout()
    await router.replace(target)
  } catch {
    error.value = '세션 종료를 확인하지 못했습니다. 다시 로그인해 주세요.'
    await router.replace({ path: target, query: { reason: 'expired' } })
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <button
    v-if="authSession.state.user"
    class="button button-secondary"
    :disabled="busy"
    @click="logout"
  >
    {{ busy ? '종료 중…' : '로그아웃' }}
  </button>
  <span v-if="error" role="alert">{{ error }}</span>
</template>
