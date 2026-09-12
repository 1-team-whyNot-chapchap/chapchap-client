<script setup>
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import PublicMenuCatalog from '../components/PublicMenuCatalog.vue'
</script>

<template>
  <div class="page plan-menu-list-page workspace-ui">
    <PageBackButton label="플랜 목록으로" :to="{ name: 'plans' }" />
    <section class="page-intro">
      <h1>플랜별 메뉴 전체 보기</h1>
      <p>전체 메뉴를 둘러보거나 플랜을 선택해 해당 플랜의 메뉴를 확인하세요.</p>
    </section>
    <PublicMenuCatalog />
  </div>
</template>
