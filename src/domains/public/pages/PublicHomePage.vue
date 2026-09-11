<script setup>
import { ref } from 'vue'
import { ArrowRight, ChevronDown } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PublicFooter from '../components/PublicFooter.vue'
import PublicHeader from '../components/PublicHeader.vue'

const openFaqId = ref('delivery')

const steps = [
  {
    number: '01',
    title: '소셜 로그인으로 시작',
    description: '카카오 또는 구글 계정으로 안전하게 가입 흐름을 시작합니다.',
  },
  {
    number: '02',
    title: '플랜과 요일별 조건 설정',
    description: '월요일부터 토요일 중 필요한 요일과 인원·배송지·시간대를 선택합니다.',
  },
  {
    number: '03',
    title: '서버 결과를 확인',
    description: '적용일, 결제 관련 상태와 배송 가능 여부는 서버 결과로 확인합니다.',
  },
]

const faqs = [
  {
    id: 'delivery',
    question: '배송 요일은 어떻게 정하나요?',
    answer:
      '구독 신청에서 월요일부터 토요일 사이의 요일을 선택합니다. 실제 적용 가능일과 배송 가능 여부는 서버가 최종 안내합니다.',
  },
  {
    id: 'change',
    question: '구독 조건을 바꿀 수 있나요?',
    answer:
      '플랜, 요일별 인원·배송지·시간대 변경은 현재 구독 화면에서 요청할 수 있습니다. 적용일은 요청 시각을 기준으로 서버가 계산합니다.',
  },
  {
    id: 'delivery-status',
    question: '다음 배송과 알림은 어디에서 보나요?',
    answer:
      '로그인 후 고객 홈과 배송 내역에서 확인할 수 있습니다. 서비스별 조회 결과는 각각 갱신되므로 한 영역의 오류가 다른 정보를 가리지 않습니다.',
  },
]

const planPreview = [
  {
    id: 'simple',
    label: '간편식',
    title: '가볍게 챙기는 한 끼',
    description: '바쁜 날에도 부담 없이 이어가는 기본 구성',
  },
  {
    id: 'home',
    label: '가정식',
    title: '익숙하고 균형 잡힌 한 끼',
    description: '밥과 반찬을 함께 담은 일상 식사 구성',
  },
  {
    id: 'hearty',
    label: '든든식',
    title: '활동적인 날을 위한 한 끼',
    description: '식사량이 필요한 날을 위한 든든한 구성',
  },
]

function toggleFaq(id) {
  openFaqId.value = openFaqId.value === id ? '' : id
}
</script>

