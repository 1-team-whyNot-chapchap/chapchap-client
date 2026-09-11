<script setup>
import { Bike, LayoutDashboard, LogIn } from 'lucide-vue-next'
import LogoutButton from '../../domains/auth/components/LogoutButton.vue'
import { authSession } from '../api/http.js'

defineProps({
  currentView: {
    type: String,
    default: 'home',
  },
})

// defineEmits는 자식 컴포넌트가 부모 컴포넌트에 사건을 알리는 Vue 문법입니다.
// 이 헤더는 직접 화면을 바꾸지 않고, 메뉴 클릭 사실만 부모에게 전달합니다.
// 부모 App.vue가 받은 navigate 값을 기준으로 실제 화면을 전환합니다.
const emit = defineEmits(['navigate'])
</script>

<template>
  <header class="customer-header">
    <button
      class="brand-button"
      type="button"
      aria-label="챱챱 홈으로"
      @click="emit('navigate', 'home')"
    >
      <!-- img는 전달받은 브랜드 이미지를 표시하는 태그이며, 버튼의 aria-label이 이름을 대신하므로 alt는 비워 둡니다. -->
      <img class="brand-mark" src="/images/chapchap-brand-logo.png" alt="" />
    </button>

    <nav class="desktop-navigation" aria-label="상단 메뉴">
      <button
        type="button"
        :class="{ 'is-active': currentView === 'menu' }"
        @click="emit('navigate', 'menu')"
      >
        메뉴
      </button>
      <button
        type="button"
        :class="{ 'is-active': currentView === 'plans' }"
        @click="emit('navigate', 'plans')"
      >
        플랜
      </button>
      <button
        type="button"
        :class="{ 'is-active': currentView === 'subscription' }"
        @click="emit('navigate', 'subscription')"
      >
        내 구독
      </button>
      <button
        type="button"
        :class="{ 'is-active': currentView === 'mypage' }"
        @click="emit('navigate', 'mypage')"
      >
        마이
      </button>
    </nav>

    <div class="header-actions">
      <button
        class="header-admin-button"
        type="button"
        aria-label="관리자 페이지로"
        @click="emit('navigate', 'admin')"
      >
        <LayoutDashboard :size="17" aria-hidden="true" />
        <span>관리자</span>
      </button>
      <button
        class="header-rider-button"
        type="button"
        aria-label="라이더 화면으로"
        @click="emit('navigate', 'rider-deliveries')"
      >
        <Bike :size="17" aria-hidden="true" />
        <span>라이더</span>
      </button>
      <button
        class="header-auth-button"
        v-if="!authSession.state.user"
        type="button"
        aria-label="로그인 화면으로"
        @click="emit('navigate', 'login')"
      >
        <LogIn :size="17" aria-hidden="true" />
        <span>로그인</span>
      </button>
      <LogoutButton />
    </div>
  </header>
</template>

<style scoped>
.customer-header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 72px;
  max-width: none;
  margin: 0;
  /* 헤더의 시작·끝을 .page 콘텐츠와 맞춰 화면 중심축이 흔들리지 않게 합니다. */
  padding: 0 max(var(--page-gutter), calc((100vw - var(--content-max-width)) / 2 + 64px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 253, 249, 0.96);
  box-shadow: 0 5px 16px rgba(51, 53, 47, 0.04);
  backdrop-filter: blur(14px);
}

.brand-button,
.header-admin-button,
.header-rider-button,
.header-auth-button,
.desktop-navigation button,
.text-button,
.admin-link {
  border: 0;
  background: transparent;
  color: var(--color-text);
}

.brand-button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
}

.brand-button .brand-mark {
  width: 56px;
  height: 56px;
}

.desktop-navigation {
  display: flex;
  gap: 8px;
  margin-left: auto;
  margin-right: 28px;
}

.desktop-navigation button {
  min-height: 44px;
  padding: 9px 11px;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  font-weight: var(--font-weight-bold);
}

.desktop-navigation button.is-active,
.desktop-navigation button:hover {
  color: var(--color-primary-pressed);
}

.header-actions {
  display: flex;
  gap: 7px;
}
.header-actions > button {
  min-width: 44px;
  min-height: 44px;
}

.header-auth-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 760px) {
  .customer-header {
    height: 64px;
    padding: 0 var(--page-gutter);
  }

  .brand-button .brand-mark {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 760px) {
  .desktop-navigation {
    display: none;
  }
}

@media (max-width: 760px) {
  .header-auth-button span {
    display: none;
  }
}

@media (max-width: 760px) {
  .header-auth-button {
    padding: 9px;
  }
}
</style>

<style scoped>
.header-admin-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

.header-rider-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 760px) {
  .header-admin-button,
  .header-rider-button {
    padding: 9px;
  }

  .header-admin-button span,
  .header-rider-button span {
    display: none;
  }
}
</style>
