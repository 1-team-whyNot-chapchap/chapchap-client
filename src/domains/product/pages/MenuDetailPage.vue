<script setup>
import { computed } from 'vue'
import { AlertTriangle, Check, ChevronRight, Leaf } from 'lucide-vue-next'
import { menuItems } from '../../../common/constants/prototypeData'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { selectedPreviewMenuId } from '../data/menuCalendarPreview'

const emit = defineEmits(['navigate'])
const menu = computed(
  () => menuItems.find((item) => item.id === selectedPreviewMenuId.value) || menuItems[0],
)
</script>

<template>
  <div class="page detail-feature-page">
    <PageBackButton label="메뉴 목록으로" @back="emit('navigate', 'wf-008')" />

    <section class="menu-detail-hero">
      <div class="photo-placeholder photo-placeholder--large">[사진이 필요한 곳입니다.]</div>
      <div class="menu-detail-copy">
        <p class="section-kicker">{{ menu.type }}</p>
        <h1>{{ menu.name }}</h1>
        <p>{{ menu.description }}</p>
        <span class="included-label"><Check :size="16" aria-hidden="true" /> 플랜 포함 메뉴</span>

        <dl class="menu-facts">
          <div>
            <dt>영양 정보</dt>
            <dd>{{ menu.nutrition }}</dd>
          </div>
          <div>
            <dt>알레르기</dt>
            <dd>{{ menu.allergens }}</dd>
          </div>
        </dl>

        <button class="button button-primary" type="button" @click="emit('navigate', 'plans')">
          플랜에서 선택하기
          <ChevronRight :size="18" aria-hidden="true" />
        </button>
      </div>
    </section>

    <section class="menu-detail-notes">
      <article>
        <Leaf :size="21" aria-hidden="true" />
        <div>
          <strong>메뉴 구성 원칙</strong>
          <p>한 끼의 균형과 구독 중 선택하기 쉬운 구성을 기준으로 준비합니다.</p>
        </div>
      </article>
      <article>
        <AlertTriangle :size="21" aria-hidden="true" />
        <div>
          <strong>알레르기 정보 확인</strong>
          <p>최종 원재료와 교차오염 정보는 실제 상품 라벨과 서버 데이터를 확인해야 합니다.</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.catalog-search {
  max-width: 620px;
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 34px;
  padding: 0 15px;
  border: 1px solid var(--color-border);
  border-radius: 13px;
  background: var(--color-surface);
  color: var(--color-text-muted);
}
.catalog-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}
.catalog-search input:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.catalog-menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 34px;
}
.catalog-menu-card {
  position: relative;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  gap: 17px;
  overflow: hidden;
  padding: 0 18px 0 0;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}
.catalog-menu-card.is-disabled {
  opacity: 0.62;
}
.photo-placeholder {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}
.photo-placeholder--large {
  min-height: 410px;
  border: 1px dashed #cdd3bc;
  border-radius: 22px;
}
.catalog-menu-card__body {
  display: grid;
  gap: 6px;
  padding-block: 18px;
}
.catalog-menu-card__body small,
.catalog-menu-card__body b {
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.catalog-menu-card__body strong {
  font-size: var(--font-body);
}
.catalog-menu-card__body > span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.menu-detail-hero,
.plan-detail-hero {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: clamp(34px, 6vw, 76px);
}
.menu-detail-copy h1,
.plan-detail-hero h1 {
  margin-top: 0;
  font-size: var(--font-display);
}
.menu-detail-copy > p:not(.section-kicker),
.plan-detail-hero > div > p:not(.section-kicker) {
  margin-top: 16px;
}
.included-label {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.menu-facts {
  display: grid;
  gap: 0;
  margin: 25px 0;
  border-top: 1px solid var(--color-border);
}
.menu-facts > div {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 18px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.menu-facts dt,
.menu-facts dd {
  margin: 0;
  font-size: var(--font-caption);
}
.menu-facts dt {
  color: var(--color-text-muted);
}
.menu-facts dd {
  font-weight: 700;
}
@media (max-width: 760px) {
  .catalog-menu-grid,
  .menu-detail-hero,
  .plan-detail-hero {
    grid-template-columns: 1fr;
  }
  .catalog-menu-card {
    grid-template-columns: 110px minmax(0, 1fr);
    padding-right: 14px;
  }
  .catalog-menu-card > svg {
    display: none;
  }
}
</style>

<style scoped>
.included-label {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}

.menu-facts {
  display: grid;
  gap: 0;
  margin: 25px 0;
  border-top: 1px solid var(--color-border);
}

.menu-facts > div {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 18px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}

.menu-facts dt,
.menu-facts dd {
  margin: 0;
  font-size: var(--font-caption);
}

.menu-facts dt {
  color: var(--color-text-muted);
}

.menu-facts dd {
  font-weight: 700;
}

.menu-detail-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 48px;
}

.menu-detail-notes article {
  display: flex;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: var(--color-surface-subtle);
}

.menu-detail-notes svg {
  flex: 0 0 auto;
  color: var(--color-primary-pressed);
}

.menu-detail-notes p {
  margin-top: 5px;
  font-size: var(--font-caption);
}
</style>
