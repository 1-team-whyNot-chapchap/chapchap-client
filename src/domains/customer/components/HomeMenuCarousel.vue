<script setup>
import { ArrowRight } from 'lucide-vue-next'
import { menuItems, planLabels } from '../../../common/constants/prototypeData'

const emit = defineEmits(['navigate'])

// 홈 디자인 미리보기용 연결이며, 실제 상품의 플랜 계약으로 사용하지 않습니다.
const previewMenus = [
  { menuId: 'menu-03', plan: 'healthy' },
  { menuId: 'menu-01', plan: 'nutrition' },
  { menuId: 'menu-02', plan: 'hearty' },
].map(({ menuId, plan }) => ({
  ...menuItems.find((menu) => menu.id === menuId),
  planLabel: planLabels[plan],
}))
</script>

<template>
  <section class="home-menu" aria-labelledby="home-menu-title">
    <div class="home-menu__heading">
      <h2 id="home-menu-title">이번 주 챱챱 메뉴</h2>
      <p>건강식·영양식·든든식의 메뉴를 살펴보세요. 플랜별 구성은 예시입니다.</p>
    </div>

    <div class="home-menu__showcase">
      <article v-for="menu in previewMenus" :key="menu.id" class="home-menu__card">
        <div class="home-menu__photo">[사진이 필요한 곳입니다.]</div>
        <div class="home-menu__content">
          <span class="home-menu__plan">{{ menu.planLabel }} 플랜</span>
          <h3>{{ menu.name }}</h3>
          <p>{{ menu.description }}</p>
          <strong>{{ menu.nutrition }}</strong>
        </div>
      </article>
    </div>

    <button
      class="button button-primary home-menu__more"
      type="button"
      @click="emit('navigate', 'menu')"
    >
      이번 주 메뉴 전체 보기
      <ArrowRight :size="18" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.home-menu {
  margin-top: 96px;
}

.home-menu__heading h2 {
  margin: 0;
  font-size: var(--font-page-title);
}

.home-menu__heading p {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}

.home-menu__showcase {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.home-menu__card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.home-menu__photo {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.home-menu__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.home-menu__plan {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

.home-menu__content h3 {
  margin: 0;
  font-size: var(--font-item-title);
  line-height: var(--line-height-compact);
}

.home-menu__content p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}

.home-menu__content strong {
  margin-top: auto;
  padding-top: var(--space-2);
  font-size: var(--font-caption);
}

.home-menu__more {
  display: flex;
  width: fit-content;
  margin: var(--space-5) 0 0 auto;
}

@media (max-width: 760px) {
  .home-menu {
    margin-top: var(--space-8);
  }

  .home-menu__showcase {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }

  .home-menu__more {
    width: 100%;
  }
}
</style>
