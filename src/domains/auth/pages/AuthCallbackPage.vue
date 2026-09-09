<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import { roleHome } from '../authSession.js'
const route = useRoute()
const router = useRouter()
const message = ref('로그인 상태를 확인하고 있습니다.')
const failed = ref(false)
onMounted(async () => {
  if (route.query.code || route.query.signupSessionId) {
    failed.value = true
    message.value = route.query.signupSessionId
      ? '아직 가입이 완료되지 않은 계정입니다. 가입한 소셜 계정으로 다시 로그인해 주세요.'
      : '소셜 로그인을 완료하지 못했습니다. 다시 시도해 주세요.'
    await router.replace({ path: '/auth/callback' })
    return
  }
  try {
    const user = await authSession.completeSocialLogin()
    await router.replace(roleHome(user.role))
  } catch {
    failed.value = true
    message.value = '로그인 세션을 확인할 수 없습니다. 같은 소셜 계정으로 다시 로그인해 주세요.'
  }
})
</script>
<template>
  <main class="page workspace-ui">
    <section class="ui-surface ui-stack">
      <h1>로그인 확인</h1>
      <p role="status">{{ message }}</p>
      <RouterLink v-if="failed" class="button button-primary" to="/login">다시 로그인</RouterLink>
    </section>
  </main>
</template>
