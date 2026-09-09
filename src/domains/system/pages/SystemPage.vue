<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'

const props = defineProps({ state: { type: String, default: 'not-found' } })
const messages = {
  'not-found': {
    label: '404',
    title: '페이지를 찾을 수 없어요.',
    description: '주소를 다시 확인하거나 홈으로 돌아가세요.',
    action: '홈으로 이동',
    route: 'home',
  },
  error: {
    label: '연결 오류',
    title: '요청을 처리하지 못했어요.',
    description: '연결을 확인한 뒤 다시 시도해 주세요. 계속되면 고객센터에 문의할 수 있습니다.',
    action: '홈으로 이동',
    route: 'home',
  },
  forbidden: {
    label: '권한 부족',
    title: '이 화면에 접근할 수 없어요.',
    description:
      '현재 역할로는 이 화면을 열 수 없습니다. 필요한 경우 다른 계정으로 다시 로그인해 주세요.',
    action: '로그인으로 이동',
    route: 'login',
  },
  expired: {
    label: '세션 만료',
    title: '로그인이 만료되었어요.',
    description: '보안을 위해 다시 로그인해야 합니다. 이전 요청은 자동으로 반복하지 않습니다.',
    action: '다시 로그인',
    route: 'login',
  },
}
const current = computed(() => messages[props.state] ?? messages.error)
const retryRequested = ref(false)
function requestRetry() {
  retryRequested.value = true
}
</script>

<template>
  <main class="system-page" aria-labelledby="system-title">
    <section class="system-card">
      <span class="system-card__label">{{ current.label }}</span>
      <h1 id="system-title">{{ current.title }}</h1>
      <p>{{ current.description }}</p>
      <StateNotice
        v-if="retryRequested"
        tone="info"
        title="재시도 요청 준비"
        message="실제 재시도는 Gateway 오류 정책과 서버 응답을 확인한 뒤 수행합니다. 같은 요청을 반복 전송하지 않습니다."
      />
      <div class="system-card__actions">
        <RouterLink class="button" :to="{ name: current.route }">{{ current.action }}</RouterLink>
        <button
          v-if="state === 'error'"
          class="button button--secondary"
          type="button"
          @click="requestRetry"
        >
          다시 시도
        </button>
        <RouterLink
          v-else-if="state === 'not-found'"
          class="button button--secondary"
          :to="{ name: 'login' }"
          >로그인 화면</RouterLink
        >
      </div>
      <aside class="system-card__help">
        <strong>안내</strong>
        <span v-if="state === 'forbidden'"
          >권한 요청은 관리자가 실제 역할을 확인한 뒤 처리합니다.</span
        >
        <span v-else-if="state === 'expired'"
          >세션 복구와 토큰 갱신은 인증 서버 정책에 따라 한 번만 시도됩니다.</span
        >
        <span v-else>문제가 반복되면 고객센터에서 현재 상태와 다음 조치를 확인할 수 있습니다.</span>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.system-page {
  display: grid;
  min-block-size: 100dvh;
  padding: 28px;
  place-items: center;
}
.system-card {
  width: min(100%, 640px);
  padding: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-floating);
}
.system-card__label {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 900;
}
.system-card h1 {
  margin: 18px 0 10px;
  font-size: var(--font-page-title);
  letter-spacing: -0.04em;
  line-height: var(--line-height-title);
}
.system-card > p {
  margin: 0 0 26px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.system-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.system-card__actions a {
  text-decoration: none;
  text-align: center;
}
.system-card__help {
  display: grid;
  gap: 5px;
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.system-card__help strong {
  color: var(--color-text);
}
@media (max-width: 560px) {
  .system-page {
    padding: 16px;
    place-items: start center;
  }
  .system-card {
    margin-top: 18px;
    padding: 26px 20px;
  }
  .system-card__actions {
    display: grid;
  }
  .system-card__actions .button {
    width: 100%;
  }
}
</style>
