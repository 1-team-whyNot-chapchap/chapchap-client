<script setup>
import { RouterLink } from 'vue-router'
import { CircleAlert } from 'lucide-vue-next'
defineProps({
  title: { type: String, required: true },
  description: {
    type: String,
    default: '이 기능은 아직 제공되지 않습니다. 이용 가능한 메뉴에서 계속 진행해 주세요.',
  },
  to: { type: String, default: '/mypage' },
  action: { type: String, default: '마이페이지로' },
})
</script>
<template>
  <section class="workspace-ui unavailable-feature">
    <header class="ui-heading">
      <h1>{{ title }}</h1>
    </header>
    <div class="ui-surface ui-stack">
      <CircleAlert :size="28" aria-hidden="true" />
      <h2>서비스 준비 중</h2>
      <p>{{ description }}</p>
      <div class="ui-actions ui-actions--end">
        <RouterLink class="button button-secondary" :to="to">{{ action }}</RouterLink>
      </div>
    </div>
  </section>
</template>
<style scoped>
.unavailable-feature {
  max-width: 760px;
}
.unavailable-feature svg {
  color: var(--color-primary-pressed);
}
</style>
