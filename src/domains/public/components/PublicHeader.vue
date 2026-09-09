<script setup>
import { nextTick, ref } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const isMenuOpen = ref(false)
const route = useRoute()
const router = useRouter()

function closeMenu() {
  isMenuOpen.value = false
}

async function moveToSection(id) {
  closeMenu()
  if (route.name !== 'home') await router.push({ name: 'home' })
  await nextTick()
  const section = document.getElementById(id)
  if (!section) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <header class="public-header">
    <RouterLink class="public-header__brand" :to="{ name: 'home' }" @click="closeMenu">
      챱챱
    </RouterLink>
    <button
      class="public-header__menu-toggle"
      type="button"
      :aria-expanded="isMenuOpen"
      aria-controls="public-navigation"
      :aria-label="isMenuOpen ? '메뉴 닫기' : '메뉴 열기'"
      @click="isMenuOpen = !isMenuOpen"
    >
      <X v-if="isMenuOpen" :size="22" aria-hidden="true" />
      <Menu v-else :size="22" aria-hidden="true" />
    </button>
    <nav id="public-navigation" :class="{ 'is-open': isMenuOpen }" aria-label="공개 메뉴">
      <RouterLink :to="{ name: 'home' }" @click="closeMenu">홈</RouterLink>
      <RouterLink :to="{ name: 'menu' }" @click="closeMenu">메뉴</RouterLink>
      <RouterLink :to="{ name: 'plans' }" @click="closeMenu">플랜</RouterLink>
      <button type="button" @click="moveToSection('how-it-works')">이용 방법</button>
      <button type="button" @click="moveToSection('faq')">자주 묻는 질문</button>
      <RouterLink :to="{ name: 'admin-login' }" @click="closeMenu">관리자</RouterLink>
      <RouterLink class="public-header__login" :to="{ name: 'login' }" @click="closeMenu">
        로그인
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.public-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: min(100%, var(--content-width));
  min-height: 72px;
  margin: 0 auto;
  padding: 16px var(--page-padding-desktop);
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 253, 249, 0.96);
  backdrop-filter: blur(14px);
}
.public-header__brand {
  flex: 0 0 auto;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
  letter-spacing: -0.08em;
  text-decoration: none;
}
.public-header nav {
  display: flex;
  align-items: center;
  gap: 20px;
}
.public-header nav a,
.public-header nav button {
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
  text-decoration: none;
}
.public-header nav button {
  min-height: 40px;
  padding: 0;
}
.public-header__login {
  display: inline-grid;
  min-height: 40px;
  padding: 0 14px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-text) !important;
  color: var(--color-surface) !important;
}
.public-header__menu-toggle {
  display: none;
  width: 44px;
  min-height: 44px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
@media (hover: hover) and (pointer: fine) {
  .public-header nav a:not(.public-header__login):hover,
  .public-header nav button:hover {
    color: var(--color-primary);
  }
}
@media (max-width: 768px) {
  .public-header {
    position: sticky;
    min-height: 64px;
    padding-inline: var(--page-padding-mobile);
  }
  .public-header__menu-toggle {
    display: inline-grid;
    place-items: center;
  }
  .public-header nav {
    position: absolute;
    top: calc(100% + 1px);
    right: 0;
    left: 0;
    z-index: 10;
    display: none;
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px var(--page-padding-mobile) 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    box-shadow: var(--shadow-floating);
  }
  .public-header nav.is-open {
    display: grid;
  }
  .public-header nav a,
  .public-header nav button {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 48px;
    padding: 0 4px;
    text-align: left;
  }
  .public-header__login {
    justify-content: center;
    margin-top: 8px;
    padding: 0 14px !important;
  }
}
</style>
