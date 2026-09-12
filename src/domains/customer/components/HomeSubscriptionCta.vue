<script setup>
import { ArrowRight } from 'lucide-vue-next'

// defineEmits는 구독 시작 요청을 부모 페이지로 전달하는 Vue 문법입니다.
const emit = defineEmits(['navigate'])
</script>

<template>
  <!-- section은 메인 안내를 모두 확인한 뒤 구독을 시작하는 마지막 행동 영역입니다. -->
  <section class="home-subscription-cta">
    <div>
      <h2>나에게 맞는 플랜으로<br />식사 루틴을 시작해 보세요.</h2>
      <p>플랜별 메뉴와 구성을 비교해 보세요.</p>
    </div>

    <div class="home-subscription-cta__actions">
      <button class="button button-primary" type="button" @click="emit('navigate', 'plans')">
        구독 시작하기
        <ArrowRight :size="18" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>

<style scoped>
/* scoped는 이 파일의 스타일을 마지막 구독 CTA 컴포넌트 안에서만 적용하는 Vue 기능입니다. */
/* 마지막 CTA는 주요 행동과 보조 행동의 시각적 우선순위를 분명하게 나눕니다. */
.home-subscription-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 38px;
  margin-top: 48px;
  padding: 52px 56px;
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: var(--color-surface);
}

.home-subscription-cta h2 {
  margin-top: 0;
  font-size: var(--font-page-title);
  color: var(--color-surface);
}

.home-subscription-cta > div > p:last-child {
  margin-top: 12px;
  font-size: var(--font-body);
  color: var(--color-surface);
  opacity: 0.82;
}

/* 진한 배경 위에서 버튼은 흰 배경 + primary 텍스트로 반전해 대비를 확보합니다. */
.home-subscription-cta .button-primary {
  background: var(--color-surface);
  border-color: var(--color-surface);
  color: var(--color-primary-hover);
}

.home-subscription-cta .button-primary:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-soft);
}

.home-subscription-cta__actions {
  display: flex;
  flex: 0 0 auto;
  align-self: center;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .home-subscription-cta {
    align-items: stretch;
    flex-direction: column;
    gap: 26px;
    margin-top: 40px;
    padding: 36px 24px;
  }

  .home-subscription-cta h2 {
    font-size: var(--font-page-title);
  }

  .home-subscription-cta__actions {
    flex-direction: column;
  }

  .home-subscription-cta__actions .button {
    width: 100%;
  }
}
</style>
