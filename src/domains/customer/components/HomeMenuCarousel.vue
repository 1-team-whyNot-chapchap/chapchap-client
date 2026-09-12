<script setup>
import PublicMenuCatalog from '../../product/components/PublicMenuCatalog.vue'
</script>
<template>
  <section class="home-menu">
    <header>
      <h2>챱챱 메뉴 둘러보기</h2>
      <p>플랜별로 제공되는 메뉴를 확인해 보세요.</p>
    </header>
    <PublicMenuCatalog compact />
    <div class="home-menu-actions">
      <RouterLink class="button button-primary" to="/menu">전체 메뉴 보기</RouterLink>
    </div>
  </section>
</template>
<style scoped>
.home-menu {
  margin-top: 72px;
}
header {
  margin-bottom: 24px;
}
h2 {
  font-size: var(--font-page-title);
}
header p {
  color: var(--color-text-muted);
}
.home-menu-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
