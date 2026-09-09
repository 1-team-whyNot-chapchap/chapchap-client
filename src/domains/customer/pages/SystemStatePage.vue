<script setup>
import { computed } from 'vue'
import { CircleAlert, Home, RotateCcw, ShieldAlert } from 'lucide-vue-next'

const props = defineProps({
  state: {
    type: String,
    default: 'not-found',
  },
})

const emit = defineEmits(['navigate'])

const states = {
  forbidden: {
    kicker: '접근 권한 안내',
    title: '이 화면에 접근할 수 없어요.',
    description:
      '현재 계정으로 이용할 수 없는 화면입니다. 홈으로 돌아가거나 로그인 화면을 확인해 주세요.',
  },
  'not-found': {
    kicker: '404',
    title: '요청한 페이지를 찾을 수 없어요.',
    description: '주소가 변경되었거나 더 이상 제공하지 않는 페이지일 수 있어요.',
  },
  error: {
    kicker: 'SERVICE ERROR',
    title: '화면을 불러오지 못했어요.',
    description: '잠시 후 다시 시도해 주세요. 문제가 계속되면 고객지원으로 알려 주세요.',
  },
}
const current = computed(() => states[props.state] || states['not-found'])
</script>

<template>
  <div class="system-state-page workspace-ui design-review-page">
    <ShieldAlert v-if="state === 'forbidden'" :size="40" aria-hidden="true" />
    <CircleAlert v-else :size="40" aria-hidden="true" />
    <h1>{{ current.title }}</h1>
    <p>{{ current.description }}</p>
    <div class="system-state-page__actions">
      <RouterLink class="button button-primary" to="/">
        <Home :size="18" aria-hidden="true" />
        홈으로
      </RouterLink>
      <button
        class="button button-outline"
        type="button"
        @click="emit('navigate', 'customer-support')"
      >
        <RotateCcw :size="18" aria-hidden="true" />
        고객지원
      </button>
    </div>
    <nav v-if="state === 'forbidden'" class="system-login-links" aria-label="로그인 방식">
      <RouterLink to="/login">고객 로그인</RouterLink>
      <RouterLink to="/rider/login">라이더 로그인</RouterLink>
      <RouterLink to="/admin/login">관리자 로그인</RouterLink>
    </nav>
    <p v-if="state === 'forbidden'" class="ui-muted">
      로그인 화면 이동만으로 권한이 부여되지는 않습니다.
    </p>
  </div>
</template>

<style scoped>
.system-state-page {
  min-height: 100svh;
  max-width: 620px;
  display: grid;
  align-content: center;
  justify-items: center;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
  text-align: center;
}

.system-state-page > svg {
  margin-bottom: 20px;
  color: var(--color-primary-pressed);
}

.system-state-page h1 {
  margin-top: 9px;
  font-size: var(--font-page-title);
}

.system-state-page > p:not(.section-kicker) {
  margin-top: var(--space-4);
}
.system-login-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
.system-login-links a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--color-primary-pressed);
  text-underline-offset: 4px;
}
.system-state-page :focus-visible {
  outline: 3px solid var(--color-primary-hover);
  outline-offset: 3px;
}

.system-state-page__actions {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

@media (max-width: 430px) {
  .system-state-page__actions {
    width: 100%;
    flex-direction: column;
  }
}

@media (max-width: 430px) {
  .system-state-page__actions .button {
    width: 100%;
  }
}
</style>
