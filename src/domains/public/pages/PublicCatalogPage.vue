<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Check, ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PublicFooter from '../components/PublicFooter.vue'
import PublicHeader from '../components/PublicHeader.vue'

const props = defineProps({ screen: { type: String, default: 'menu' } })

const filters = ['전체', '간편식', '가정식', '든든식']
const selectedFilter = ref('전체')
const menuItems = [
  {
    id: 'chicken',
    category: '간편식',
    title: '닭가슴살 채소 도시락',
    description: '가벼운 한 끼를 위한 단백질과 채소 구성',
    tone: 'sage',
  },
  {
    id: 'bulgogi',
    category: '가정식',
    title: '소불고기 한상',
    description: '밥과 반찬을 함께 담은 균형 잡힌 한 끼',
    tone: 'apricot',
  },
  {
    id: 'rice',
    category: '든든식',
    title: '닭가슴살 라이스 플레이트',
    description: '활동량이 많은 날을 위한 든든한 구성',
    tone: 'sand',
  },
]
const plans = [
  {
    id: 'simple',
    label: '간편식',
    title: '가볍게 챙기는 한 끼',
    description: '바쁜 날에도 부담 없이 이어갈 수 있는 기본 구성입니다.',
    features: ['가벼운 식사 구성', '요일별 배송 조건 설정', '메뉴는 배송 일정에 맞춰 안내'],
  },
  {
    id: 'home',
    label: '가정식',
    title: '익숙하고 균형 잡힌 한 끼',
    description: '밥과 반찬을 함께 담아 일상 식사를 편하게 준비합니다.',
    features: ['한 끼 식사형 구성', '요일별 배송 조건 설정', '메뉴·알레르기 정보 안내'],
  },
  {
    id: 'hearty',
    label: '든든식',
    title: '활동적인 날을 위한 한 끼',
    description: '식사량이 필요한 날을 위한 더 든든한 구성을 안내합니다.',
    features: ['든든한 식사 구성', '요일별 배송 조건 설정', '배송 가능 여부 서버 확인'],
  },
]

const visibleMenus = computed(() =>
  selectedFilter.value === '전체'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedFilter.value),
)
const currentPlan = computed(() => plans.find((plan) => plan.id === props.screen) ?? plans[0])
const isPlanDetail = computed(() => ['simple', 'home', 'hearty'].includes(props.screen))
const isBenefit = computed(() => props.screen === 'benefit')
const isMenuDetail = computed(() => props.screen === 'menu-detail')
</script>

