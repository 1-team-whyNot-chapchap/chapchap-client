<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CircleAlert, Inbox, RefreshCw } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },
  empty: { type: String, default: '아직 표시할 내용이 없어요.' },
  allowEmpty: { type: Boolean, default: true },
})
const route = useRoute()
const enabled = computed(() => route.query.design === '1')
const state = ref('default')
watch(
  () => route.fullPath,
  () => {
    state.value = 'default'
  },
)
const screens = [
  { label: '홈', path: '/' },
  { label: '로그인', path: '/login' },
  { label: '마이', path: '/mypage' },
  { label: '상담', path: '/help/chat' },
  { label: '회원가입', path: '/signup' },
  { label: '내 정보', path: '/mypage/profile' },
  { label: 'FAQ', path: '/help/faq' },
]
</script>

<template>
  <details v-if="enabled" class="design-tools">
    <summary>디자인 미리보기 데이터 <span>화면·상태 선택</span></summary>
    <div class="design-tools__body">
      <nav aria-label="디자인 화면 선택">
        <RouterLink
          v-for="screen in screens"
          :key="screen.path"
          :to="{ path: screen.path, query: { design: '1' } }"
          :aria-current="route.path === screen.path ? 'page' : undefined"
          >{{ screen.label }}</RouterLink
        >
      </nav>
      <label
        >화면 상태
        <select v-model="state" aria-label="미리보기 화면 상태">
          <option value="default">기본</option>
          <option value="loading">불러오는 중</option>
          <option v-if="props.allowEmpty" value="empty">내용 없음</option>
          <option value="error">오류</option>
        </select></label
      >
    </div>
  </details>
  <section
    v-if="enabled && state !== 'default'"
    class="design-state"
    :aria-label="`${title} 상태`"
    :aria-busy="state === 'loading'"
  >
    <template v-if="state === 'loading'"
      ><p role="status">{{ title }} 내용을 불러오고 있어요.</p>
      <div class="skeleton" aria-hidden="true"><i /><i /><i /></div
    ></template>
    <template v-else
      ><CircleAlert v-if="state === 'error'" :size="36" aria-hidden="true" /><Inbox
        v-else
        :size="36"
        aria-hidden="true"
      />
      <h2>{{ state === 'error' ? '잠시 내용을 불러오지 못했어요.' : empty }}</h2>
      <p>
        {{
          state === 'error'
            ? '잠시 후 다시 확인해 주세요.'
            : '새로운 소식이 생기면 이곳에서 확인할 수 있어요.'
        }}
      </p></template
    >
    <button class="button button-secondary" type="button" @click="state = 'default'">
      <RefreshCw :size="16" aria-hidden="true" />{{
        state === 'error' ? '다시 확인' : '기본 화면 보기'
      }}
    </button>
  </section>
  <slot v-else />
</template>

<style scoped>
:global(.design-review-page) {
  --color-text-muted: color-mix(in srgb, var(--color-text) 80%, var(--color-surface));
  --color-primary-pressed: color-mix(in srgb, var(--color-primary-hover) 85%, var(--color-text));
}
.design-tools {
  margin: 0 auto 24px;
  padding: 12px 16px;
  max-width: 1080px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  font-size: 13px;
}
summary {
  cursor: pointer;
  min-height: 32px;
  align-content: center;
}
summary span {
  color: var(--color-text-muted);
  margin-left: 12px;
}
.design-tools__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
nav a {
  padding: 10px 14px;
  color: var(--color-text);
  border-radius: 8px;
  text-decoration: none;
  min-height: 44px;
}
nav a[aria-current] {
  background: var(--color-primary-soft);
  font-weight: 800;
}
label {
  display: flex;
  align-items: center;
  gap: 8px;
}
select {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  font: inherit;
  background: var(--color-surface);
  color: var(--color-text);
}
.design-state {
  min-height: 360px;
  padding: 40px 20px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 16px;
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}
.design-state h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.design-state p {
  color: var(--color-text-muted);
}
.skeleton {
  width: min(440px, 100%);
  display: grid;
  gap: 14px;
}
.skeleton i {
  height: 28px;
  background: var(--color-surface-subtle);
  border-radius: 8px;
}
.skeleton i:last-child {
  width: 65%;
}
@media (max-width: 480px) {
  summary span {
    display: block;
    margin-left: 0;
  }
}
</style>
