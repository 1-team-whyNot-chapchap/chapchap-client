<script setup>
import { ref, watch } from 'vue'
import AdminNavigationGroup from './AdminNavigationGroup.vue'
import LogoutButton from '../../auth/components/LogoutButton.vue'

const emit = defineEmits(['navigate'])
const props = defineProps({
  currentRoute: {
    type: String,
    default: 'admin',
  },
})

const groups = [
  {
    id: 'work',
    label: '업무',
    items: [
      { label: '업무 홈', route: 'admin' },
      { label: '배송 그룹', route: 'admin-delivery-groups' },
      { label: '운영 예외', route: 'admin-delivery-operations' },
    ],
  },
  {
    id: 'support',
    label: '고객지원',
    items: [
      { label: '대기 상담', route: 'admin-consultations' },
      { label: '품질 문의', route: 'admin-quality-inquiries' },
      { label: 'FAQ 관리', route: 'admin-faqs' },
      { label: '지식 문서', route: 'admin-knowledge' },
    ],
  },
  {
    id: 'accounts',
    label: '계정·기록',
    items: [
      { label: '라이더 등록', route: 'admin-rider-accounts' },
      { label: '관리자 계정', route: 'admin-accounts' },
      { label: '사용자 역할', route: 'admin-role-management' },
      { label: '감사 이력', route: 'admin-audit-logs' },
      { label: '비밀번호 변경', route: 'admin-password' },
    ],
  },
]

const openedGroupId = ref('')
const menuOpen = ref(false)
watch(
  () => props.currentRoute,
  (value) => {
    openedGroupId.value = groups.find((g) => g.items.some((i) => i.route === value))?.id || ''
  },
  { immediate: true },
)

function toggleGroup(groupId) {
  openedGroupId.value = openedGroupId.value === groupId ? '' : groupId
}

function navigate(route) {
  menuOpen.value = false
  emit('navigate', route)
}
</script>

<template>
  <aside class="admin-sidebar">
    <button class="admin-brand" type="button" @click="navigate('admin')">
      챱챱
      <span>관리자페이지</span>
    </button>

    <button
      class="admin-menu-toggle admin-back-link"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="admin-menu"
      @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? '메뉴 닫기' : '관리자 메뉴 열기' }}
    </button>
    <nav id="admin-menu" aria-label="관리자 메뉴" :class="{ 'is-mobile-open': menuOpen }">
      <AdminNavigationGroup
        v-for="group in groups"
        :key="group.id"
        :group="group"
        :current-route="props.currentRoute"
        :is-open="openedGroupId === group.id"
        @toggle="toggleGroup"
        @navigate="navigate"
      />
    </nav>

    <button
      class="admin-back-link admin-customer-link"
      :class="{ 'is-mobile-open': menuOpen }"
      type="button"
      @click="navigate('home')"
    >
      고객 화면으로
    </button>
    <LogoutButton />
  </aside>
</template>

<style scoped>
.admin-menu-toggle {
  display: none;
}
.admin-sidebar {
  --color-text-muted: color-mix(in srgb, var(--color-text) 80%, var(--color-surface));
  --color-primary-pressed: color-mix(in srgb, var(--color-primary-hover) 85%, var(--color-text));
  position: sticky;
  top: 0;
  width: 100%;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 30px 18px;
  box-sizing: border-box;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.admin-brand {
  display: grid;
  gap: 3px;
  width: fit-content;
  padding: 0 11px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
  letter-spacing: -0.07em;
  text-align: left;
}

.admin-brand span {
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  letter-spacing: 0;
}

.admin-sidebar nav {
  display: grid;
  gap: 8px;
  margin-top: 44px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.admin-back-link {
  min-height: 44px;
  margin-top: 18px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: left;
}

.admin-brand:focus-visible,
.admin-back-link:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: -3px;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    position: sticky;
    z-index: 30;
    width: 100%;
    height: auto;
    max-height: min(72vh, 580px);
    padding: 16px 20px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }

  .admin-sidebar nav {
    margin-top: 16px;
    display: none;
    grid-column: 1 / -1;
  }
  .admin-sidebar nav.is-mobile-open {
    display: grid;
  }
  .admin-menu-toggle {
    display: block;
  }

  .admin-back-link {
    margin-top: 0;
  }
  .admin-customer-link {
    display: none;
    grid-column: 1 / -1;
  }
  .admin-customer-link.is-mobile-open {
    display: block;
  }
}
</style>
