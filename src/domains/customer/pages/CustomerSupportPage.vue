<script setup>
import { ChevronRight, Clock3, MessageCircleQuestion } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { RouterLink } from 'vue-router'

const emit = defineEmits(['navigate'])

const questions = [
  [
    '플랜 가격은 어디에서 확인하나요?',
    '가격과 배송비는 구독 신청의 결제 전 확인 단계에서 안내됩니다.',
  ],
  [
    '메뉴는 언제까지 바꿀 수 있나요?',
    '각 회차의 주문 마감 전까지 변경할 수 있으며, 마감 후 버튼이 비활성화됩니다.',
  ],
  [
    '배송 일정을 미룰 수 있나요?',
    '회차당 한 번, 회차 상세 화면에서 가능한 날짜를 선택해 미룰 수 있습니다.',
  ],
]
</script>

<template>
  <div class="page support-page">
    <PageBackButton label="이전 화면으로" @back="emit('navigate', 'home')" />

    <section class="page-intro">
      <h1>무엇을 도와드릴까요?</h1>
      <p>자주 묻는 질문을 확인하거나 환불 상담 채팅으로 문의할 수 있어요.</p>
    </section>

    <section class="support-grid">
      <article class="support-card">
        <MessageCircleQuestion :size="24" aria-hidden="true" />
        <h2>상담 채팅</h2>
        <p>환불과 결제 관련 문의를 상담사에게 남겨 주세요.</p>
        <button class="button button-primary" type="button" @click="emit('navigate', 'wf-036')">
          상담 시작하기
          <ChevronRight :size="18" aria-hidden="true" />
        </button>
      </article>
      <article class="support-card">
        <MessageCircleQuestion :size="24" aria-hidden="true" />
        <h2>품질 문제 접수</h2>
        <p>배송 완료 주문의 품질·누락·포장 문제를 접수해 주세요.</p>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('navigate', 'inquiry-list')"
        >
          내 품질 문의<ChevronRight :size="18" aria-hidden="true" />
        </button>
      </article>

      <article class="support-card">
        <Clock3 :size="24" aria-hidden="true" />
        <h2>운영 시간</h2>
        <p>평일 10:00~17:00 · 주말과 공휴일 휴무</p>
        <span>운영 시간은 서비스 오픈 전 최종 확정됩니다.</span>
      </article>
    </section>

    <section class="faq-list">
      <div>
        <h2>자주 묻는 질문</h2>
        <RouterLink class="button button-secondary" to="/help/faq">질문 전체 보기</RouterLink>
      </div>
      <article v-for="question in questions" :key="question[0]">
        <strong>{{ question[0] }}</strong>
        <p>{{ question[1] }}</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 42px;
}

.support-card {
  padding: 26px;
}

.support-card > svg {
  color: var(--color-primary-pressed);
}

.support-card h2 {
  margin-top: 18px;
  font-size: var(--font-section-title);
}

.support-card p {
  margin-top: 9px;
  font-size: var(--font-body);
}

.support-card span {
  display: block;
  margin-top: 15px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.support-card .button {
  margin-top: 24px;
}

.faq-list {
  margin-top: 22px;
  padding: 28px;
}

.faq-list > div {
  margin-bottom: 20px;
}

.faq-list article {
  padding: 19px 0;
  border-top: 1px solid var(--color-border);
}

.faq-list article p {
  margin-top: 6px;
  font-size: var(--font-caption);
}

@media (max-width: 760px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