<template>
  <div class="catalog-page">
    <PublicHeader />

    <main class="catalog-content">
      <template v-if="screen === 'menu'">
        <header class="catalog-heading">
          <p>메뉴 안내</p>
          <h1>이번 플랜에서 만날 수 있는 메뉴</h1>
          <span
            >아래 구성은 화면 탐색을 위한 안내입니다. 실제 배송일 메뉴와 공개 정보는 서버 기준으로
            확인합니다.</span
          >
        </header>

        <div class="filter-row" aria-label="메뉴 종류 필터">
          <button
            v-for="filter in filters"
            :key="filter"
            type="button"
            :class="{ 'is-selected': selectedFilter === filter }"
            :aria-pressed="selectedFilter === filter"
            @click="selectedFilter = filter"
          >
            {{ filter }}
          </button>
        </div>

        <section class="menu-grid" aria-label="메뉴 목록">
          <article v-for="item in visibleMenus" :key="item.id" class="menu-card">
            <div
              class="menu-card__visual"
              :class="`menu-card__visual--${item.tone}`"
              aria-hidden="true"
            >
              <span>{{ item.category }}</span>
              <strong>MENU</strong>
            </div>
            <div class="menu-card__body">
              <span class="status status--info">시연 메뉴 안내</span>
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>
              <RouterLink
                class="menu-card__link"
                :to="{ name: 'menu-detail', params: { menuId: item.id } }"
              >
                구성 자세히 보기 <ChevronRight :size="17" aria-hidden="true" />
              </RouterLink>
            </div>
          </article>
        </section>

        <section class="catalog-callout" aria-label="플랜 안내 이동">
          <div>
            <p>플랜을 먼저 비교해 볼까요?</p>
            <span>메뉴는 선택한 플랜과 배송 일정에 따라 서버가 최종 안내합니다.</span>
          </div>
          <RouterLink class="button" :to="{ name: 'plans' }"
            >플랜 비교하기 <ArrowRight :size="17" aria-hidden="true"
          /></RouterLink>
        </section>
      </template>

      <template v-else-if="isMenuDetail">
        <nav class="breadcrumb" aria-label="경로">
          <RouterLink :to="{ name: 'menu' }">메뉴 안내</RouterLink><span aria-hidden="true">/</span
          ><span>메뉴 상세</span>
        </nav>
        <section class="detail-layout" aria-labelledby="menu-detail-title">
          <div class="detail-visual" aria-hidden="true">
            <span>메뉴 상세 안내</span><strong>MENU</strong>
          </div>
          <div class="detail-copy">
            <p>가정식 · 시연 메뉴 안내</p>
            <h1 id="menu-detail-title">소불고기 한상</h1>
            <span
              >밥, 메인 반찬과 곁들임을 함께 담아 편하게 먹을 수 있도록 구성한 한 끼입니다.</span
            >
            <dl class="detail-list">
              <div>
                <dt>구성</dt>
                <dd>밥 · 메인 반찬 · 곁들임</dd>
              </div>
              <div>
                <dt>알레르기</dt>
                <dd>실제 알레르기 정보는 배송 메뉴 확정 후 서버에서 확인합니다.</dd>
              </div>
              <div>
                <dt>영양 정보</dt>
                <dd>공개 가능한 영양 정보가 확정되면 서버 기준으로 표시합니다.</dd>
              </div>
            </dl>
            <RouterLink class="button" :to="{ name: 'plans' }"
              >플랜 비교하기 <ArrowRight :size="17" aria-hidden="true"
            /></RouterLink>
          </div>
        </section>
        <aside class="catalog-note">
          메뉴는 개별 선택 상품이 아닙니다. 구독 플랜과 배송 일정에 따라 실제 제공 메뉴가 달라질 수
          있습니다.
        </aside>
      </template>

      <template v-else-if="screen === 'plans'">
        <header class="catalog-heading catalog-heading--plans">
          <p>플랜 안내</p>
          <h1>내 일정에 맞는 식사 플랜</h1>
          <span
            >플랜 구성과 첫 구독 혜택, 결제 금액은 신청 시 서버가 최종 기준으로 안내합니다.</span
          >
        </header>
        <section class="plan-grid" aria-label="플랜 비교">
          <article
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ 'plan-card--featured': plan.id === 'home' }"
          >
            <p>{{ plan.label }}</p>
            <h2>{{ plan.title }}</h2>
            <span>{{ plan.description }}</span>
            <strong class="plan-card__price">가격 확인 전</strong>
            <small>수량·배송 조건·적용 혜택은 신청 단계에서 서버가 확인합니다.</small>
            <ul>
              <li v-for="feature in plan.features" :key="feature">
                <Check :size="16" aria-hidden="true" />{{ feature }}
              </li>
            </ul>
            <RouterLink
              class="plan-card__link"
              :to="{ name: 'plan-detail', params: { planId: plan.id } }"
              >플랜 자세히 보기 <ArrowRight :size="17" aria-hidden="true"
            /></RouterLink>
          </article>
        </section>
        <RouterLink class="benefit-link" :to="{ name: 'first-benefit' }"
          >첫 구독 혜택과 적용 조건 보기 <ArrowRight :size="17" aria-hidden="true"
        /></RouterLink>
      </template>

      <template v-else-if="isPlanDetail">
        <nav class="breadcrumb" aria-label="경로">
          <RouterLink :to="{ name: 'plans' }">플랜 안내</RouterLink><span aria-hidden="true">/</span
          ><span>{{ currentPlan.label }}</span>
        </nav>
        <section class="plan-detail" aria-labelledby="plan-detail-title">
          <div>
            <p>{{ currentPlan.label }} 플랜</p>
            <h1 id="plan-detail-title">{{ currentPlan.title }}</h1>
            <span>{{ currentPlan.description }}</span>
          </div>
          <aside>
            <span class="status status--info">가격 확인 전</span>
            <p>
              최종 금액과 첫 구독 혜택 적용 여부는 수량·배송 조건을 입력한 뒤 서버에서 확인합니다.
            </p>
            <RouterLink class="button" :to="{ name: 'login' }"
              >로그인하고 구독 시작 <ArrowRight :size="17" aria-hidden="true"
            /></RouterLink>
          </aside>
        </section>
        <section class="process-card" aria-labelledby="plan-process-title">
          <h2 id="plan-process-title">이렇게 구독을 시작해요</h2>
          <ol>
            <li>
              <span>01</span><strong>플랜 선택</strong>
              <p>{{ currentPlan.label }} 구성과 안내 메뉴를 확인합니다.</p>
            </li>
            <li>
              <span>02</span><strong>배송 조건 설정</strong>
              <p>필요한 요일과 배송지·시간대를 입력합니다.</p>
            </li>
            <li>
              <span>03</span><strong>서버 결과 확인</strong>
              <p>적용일·가격·배송 가능 여부를 확인합니다.</p>
            </li>
          </ol>
        </section>
      </template>

      <template v-else-if="isBenefit">
        <header class="catalog-heading">
          <p>첫 구독 혜택</p>
          <h1>처음 시작하는 구독을 위한 안내</h1>
          <span>적용 대상, 조건, 혜택 금액은 실제 신청 시점의 서버 정책으로 확인합니다.</span>
        </header>
        <section class="benefit-card" aria-labelledby="benefit-title">
          <span class="status status--info">적용 여부 확인 전</span>
          <h2 id="benefit-title">첫 구독 혜택은 신청 단계에서 확인합니다.</h2>
          <p>
            플랜, 배송 조건, 가입 상태에 따라 적용 가능 여부가 달라질 수 있으며 화면에서 임의로
            계산하지 않습니다.
          </p>
          <RouterLink class="button" :to="{ name: 'plans' }"
            >플랜 비교로 돌아가기 <ArrowRight :size="17" aria-hidden="true"
          /></RouterLink>
        </section>
      </template>
    </main>

    <PublicFooter />
  </div>
