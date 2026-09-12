<script setup>
import { ArrowRight, Clock3 } from 'lucide-vue-next'

// defineEmits는 이 컴포넌트가 직접 화면을 바꾸지 않고, 상위 페이지에 이동을 요청하도록 만드는 Vue 문법입니다.
const emit = defineEmits(['navigate'])
</script>

<template>
  <!-- section은 메인 안에서 고객센터와 내 알림을 독립된 정보 영역으로 구분하는 시맨틱 태그입니다. -->
  <section class="home-support-notice" aria-label="고객센터와 내 알림">
    <article class="home-support-notice__support">
      <h2>궁금한 점이 있으신가요?</h2>
      <p class="home-support-notice__description">
        자주 묻는 질문을 확인하거나 상담 채팅으로 바로 문의해 보세요.
      </p>
      <p class="home-support-notice__hours">
        <Clock3 :size="16" aria-hidden="true" />
        운영 시간은 고객지원에서 확인해 주세요.
      </p>
      <div class="home-support-notice__actions">
        <button class="button button-primary" type="button" @click="emit('navigate', 'wf-036')">
          상담 시작하기
          <ArrowRight :size="17" aria-hidden="true" />
        </button>
        <button class="text-button" type="button" @click="emit('navigate', 'customer-support')">
          고객센터 전체 보기
        </button>
      </div>
    </article>

    <article class="home-support-notice__notices">
      <header class="home-support-notice__heading">
        <div>
          <h2>내 알림</h2>
        </div>
        <button class="text-button" type="button" @click="emit('navigate', 'notifications')">
          전체 보기
          <ArrowRight :size="16" aria-hidden="true" />
        </button>
      </header>

      <p class="home-support-notice__description">
        주문·배송 관련 안내는 내 알림에서 확인할 수 있어요.
      </p>
    </article>
  </section>
</template>

<style scoped>
.home-support-notice {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: 0;
  margin-top: 96px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.home-support-notice__support,
.home-support-notice__notices {
  padding: 38px;
}

.home-support-notice__support {
  background: var(--color-primary-soft);
}

.home-support-notice__notices {
  border-left: 1px solid var(--color-border);
}

.home-support-notice h2 {
  margin-top: 0;
  font-size: var(--font-section-title);
}

.home-support-notice__description {
  max-width: 330px;
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}

.home-support-notice__hours {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}

.home-support-notice__actions {
  justify-content: flex-end;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.home-support-notice__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.home-support-notice__heading .text-button {
  flex: 0 0 auto;
  color: var(--color-primary-pressed);
}

.home-support-notice__list {
  padding: 0;
  margin: 22px 0 0;
  border-top: 1px solid var(--color-border);
  list-style: none;
}

.home-support-notice__list li + li {
  border-top: 1px solid var(--color-border);
}

.home-support-notice__list button {
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
}

.home-support-notice__notice-label {
  padding: 5px 8px;
  border-radius: 99px;
  color: var(--color-primary-pressed);
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
  font-weight: 800;
}

.home-support-notice__list strong {
  overflow: hidden;
  font-size: var(--font-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-support-notice__list time {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.home-support-notice__list button:hover strong {
  color: var(--color-primary-pressed);
  text-decoration: underline;
  text-underline-offset: 4px;
}

@media (max-width: 760px) {
  .home-support-notice {
    grid-template-columns: 1fr;
    margin-top: 68px;
    border-radius: var(--radius-xl);
  }

  .home-support-notice__support,
  .home-support-notice__notices {
    padding: 28px 24px;
  }

  .home-support-notice__notices {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }

  .home-support-notice h2 {
    font-size: var(--font-section-title);
  }

  .home-support-notice__actions {
    justify-content: flex-end;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .home-support-notice__actions .button,
  .home-support-notice__actions .text-button {
    width: 100%;
    justify-content: center;
  }

  .home-support-notice__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .home-support-notice__list button {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px 10px;
  }

  .home-support-notice__list time {
    grid-column: 2;
  }
}
</style>
