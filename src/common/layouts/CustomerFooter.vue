<script setup>
import { Mail, MapPin } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])

const sections = [
  {
    title: '서비스',
    items: [
      { label: '메뉴 보기', route: 'menu' },
      { label: '플랜 보기', route: 'plans' },
      { label: '이용 가이드', route: 'customer-support' },
      { label: '자주 묻는 질문', route: 'customer-support' },
    ],
  },
  {
    title: '안내',
    items: [
      { label: '고객지원', route: 'customer-support' },
      { label: '이용약관', route: 'terms' },
      { label: '개인정보처리방침', route: 'privacy' },
      { label: '위치기반서비스 약관', route: 'location-terms' },
    ],
  },
]
</script>

<template>
  <footer class="customer-footer">
    <div class="customer-footer__main">
      <div class="customer-footer__brand">
        <strong>챱챱</strong>
        <p>내 일정에 맞춘 식사 구독 서비스</p>
        <span>공식 SNS 채널은 서비스 오픈 전에 안내됩니다.</span>
      </div>

      <div v-for="section in sections" :key="section.title" class="customer-footer__links">
        <h2>{{ section.title }}</h2>
        <button
          v-for="item in section.items"
          :key="item.label"
          type="button"
          @click="emit('navigate', item.route)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="customer-footer__contact">
        <h2>고객센터</h2>
        <p><Mail :size="15" aria-hidden="true" /> 상담 채팅을 이용해 주세요.</p>
        <p><MapPin :size="15" aria-hidden="true" /> 사업장 정보 오픈 전 공개</p>
        <button type="button" @click="emit('navigate', 'customer-support')">
          운영 시간과 문의 방법 보기
        </button>
      </div>
    </div>

    <div class="customer-footer__bottom">
      <p>상호명·대표자명·사업자등록번호·통신판매업 신고번호는 서비스 오픈 전에 공개됩니다.</p>
      <p>© 2026 챱챱. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.customer-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.customer-footer__main,
.customer-footer__bottom {
  max-width: 1180px;
  margin: 0 auto;
  padding-inline: 28px;
}

.customer-footer__main {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.35fr;
  gap: 36px;
  padding-top: 52px;
  padding-bottom: 44px;
}

.customer-footer h2 {
  margin: 0 0 16px;
  font-size: var(--font-body);
}

.customer-footer strong {
  font-size: var(--font-section-title);
  letter-spacing: -0.06em;
}

.customer-footer p,
.customer-footer span {
  display: block;
  margin-top: 9px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}

.customer-footer__links span {
  margin-top: 11px;
}

.customer-footer__contact p {
  display: flex;
  gap: 7px;
  align-items: flex-start;
}

.customer-footer__contact svg {
  flex: 0 0 auto;
  margin-top: 3px;
}

.customer-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-top: 18px;
  padding-bottom: 22px;
  border-top: 1px solid var(--color-border);
}

.customer-footer__bottom p {
  font-size: var(--font-caption);
}

.customer-footer__links button,
.customer-footer__contact button {
  min-height: 36px;
  display: block;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  text-align: left;
  font-size: var(--font-caption);
  font-weight: 600;
}

.customer-footer__links button:hover,
.customer-footer__contact button:hover {
  color: var(--color-primary-pressed);
}

@media (max-width: 760px) {
  .customer-footer__main {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 48px 24px;
    padding: 48px 20px;
  }

  .customer-footer__brand,
  .customer-footer__contact {
    grid-column: 1 / -1;
  }

  .customer-footer__links {
    display: grid;
    align-content: start;
  }

  .customer-footer__links h2 {
    margin-bottom: 8px;
  }

  .customer-footer__links button {
    min-height: 40px;
  }

  .customer-footer__contact {
    display: grid;
    align-content: start;
    gap: 8px;
  }

  .customer-footer__contact h2,
  .customer-footer__contact p {
    margin: 0;
  }

  .customer-footer__contact button {
    margin-top: 8px;
  }
}

@media (max-width: 760px) {
  .customer-footer__bottom {
    display: grid;
    gap: 8px;
    padding: 16px 20px 100px;
  }
}
</style>