<template>
  <div class="public-home">
    <PublicHeader />

    <main>
      <section class="home-hero" aria-labelledby="home-hero-title">
        <div class="home-hero__copy">
          <p>일정에 맞춘 식사 구독</p>
          <h1 id="home-hero-title">내 일정에 맞춰<br />도시락을 받아보세요.</h1>
          <span
            >필요한 요일에 맞춰 플랜을 고르고, 배송 조건과 실제 제공 정보는 신청 과정에서 확인할 수
            있습니다.</span
          >
          <div class="home-hero__actions">
            <RouterLink class="button" :to="{ name: 'plans' }"
              >플랜 비교하기 <ArrowRight :size="18" aria-hidden="true"
            /></RouterLink>
            <RouterLink class="home-hero__text-link" :to="{ name: 'menu' }"
              >메뉴 미리보기 <ArrowRight :size="17" aria-hidden="true"
            /></RouterLink>
          </div>
          <small>배송 가능 여부와 최종 금액은 서버가 확인합니다.</small>
        </div>
        <aside class="home-hero__summary" aria-label="구독 시작 안내">
          <span>CHAPCHAP</span>
          <strong>한 주의 식사를<br />미리 정리하는 방법</strong>
          <dl>
            <div>
              <dt>01</dt>
              <dd>메뉴와 플랜을 비교합니다.</dd>
            </div>
            <div>
              <dt>02</dt>
              <dd>필요한 요일과 배송 조건을 설정합니다.</dd>
            </div>
            <div>
              <dt>03</dt>
              <dd>서버 결과를 확인하고 시작합니다.</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section class="content-section plan-peek" aria-labelledby="plan-peek-title">
        <div class="section-heading section-heading--row">
          <div>
            <p>플랜 미리보기</p>
            <h2 id="plan-peek-title">식사 리듬에 맞는 플랜을 고르세요.</h2>
          </div>
          <RouterLink class="text-action" :to="{ name: 'plans' }"
            >모든 플랜 비교하기 <ArrowRight :size="17" aria-hidden="true"
          /></RouterLink>
        </div>
        <div class="plan-peek__grid">
          <article v-for="plan in planPreview" :key="plan.id">
            <p>{{ plan.label }}</p>
            <h3>{{ plan.title }}</h3>
            <span>{{ plan.description }}</span>
            <RouterLink :to="{ name: 'plan-detail', params: { planId: plan.id } }"
              >자세히 보기 <ArrowRight :size="16" aria-hidden="true"
            /></RouterLink>
          </article>
        </div>
      </section>

      <section id="how-it-works" class="content-section routine" aria-labelledby="routine-title">
        <div class="section-heading">
          <p>이용 흐름</p>
          <h2 id="routine-title">식사 루틴을 정하는 세 단계</h2>
        </div>
        <ol class="routine__list">
          <li v-for="step in steps" :key="step.number">
            <span>{{ step.number }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section id="faq" class="content-section faq" aria-labelledby="faq-title">
        <div class="section-heading section-heading--row">
          <div>
            <p>도움말</p>
            <h2 id="faq-title">자주 묻는 질문</h2>
          </div>
          <RouterLink class="text-action" :to="{ name: 'login' }">로그인 후 FAQ 보기</RouterLink>
        </div>
        <div class="faq__list">
          <article v-for="faq in faqs" :key="faq.id" class="faq__item">
            <button
              type="button"
              :aria-expanded="openFaqId === faq.id"
              :aria-controls="`${faq.id}-answer`"
              @click="toggleFaq(faq.id)"
            >
              <span>{{ faq.question }}</span>
              <ChevronDown
                :class="{ 'is-open': openFaqId === faq.id }"
                :size="20"
                aria-hidden="true"
              />
            </button>
            <div v-if="openFaqId === faq.id" :id="`${faq.id}-answer`" class="faq__answer">
              {{ faq.answer }}
            </div>
          </article>
        </div>
      </section>

      <section class="closing-cta" aria-labelledby="closing-title">
        <div>
          <p>챱챱 시작하기</p>
          <h2 id="closing-title">내 일정에 맞는<br />구독 조건을 설정해 보세요.</h2>
        </div>
        <RouterLink class="button closing-cta__action" :to="{ name: 'login' }">
          소셜 로그인으로 시작 <ArrowRight :size="18" aria-hidden="true" />
        </RouterLink>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<style scoped>
.public-home {
  background: var(--color-background);
}
.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: clamp(30px, 7vw, 90px);
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding: clamp(60px, 9vw, 112px) var(--page-padding-desktop) 68px;
}
.home-hero__copy {
  display: grid;
  align-content: center;
  justify-items: start;
}
.home-hero__copy > p,
.home-hero__summary > span {
  margin: 0;
  color: var(--color-primary-hover);
  font-size: var(--font-body);
  font-weight: 900;
}
.home-hero h1 {
  margin: 14px 0 0;
  font-size: var(--font-display);
  letter-spacing: -0.075em;
  line-height: var(--line-height-title);
}
.home-hero__copy > span {
  max-width: 530px;
  margin-top: 22px;
  color: var(--color-text-muted);
  font-size: var(--font-item-title);
  line-height: var(--line-height-body);
}
.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 32px;
}
.home-hero__actions .button,
.home-hero__text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 46px;
  text-decoration: none;
}
.home-hero__text-link {
  color: var(--color-text);
  font-weight: 800;
  border-bottom: 1px solid var(--color-text);
}
.home-hero__copy > small {
  margin-top: 20px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.home-hero__summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 390px;
  padding: 28px;
  border-radius: var(--radius-xl);
  background: #e5ead0;
}
.home-hero__summary > strong {
  margin-top: auto;
  font-size: var(--font-page-title);
  letter-spacing: -0.06em;
  line-height: var(--line-height-title);
}
.home-hero__summary dl {
  display: grid;
  gap: 0;
  margin: 30px 0 0;
  border-top: 1px solid rgba(48, 51, 45, 0.25);
}
.home-hero__summary dl div {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 8px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(48, 51, 45, 0.16);
}
.home-hero__summary dt {
  font-size: var(--font-caption);
  font-weight: 900;
}
.home-hero__summary dd {
  margin: 0;
  font-size: var(--font-caption);
  line-height: var(--line-height-compact);
}
.content-section,
.closing-cta {
  width: min(100%, var(--content-width));
  margin-inline: auto;
}
.section-heading--row {
  display: flex;
  align-items: center;
}
.section-heading > p,
.plan-intro__intro > p,
.closing-cta p {
  margin: 0;
  color: var(--color-primary-hover);
  font-size: var(--font-body);
  font-weight: 800;
}
.section-heading h2,
.plan-intro h2,
.closing-cta h2 {
  margin: 14px 0 0;
  letter-spacing: -0.065em;
}
.plan-peek__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 30px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.plan-peek__grid article {
  display: grid;
  align-content: start;
  min-height: 238px;
  padding: 26px;
}
.plan-peek__grid article + article {
  border-left: 1px solid var(--color-border);
}
.plan-peek__grid p {
  margin: 0;
  color: var(--color-primary-hover);
  font-size: var(--font-caption);
  font-weight: 900;
}
.plan-peek__grid h3 {
  margin: 14px 0 0;
  font-size: var(--font-section-title);
  letter-spacing: -0.045em;
  line-height: var(--line-height-compact);
}
.plan-peek__grid span {
  margin-top: 10px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.plan-peek__grid a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  margin-top: auto;
  padding-top: 22px;
  color: var(--color-text);
  font-weight: 800;
  text-decoration: none;
}
.content-section {
  padding: 104px var(--page-padding-desktop) 0;
  scroll-margin-top: 88px;
}
.section-heading h2,
.plan-intro h2,
.closing-cta h2 {
  font-size: var(--font-page-title);
  line-height: var(--line-height-title);
}
.routine__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0;
  margin: 34px 0 0;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.routine__list li {
  display: grid;
  gap: 28px;
  min-height: 205px;
  padding: 28px;
}
.routine__list li + li {
  border-left: 1px solid var(--color-border);
}
.routine__list span {
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 900;
}
.routine__list h3 {
  margin: 0;
  font-size: var(--font-section-title);
  letter-spacing: -0.04em;
}
.routine__list p,
.plan-intro__intro > span {
  margin: 9px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.plan-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.82fr);
  gap: clamp(36px, 8vw, 104px);
  align-items: end;
}
.plan-intro__intro {
  display: grid;
  justify-items: start;
}
.plan-intro__intro > span {
  max-width: 430px;
}
.text-action {
  margin-top: 24px;
}
.plan-intro__rules {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--color-text);
}
.plan-intro__rules div {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  gap: 16px;
  padding: 19px 0;
  border-bottom: 1px solid var(--color-border);
}
.plan-intro__rules dt {
  font-size: var(--font-body);
  font-weight: 800;
}
.plan-intro__rules dd {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.section-heading--row {
  justify-content: space-between;
  gap: 24px;
}
.faq__list {
  margin-top: 28px;
  border-top: 1px solid var(--color-text);
}
.faq__item {
  border-bottom: 1px solid var(--color-border);
}
.faq__item button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  min-height: 76px;
  padding: 18px 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-item-title);
  font-weight: 800;
  text-align: left;
}
.faq__item button svg {
  flex: 0 0 auto;
  transition: transform 180ms ease;
}
.faq__item button svg.is-open {
  transform: rotate(180deg);
}
.faq__answer {
  max-width: 780px;
  padding: 0 40px 24px 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.closing-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-top: 104px;
  padding: 50px var(--page-padding-desktop);
  border-radius: 28px 28px 0 0;
  background: var(--color-primary-soft);
}
.closing-cta h2 {
  margin-top: 12px;
}
.closing-cta__action {
  flex: 0 0 auto;
  min-height: 48px;
  padding: 11px 17px;
  border-radius: 10px;
  background: var(--color-primary);
  color: var(--color-text);
  font-weight: 800;
}
@media (max-width: 768px) {
  .home-hero {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 48px var(--page-padding-mobile) 34px;
  }
  .home-hero__summary {
    min-height: 300px;
  }
  .home-hero__actions {
    display: grid;
    width: 100%;
  }
  .home-hero__actions .button,
  .home-hero__text-link {
    width: 100%;
  }
  .home-hero__summary > strong {
    margin-top: 40px;
  }
  .content-section {
    padding-inline: var(--page-padding-mobile);
  }
  .content-section {
    padding-top: 72px;
  }
  .routine__list {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
  .plan-peek__grid {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
  .plan-peek__grid article {
    min-height: 0;
    padding: 22px 20px;
  }
  .plan-peek__grid article + article {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
  .plan-peek__grid a {
    margin-top: 10px;
    padding-top: 6px;
  }
  .routine__list li {
    grid-template-columns: 42px 1fr;
    gap: 14px;
    min-height: 0;
    padding: 22px 20px;
  }
  .routine__list li + li {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
  .plan-intro {
    grid-template-columns: 1fr;
  }
  .section-heading--row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
  }
  .section-heading--row .text-action {
    margin-top: 20px;
  }
  .closing-cta {
    align-items: flex-start;
    flex-direction: column;
    margin-top: 72px;
    padding: 38px var(--page-padding-mobile);
    border-radius: 0;
  }
  .closing-cta__action {
    width: 100%;
  }
}
@media (max-width: 380px) {
  .plan-intro__rules div {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .faq__item button svg {
    transition: none;
  }
}
</style>
