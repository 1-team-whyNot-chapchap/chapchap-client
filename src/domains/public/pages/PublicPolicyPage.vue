<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PublicFooter from '../components/PublicFooter.vue'
import PublicHeader from '../components/PublicHeader.vue'

const props = defineProps({ document: { type: String, required: true } })

const content = computed(() =>
  props.document === 'privacy'
    ? {
        label: '개인정보 처리방침',
        title: '개인정보 처리방침',
        description: '가입과 서비스 이용에 필요한 개인정보 처리 기준을 확인하는 공간입니다.',
      }
    : {
        label: '이용약관',
        title: '챱챱 이용약관',
        description: '서비스 이용 전 확인해야 하는 기본 약관을 안내합니다.',
      },
)
</script>

<template>
  <div class="policy-page">
    <PublicHeader />
    <main class="policy-content" aria-labelledby="policy-title">
      <p>{{ content.label }}</p>
      <h1 id="policy-title">{{ content.title }}</h1>
      <span>{{ content.description }}</span>
      <StateNotice
        tone="info"
        title="정책 원문 연동 전"
        message="정책의 활성 Version과 원문은 Auth-Service 계약 연결 후 서버 응답으로 표시합니다. 현재 화면은 정책 진입 경로와 표시 영역만 제공합니다."
      />
      <RouterLink class="button" :to="{ name: 'home' }">메인으로 돌아가기</RouterLink>
    </main>
    <PublicFooter />
  </div>
</template>

<style scoped>
.policy-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.policy-content {
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding-inline: var(--page-padding-desktop);
}
.policy-content {
  flex: 1 0 auto;
  max-width: 820px;
  padding-top: 96px;
}
.policy-content > p {
  margin: 0;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.policy-content h1 {
  margin: 13px 0 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.06em;
}
.policy-content > span {
  display: block;
  margin: 16px 0 38px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.policy-content .button {
  display: inline-grid;
  min-height: 44px;
  padding: 10px 16px;
  place-items: center;
  border-radius: 10px;
  background: var(--color-primary);
  color: var(--color-text);
  font-weight: 800;
  text-decoration: none;
}
@media (max-width: 768px) {
  .policy-content {
    padding-inline: var(--page-padding-mobile);
  }
  .policy-content {
    padding-top: 64px;
  }
}
</style>
