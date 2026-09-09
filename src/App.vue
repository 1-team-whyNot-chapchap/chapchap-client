<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarDays,
  CircleUserRound,
  Home,
  LayoutDashboard,
  Package,
  Salad,
} from 'lucide-vue-next'
import CustomerHeader from './common/layouts/CustomerHeader.vue'
import CustomerFooter from './common/layouts/CustomerFooter.vue'
import CustomerQuickNavigation from './common/components/navigation/CustomerQuickNavigation.vue'
import PlanSelectionSheet from './domains/subscription/components/PlanSelectionSheet.vue'
import { useAppStore } from './stores/useAppStore'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const navigationItems = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'menu', label: '메뉴', icon: Salad },
  { id: 'plans', label: '플랜', icon: Package },
  { id: 'subscription', label: '내 구독', icon: CalendarDays },
  { id: 'mypage', label: '마이', icon: CircleUserRound },
]

// computed는 반응형 값을 조합해 새 값을 만드는 Vue 문법입니다.
// 현재 선택된 화면이 관리자 화면인지 계산합니다.
// 현재 URL의 route 정보가 바뀔 때마다 이 값도 자동으로 다시 계산됩니다.
const isAdminPage = computed(() => route.name === 'admin' || route.meta.area === 'admin')
// 로그인·회원가입과 구독 신청은 한 가지 과업에 집중해야 하는 화면입니다.
// 라우트의 layout 값으로 공통 헤더·푸터·전역 탐색을 숨겨 집중형 레이아웃을 적용합니다.
const isMinimalPage = computed(() => route.meta.layout === 'minimal')
const activeNavigation = computed(() => {
  const routeName = String(route.name || '')

  if (['menu', 'wf-008', 'wf-009', 'subscribe-menu'].includes(routeName)) {
    return 'menu'
  }

  if (
    [
      'plans',
      'wf-011',
      'wf-012',
      'plan-hearty-detail',
      'wf-013',
      'wf-014',
      'wf-015',
      'wf-016',
      'wf-017',
      'wf-018',
      'wf-019',
    ].includes(routeName)
  ) {
    return 'plans'
  }

  if (
    routeName === 'subscription' ||
    routeName === 'subscription-cancel' ||
    [
      'subscription-list',
      'wf-021',
      'wf-022',
      'wf-023',
      'wf-024',
      'wf-025',
      'delivery-menu-edit',
      'delivery-conditions-edit',
      'wf-054',
    ].includes(routeName)
  ) {
    return 'subscription'
  }

  // 정규식은 WF-027부터 WF-036까지의 이름인지 한 번에 확인하는 JavaScript 문법입니다.
  if (
    routeName === 'mypage' ||
    ['notifications', 'account-settings', 'payment-method-register'].includes(routeName) ||
    /^wf-0(2[7-9]|3[0-6])$/.test(routeName)
  ) {
    return 'mypage'
  }

  return routeName
})

function navigate(view) {
  router.push({ name: view })
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
</script>

<template>
  <main
    class="app-shell"
    :class="{
      'admin-mode': isAdminPage,
      'customer-minimal-mode': isMinimalPage,
    }"
  >
    <template v-if="isAdminPage">
      <RouterView v-slot="{ Component }">
        <component :is="Component" @navigate="navigate" />
      </RouterView>
    </template>

    <template v-else>
      <CustomerHeader v-if="!isMinimalPage" :current-view="activeNavigation" @navigate="navigate" />
      <CustomerQuickNavigation v-if="!isMinimalPage" @navigate="navigate" />

      <section class="customer-content" :class="{ 'customer-content--minimal': isMinimalPage }">
        <!-- RouterView의 v-slot은 현재 주소와 연결된 페이지 컴포넌트를 꺼내는 문법입니다. -->
        <!-- 여기서는 모든 고객 페이지에 같은 화면 전환 함수와 플랜 선택 Sheet 열기 기능을 전달합니다. -->
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            @navigate="navigate"
            @open-plan-sheet="appStore.openPlanSheet"
          />
        </RouterView>
      </section>
      <CustomerFooter v-if="!isMinimalPage" @navigate="navigate" />

      <nav v-if="!isMinimalPage" class="bottom-navigation" aria-label="주요 메뉴" v-auto-animate>
        <!-- v-auto-animate는 목록의 선택·추가·삭제 변화에 부드러운 움직임을 더하는 지시어입니다. -->
        <!-- 이 코드에서는 하단 메뉴가 화면 상태에 맞게 바뀔 때 이동을 자연스럽게 보여 줍니다. -->
        <button
          v-for="item in navigationItems"
          :key="item.id"
          class="bottom-navigation__item"
          :class="{ 'is-active': activeNavigation === item.id }"
          type="button"
          @click="navigate(item.id)"
        >
          <!-- component :is는 배열에 저장한 아이콘 컴포넌트를 상황에 맞게 화면에 그리는 Vue 문법입니다. -->
          <!-- 이 코드에서는 각 메뉴가 가진 icon 값을 실제 Lucide 아이콘으로 바꿔 보여 줍니다. -->
          <component :is="item.icon" :size="20" stroke-width="1.8" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </template>

    <PlanSelectionSheet
      v-if="!isAdminPage && !isMinimalPage"
      :is-open="appStore.isPlanSheetOpen"
      @close="appStore.closePlanSheet"
      @navigate="navigate"
    />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>

<style scoped>
.admin-mode {
  background: var(--color-background);
}
</style>

<style scoped>
.customer-content {
  padding-bottom: 112px;
}

.customer-content--minimal {
  padding-bottom: 0;
}

.bottom-navigation {
  position: fixed;
  z-index: var(--z-sticky);
  right: 0;
  bottom: 0;
  left: 0;
  display: none;
  justify-content: space-around;
  padding: 7px max(10px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom))
    max(10px, env(safe-area-inset-left));
  border-top: 1px solid var(--color-border);
  background: rgba(255, 253, 249, 0.94);
  backdrop-filter: blur(14px);
}

.bottom-navigation__item {
  min-width: 55px;
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 7px 5px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}

.bottom-navigation__item.is-active {
  color: var(--color-primary-pressed);
  background: var(--color-primary-soft);
}

@media (max-width: 1320px) {
  .bottom-navigation {
    display: flex;
  }
}

@media (max-width: 760px) {
  .customer-content {
    padding-bottom: 90px;
  }
}

@media (max-width: 760px) {
  .bottom-navigation {
    display: flex;
  }
}
</style>
