<script setup>
import { ArrowRight, Clock3 } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])
</script>

<template>
  <section class="home-support-notice" aria-label="고객센터 상담 안내">
    <div class="home-support-notice__photo">
      <img
        src="/images/customer-support-agent.png"
        alt=""
        width="1254"
        height="1254"
        loading="lazy"
        decoding="async"
      />
    </div>
    <article class="home-support-notice__support">
      <h2>궁금한 점이 있으신가요?</h2>
      <p class="home-support-notice__description">
        처음 이용하셔도 괜찮아요. 궁금한 내용을 채팅으로 편하게 물어보세요.
      </p>
      <div class="home-support-notice__details">
        <dl class="home-support-notice__topics" aria-label="상담 가능한 내용">
          <div>
            <dt>구독 안내</dt>
            <dd>신청 방법 · 이용 상태</dd>
          </div>
          <div>
            <dt>결제·환불</dt>
            <dd>결제 결과 · 환불 상태</dd>
          </div>
          <div>
            <dt>배송 확인</dt>
            <dd>오늘 배송 · 내역 확인</dd>
          </div>
        </dl>
        <div class="home-support-notice__actions">
          <button
            class="button button-primary"
            type="button"
            @click="emit('navigate', 'consultation-design')"
          >
            상담 시작하기
            <ArrowRight :size="17" aria-hidden="true" />
          </button>
          <button class="text-button" type="button" @click="emit('navigate', 'customer-support')">
            고객센터 전체 보기
          </button>
        </div>
        <p class="home-support-notice__hours">
          <Clock3 :size="15" aria-hidden="true" />
          상담사 운영 시간은 고객센터에서 확인해 주세요.
        </p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.home-support-notice {
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  margin-top: 96px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-primary-soft);
}

.home-support-notice__photo {
  align-self: center;
  aspect-ratio: 1;
  overflow: hidden;
}

.home-support-notice__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-support-notice__support {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 28px 36px;
}

.home-support-notice h2 {
  margin: 0;
  font-size: var(--font-section-title);
}

.home-support-notice__description {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}

.home-support-notice__details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) max-content minmax(0, 1fr);
  column-gap: 16px;
  width: 100%;
  margin-top: 22px;
}

.home-support-notice__topics {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  margin: 0;
}

.home-support-notice__topics > div:last-child {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 3 / -1;
}

.home-support-notice__topics > div:last-child dt {
  grid-column: 1;
  white-space: nowrap;
}

.home-support-notice__topics > div:last-child dd {
  grid-column: 1 / -1;
}

.home-support-notice__topics > div + div {
  border-left: 1px solid var(--color-border);
  padding-left: 16px;
}

.home-support-notice__topics dt {
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
}

.home-support-notice__topics dd {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.home-support-notice__hours {
  grid-column: 1 / 4;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.home-support-notice__hours svg {
  flex-shrink: 0;
}

.home-support-notice__actions {
  grid-column: 1 / 4;
  justify-self: end;
  justify-content: flex-end;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px 22px;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .home-support-notice {
    grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  }

  .home-support-notice__support {
    padding: 28px;
  }

  .home-support-notice__details {
    column-gap: 10px;
  }

  .home-support-notice__topics > div + div {
    padding-left: 10px;
  }
}

@media (max-width: 700px) {
  .home-support-notice {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 56px;
  }

  .home-support-notice__support {
    padding: 28px 24px;
  }
}

@media (max-width: 420px) {
  .home-support-notice__details {
    display: block;
  }

  .home-support-notice__topics {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .home-support-notice__topics > div,
  .home-support-notice__topics > div:last-child {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    align-items: baseline;
    gap: 8px;
  }

  .home-support-notice__topics > div + div {
    border-left: 0;
    padding-left: 0;
  }

  .home-support-notice__topics dd {
    margin: 0;
  }

  .home-support-notice__topics > div:last-child dd {
    grid-column: 2;
  }

  .home-support-notice__hours {
    justify-content: flex-end;
  }
}
</style>
