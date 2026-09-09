<script setup>
import { onMounted, ref } from 'vue'
import { customerApi } from '../api/customerApi.js'
import { ArrowRight, ChevronDown } from 'lucide-vue-next'

// defineEmits는 전체 질문 보기 요청을 부모 페이지로 전달하는 Vue 문법입니다.
const emit = defineEmits(['navigate'])

const faqItems = ref([])
const loadError = ref(false)
onMounted(async () => {
  try {
    faqItems.value = (await customerApi.faqs())
      .slice(0, 5)
      .map((row) => ({ ...row, id: row.faqId }))
    openFaqId.value = faqItems.value[0]?.id ?? null
  } catch {
    loadError.value = true
  }
})

// null은 열린 답변이 없는 상태이며, 질문의 id가 들어오면 해당 답변만 펼쳐집니다.
const openFaqId = ref(null)

// 이미 열린 질문을 다시 누르면 닫고, 다른 질문을 누르면 해당 답변으로 교체합니다.
function toggleFaq(faqId) {
  openFaqId.value = openFaqId.value === faqId ? null : faqId
}
</script>

<template>
  <!-- section은 메인에서 바로 확인하는 자주 묻는 질문 영역을 구분합니다. -->
  <section class="home-faq" aria-labelledby="home-faq-title">
    <div class="home-faq__heading">
      <div>
        <h2 id="home-faq-title">자주 묻는 질문</h2>
      </div>
      <button type="button" class="home-faq__more" @click="emit('navigate', 'customer-support')">
        전체 질문 보기
        <ArrowRight :size="17" aria-hidden="true" />
      </button>
    </div>

    <!-- v-for는 faqItems의 질문 수만큼 같은 질문·답변 구조를 반복해서 만드는 Vue 문법입니다. -->
    <p v-if="loadError" role="status">
      질문을 불러오지 못했습니다. 전체 질문 보기에서 다시 확인해 주세요.
    </p>
    <div class="home-faq__list">
      <div
        v-for="faq in faqItems"
        :key="faq.id"
        class="home-faq__item"
        :class="{ 'is-open': openFaqId === faq.id }"
      >
        <!--
          aria-expanded는 현재 답변이 열렸는지를 보조 기술에 전달합니다.
          aria-controls는 질문 버튼과 해당 답변 영역의 연결 관계를 알려 줍니다.
        -->
        <button
          type="button"
          :aria-expanded="openFaqId === faq.id"
          :aria-controls="`${faq.id}-answer`"
          @click="toggleFaq(faq.id)"
        >
          <span class="home-faq__question">
            <span class="home-faq__number">Q.</span>
            <span class="home-faq__question-text">{{ faq.question }}</span>
          </span>
          <span class="home-faq__chevron" aria-hidden="true">
            <ChevronDown :size="19" :class="{ 'is-open': openFaqId === faq.id }" />
          </span>
        </button>

        <!-- v-if는 선택한 질문의 답변만 화면에 만드는 Vue 조건부 표시 문법입니다. -->
        <div v-if="openFaqId === faq.id" :id="`${faq.id}-answer`" class="home-faq__answer">
          <span class="home-faq__answer-label" aria-hidden="true">A.</span>
          <p>{{ faq.answer }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* scoped는 이 파일의 스타일을 FAQ 컴포넌트 안에서만 적용하는 Vue 기능입니다. */
/* FAQ는 각 질문을 독립된 카드로 구분하고, 열린 질문만 Primary 색상으로 강조합니다. */
.home-faq {
  /* 외곽의 올리브 배경과 구분되는 FAQ 전용 저채도 웜 뉴트럴 색상입니다. */
  --faq-card-surface: #fffaf2;
  --faq-card-border: #ddd7c9;
  --faq-divider: #e8e1d5;
  --faq-control-surface: #f5f1e8;
  --faq-open-surface: #f7f5ea;
  margin-top: 96px;
}

.home-faq__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.home-faq__heading h2 {
  margin-top: 0;
  font-size: var(--font-page-title);
}

.home-faq__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-primary);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 800;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.home-faq__more:hover {
  background: var(--color-primary-soft);
  transform: translateY(-1px);
}

.home-faq__more svg {
  transition: transform 0.2s ease;
}

.home-faq__more:hover svg {
  transform: translateX(3px);
}

.home-faq__list {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-primary-soft);
}

.home-faq__item {
  overflow: hidden;
  border: 1px solid var(--faq-card-border);
  border-radius: 16px;
  background: var(--faq-card-surface);
  transition: border-color 0.2s ease;
}

.home-faq__item.is-open {
  border-color: var(--color-primary);
}

.home-faq__item > button {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border: 0;
  background: var(--faq-card-surface);
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 800;
  text-align: left;
  transition: background-color 0.2s ease;
}

.home-faq__item > button:hover {
  background: var(--faq-control-surface);
}

.home-faq__item.is-open > button {
  background: var(--faq-open-surface);
}

.home-faq__question {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.home-faq__number,
.home-faq__answer-label {
  flex: 0 0 auto;
  min-width: 18px;
  color: var(--color-primary-pressed);
  font-size: var(--font-body);
  font-weight: 800;
  line-height: var(--line-height-body);
}

.home-faq__answer-label {
  color: var(--color-text-muted);
}

.home-faq__question-text {
  min-width: 0;
}

.home-faq__chevron {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--faq-divider);
  border-radius: 50%;
  background: var(--faq-card-surface);
}

.home-faq__chevron svg {
  flex: 0 0 auto;
  transition: transform 0.2s ease;
}

.home-faq__chevron svg.is-open {
  transform: rotate(180deg);
}

.home-faq__answer {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: start;
  column-gap: 10px;
  margin: 0 24px;
  padding: 18px 0 22px;
  border-top: 1px solid var(--faq-divider);
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
  animation: answer-enter 0.2s ease-out;
}

.home-faq__answer-label {
  margin: 0;
}

.home-faq__answer p {
  margin: 0;
}

@keyframes answer-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 760px) {
  .home-faq {
    margin-top: 68px;
  }

  .home-faq__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .home-faq__heading h2 {
    font-size: var(--font-page-title);
  }

  .home-faq__more {
    width: 100%;
  }

  .home-faq__list {
    gap: 8px;
    padding: 8px;
    border-radius: 20px;
  }

  .home-faq__item {
    border-radius: 14px;
  }

  .home-faq__item > button {
    min-height: 68px;
    padding: 16px;
    font-size: var(--font-body);
  }

  .home-faq__question {
    gap: 10px;
  }

  .home-faq__chevron {
    width: 32px;
    height: 32px;
  }

  .home-faq__answer {
    grid-template-columns: max-content minmax(0, 1fr);
    column-gap: 10px;
    margin: 0 16px;
    padding: 16px 0 20px;
    font-size: var(--font-caption);
  }
}
</style>
