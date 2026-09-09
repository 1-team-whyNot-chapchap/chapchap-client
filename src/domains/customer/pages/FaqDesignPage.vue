<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, ChevronDown, MessageCircleQuestion, ChevronRight } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'

const keyword = ref('')
const category = ref('전체')
const categories = ['전체', '이용 안내', '계정', '주문·배송']
const questions = [
  {
    id: 1,
    category: '이용 안내',
    question: '어떤 플랜이 있는지 보고 싶어요.',
    answer:
      '상단의 플랜 메뉴에서 구성을 살펴볼 수 있어요. 원하는 플랜을 선택하면 자세한 내용을 확인할 수 있어요.',
  },
  {
    id: 2,
    category: '계정',
    question: '어떻게 로그인하나요?',
    answer:
      '로그인 화면에서 카카오 또는 구글 버튼을 선택해요. 처음 이용한다면 본인 확인과 약관 동의 단계로 이어져요.',
  },
  {
    id: 3,
    category: '계정',
    question: '프로필 사진은 어디서 바꾸나요?',
    answer:
      '마이페이지의 내 정보에서 사진 변경을 선택해 주세요. JPG, PNG, WebP 형식의 이미지를 사용할 수 있어요.',
  },
  {
    id: 4,
    category: '주문·배송',
    question: '배송 상황은 어디서 확인하나요?',
    answer: '마이페이지에서 주문 내역을 열고 원하는 주문을 선택하면 배송 상황을 확인할 수 있어요.',
  },
  {
    id: 5,
    category: '이용 안내',
    question: '질문에 대한 답을 찾지 못했어요.',
    answer:
      '아래 상담 연결을 선택해 문의 내용을 남겨 주세요. 이전에 남긴 상담도 상담 화면에서 확인할 수 있어요.',
  },
]
const filtered = computed(() =>
  questions.filter(
    (item) =>
      (category.value === '전체' || item.category === category.value) &&
      `${item.question} ${item.answer}`.includes(keyword.value.trim()),
  ),
)
function reset() {
  keyword.value = ''
  category.value = '전체'
}
</script>

<template>
  <div class="page account-design faq-design design-review-page">
    <DesignPreview title="자주 묻는 질문" empty="등록된 질문이 없어요.">
      <header class="intro">
        <h1>자주 묻는 질문</h1>
        <p>궁금한 내용을 검색하거나 주제별로 찾아보세요.</p>
      </header>
      <div class="search-box">
        <Search :size="20" aria-hidden="true" /><label class="sr-only" for="faq-search"
          >질문 검색</label
        ><input
          id="faq-search"
          v-model="keyword"
          type="search"
          maxlength="120"
          placeholder="무엇이 궁금하세요?"
        />
      </div>
      <nav class="categories" aria-label="질문 분류">
        <button
          v-for="item in categories"
          :key="item"
          type="button"
          :aria-pressed="category === item"
          @click="category = item"
        >
          {{ item }}
        </button>
      </nav>
      <p class="result-count" role="status">{{ filtered.length }}개의 질문</p>
      <section v-if="filtered.length" class="questions" aria-label="질문 목록">
        <details v-for="item in filtered" :key="`${category}-${keyword}-${item.id}`">
          <summary>
            <span class="question-mark" aria-hidden="true">Q</span><span>{{ item.question }}</span
            ><ChevronDown :size="20" aria-hidden="true" />
          </summary>
          <div class="answer">
            <span class="muted">{{ item.category }}</span>
            <p>{{ item.answer }}</p>
          </div>
        </details>
      </section>
      <section v-else class="empty-results">
        <Search :size="28" aria-hidden="true" />
        <h2>검색 결과가 없어요.</h2>
        <p class="muted">다른 검색어를 입력하거나 분류를 바꿔 보세요.</p>
        <button class="button button-secondary" type="button" @click="reset">검색 초기화</button>
      </section>
      <section class="contact">
        <div class="row">
          <MessageCircleQuestion :size="24" aria-hidden="true" />
          <div>
            <h2>아직 궁금한 점이 있나요?</h2>
            <p class="muted">상담에서 이야기를 나눠 보세요.</p>
          </div>
        </div>
        <RouterLink to="/help/chat" class="button button-secondary"
          >상담 연결<ChevronRight :size="18" aria-hidden="true"
        /></RouterLink>
      </section>
      <p class="sample-note">
        질문과 답변은 예시입니다. 실제 서비스의 운영 안내와 다를 수 있습니다.
      </p>
    </DesignPreview>
  </div>
</template>

<style scoped src="../../../common/styles/account-design.css"></style>
<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.search-box > svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.search-box input {
  min-width: 0;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  min-height: 32px;
}
.search-box input::placeholder {
  color: var(--color-text-muted);
}
.categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-5) 0;
}
.categories button {
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
}
.categories [aria-pressed='true'] {
  background: var(--color-primary-pressed);
  color: var(--color-surface);
  border-color: var(--color-primary-pressed);
}
.result-count {
  margin-bottom: var(--space-3) !important;
  color: var(--color-text-muted);
}
.questions {
  border-top: 1px solid var(--color-border);
}
.questions details {
  border-bottom: 1px solid var(--color-border);
}
.questions summary {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 20px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) 0;
  cursor: pointer;
  list-style: none;
  font-weight: var(--font-weight-bold);
}
.questions summary::-webkit-details-marker {
  display: none;
}
.question-mark {
  color: var(--color-primary-pressed);
  font-size: var(--font-item-title);
  text-align: center;
}
.questions details[open] summary > svg {
  transform: rotate(180deg);
}
.answer {
  padding: 0 var(--space-6) var(--space-5) 36px;
  overflow-wrap: anywhere;
}
.answer > span {
  font-size: var(--font-caption);
}
.answer p {
  margin-top: var(--space-2);
}
.empty-results {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-4);
  text-align: center;
  border-block: 1px solid var(--color-border);
}
.contact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  margin-top: var(--space-6);
  background: var(--color-primary-soft);
  border-radius: var(--radius-lg);
}
.contact h2 {
  font-size: var(--font-item-title);
  margin-bottom: var(--space-1);
}
.contact .button {
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .contact {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