</template>

<style scoped>
.catalog-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}
.catalog-content {
  width: min(100%, var(--content-width));
  flex: 1 0 auto;
  margin: 0 auto;
  padding: 72px var(--page-padding-desktop) 104px;
}
.catalog-heading {
  max-width: 760px;
}
.catalog-heading > p,
.detail-copy > p,
.plan-detail > div > p {
  margin: 0;
  color: var(--color-primary-hover);
  font-size: var(--font-body);
  font-weight: 800;
}
.catalog-heading h1,
.detail-copy h1,
.plan-detail h1 {
  margin: 12px 0 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.065em;
  line-height: var(--line-height-title);
}
.catalog-heading > span,
.detail-copy > span,
.plan-detail > div > span {
  display: block;
  margin-top: 18px;
  color: var(--color-text-muted);
  font-size: var(--font-item-title);
  line-height: var(--line-height-body);
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 38px;
}
.filter-row button {
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: 800;
}
.filter-row button.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-text);
}
.menu-grid,
.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}
.menu-card,
.plan-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.menu-card__visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 190px;
  padding: 20px;
  color: var(--color-text);
}
.menu-card__visual--sage {
  background: #dfe8c6;
}
.menu-card__visual--apricot {
  background: #f7ddbf;
}
.menu-card__visual--sand {
  background: #e9dfcf;
}
.menu-card__visual span {
  width: fit-content;
  padding: 5px 9px;
  border: 1px solid rgba(48, 51, 45, 0.25);
  border-radius: 999px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.menu-card__visual strong {
  font-size: var(--font-page-title);
  letter-spacing: -0.08em;
}
.menu-card__body {
  display: grid;
  align-items: start;
  padding: 20px;
}
.menu-card__body h2,
.plan-card h2,
.benefit-card h2 {
  margin: 14px 0 0;
  font-size: var(--font-section-title);
  letter-spacing: -0.045em;
  line-height: var(--line-height-compact);
}
.menu-card__body p {
  min-height: 44px;
  margin: 9px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.menu-card__link,
.plan-card__link,
.benefit-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  min-height: 42px;
  margin-top: 17px;
  color: var(--color-text);
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid var(--color-text);
}
.catalog-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 52px;
  padding: 28px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
}
.catalog-callout p {
  margin: 0;
  font-size: var(--font-section-title);
  font-weight: 900;
}
.catalog-callout span {
  display: block;
  margin-top: 7px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.catalog-callout .button,
.detail-copy .button,
.plan-detail .button,
.benefit-card .button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  text-decoration: none;
}
.breadcrumb {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}
.breadcrumb a {
  color: var(--color-text);
}
.detail-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1fr);
  gap: clamp(36px, 7vw, 90px);
  align-items: start;
}
.detail-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 420px;
  padding: 28px;
  border-radius: var(--radius-xl);
  background: #e6dbc4;
}
.detail-visual span {
  font-weight: 800;
}
.detail-visual strong {
  font-size: var(--font-display);
  letter-spacing: -0.09em;
}
.detail-list {
  display: grid;
  gap: 0;
  margin: 30px 0;
  border-top: 1px solid var(--color-text);
}
.detail-list div {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-list dt {
  font-weight: 800;
}
.detail-list dd {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.catalog-note {
  margin-top: 30px;
  padding: 16px 18px;
  border-left: 4px solid var(--color-info);
  background: var(--color-info-soft);
  color: var(--color-info);
  line-height: var(--line-height-body);
}
.catalog-heading--plans {
  max-width: 700px;
}
.plan-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
}
.plan-card--featured {
  border-color: var(--color-primary);
  box-shadow: 0 12px 30px rgba(95, 109, 51, 0.12);
}
.plan-card > p {
  margin: 0;
  color: var(--color-primary-hover);
  font-size: var(--font-caption);
  font-weight: 900;
}
.plan-card > span {
  display: block;
  min-height: 68px;
  margin-top: 12px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.plan-card__price {
  display: block;
  margin-top: 26px;
  font-size: var(--font-section-title);
  letter-spacing: -0.04em;
}
.plan-card small {
  margin-top: 6px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.plan-card ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 26px 0 0;
  list-style: none;
}
.plan-card li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: var(--color-text-muted);
  line-height: var(--line-height-compact);
}
.plan-card li svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--color-primary-hover);
}
.plan-card__link {
  margin-top: auto;
  padding-top: 24px;
}
.benefit-link {
  margin-top: 28px;
}
.plan-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(290px, 0.62fr);
  gap: 42px;
  align-items: end;
  padding: clamp(28px, 5vw, 60px);
  border-radius: var(--radius-xl);
  background: var(--color-primary-soft);
}
.plan-detail aside {
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.plan-detail aside p {
  margin: 14px 0 20px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.process-card {
  margin-top: 28px;
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.process-card h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.process-card ol {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  padding: 0;
  margin: 28px 0 0;
  list-style: none;
}
.process-card li {
  display: grid;
  gap: 8px;
}
.process-card li > span {
  color: var(--color-primary-hover);
  font-size: var(--font-caption);
  font-weight: 900;
}
.process-card li strong {
  font-size: var(--font-body);
}
.process-card li p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.benefit-card {
  max-width: 720px;
  margin-top: 36px;
  padding: clamp(28px, 5vw, 56px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.benefit-card p {
  max-width: 560px;
  margin: 15px 0 26px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
@media (hover: hover) and (pointer: fine) {
  .filter-row button:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  .menu-card__link:hover,
  .plan-card__link:hover,
  .benefit-link:hover {
    color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
}
@media (max-width: 768px) {
  .catalog-content {
    padding: 48px var(--page-padding-mobile) 72px;
  }
  .menu-grid,
  .plan-grid {
    grid-template-columns: 1fr;
  }
  .menu-card__visual {
    min-height: 170px;
  }
  .catalog-callout {
    display: grid;
    padding: 24px 20px;
  }
  .catalog-callout .button,
  .detail-copy .button,
  .plan-detail .button,
  .benefit-card .button {
    width: 100%;
  }
  .detail-layout,
  .plan-detail {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .detail-visual {
    min-height: 280px;
  }
  .detail-list div {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  .process-card {
    padding: 24px 20px;
  }
  .process-card ol {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .plan-card > span {
    min-height: auto;
  }
}
</style>
