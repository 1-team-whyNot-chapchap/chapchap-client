<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({ area: { type: String, required: true } })
const route = useRoute()

const navigation = {
  customer: [
    ['홈', 'app-home'],
    ['메뉴·구독', 'app-subscription'],
    ['내 구독', 'app-orders'],
    ['마이페이지', 'app-mypage'],
  ],
  rider: [
    ['오늘 배송', 'rider-today-deliveries'],
    ['근무 일정', 'rider-schedule'],
  ],
  admin: [
    ['대시보드', 'admin-dashboard'],
    ['구독', 'admin-subscriptions'],
    ['주문', 'admin-orders'],
    ['결제', 'admin-payments'],
    ['환불', 'admin-refunds'],
    ['배송', 'admin-delivery-operations'],
    ['배정', 'admin-assignments'],
    ['수용량', 'admin-delivery-capacity'],
    ['휴무·제외', 'admin-offdays'],
    ['역할', 'admin-riders'],
    ['계정', 'admin-accounts'],
    ['감사 로그', 'admin-audit-logs'],
  ],
}
const items = computed(() => navigation[props.area] ?? [])
const label = computed(() => ({ customer: '고객', rider: '라이더', admin: '관리자' })[props.area])
</script>

<template>
  <div class="shell" :class="`shell--${area}`">
    <header class="shell__header">
      <RouterLink
        class="shell__brand"
        :to="area === 'admin' ? { name: 'admin-dashboard' } : { name: 'home' }"
        >챱챱</RouterLink
      >
      <span>{{ label }} 서비스</span>
    </header>
    <nav class="shell__nav" :aria-label="`${label} 메뉴`">
      <RouterLink
        v-for="[text, name] in items"
        :key="name"
        :to="{ name }"
        :class="{ active: route.name === name }"
        >{{ text }}</RouterLink
      >
    </nav>
    <main><slot /></main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}
.shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding: 18px var(--page-padding-desktop);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-body);
}
.shell__brand {
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
  text-decoration: none;
}
.shell__nav {
  display: flex;
  gap: 4px;
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding: 10px var(--page-padding-desktop);
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.82);
}
.shell__nav a {
  flex: 0 0 auto;
  padding: 9px 11px;
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  font-weight: 700;
  text-decoration: none;
}
.shell__nav a.active {
  background: var(--color-primary-soft);
  color: var(--color-text);
}
.shell--admin {
  background: var(--color-background);
}
.shell--admin .shell__nav {
  background: var(--color-surface);
}
.shell--admin .shell__header,
.shell--admin .shell__nav {
  width: min(100%, var(--admin-content-width));
}
@media (max-width: 768px) {
  .shell__header,
  .shell__nav {
    padding-inline: var(--page-padding-mobile);
  }
  .shell__nav {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
  }
  .shell--customer .shell__nav {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    width: 100%;
    justify-content: space-around;
    padding: 8px;
    background: var(--color-surface);
    box-shadow: var(--shadow-floating);
  }
  .shell--customer .shell__nav a {
    font-size: var(--font-caption);
    padding: 10px 6px;
    text-align: center;
  }
}
</style>
