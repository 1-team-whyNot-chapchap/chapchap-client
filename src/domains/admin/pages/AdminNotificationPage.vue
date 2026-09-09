<script setup>
import { AlertTriangle, CreditCard, PackageX, Warehouse } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])

const alerts = [
  {
    id: 1,
    icon: PackageX,
    level: '긴급',
    title: '8월 3일 배송 2건의 주소 확인이 필요합니다.',
    description: '주소 누락 또는 공동현관 정보가 없는 주문을 확인해 주세요.',
    action: '배송 목록 보기',
    route: 'wf-049',
  },
  {
    id: 2,
    icon: CreditCard,
    level: '확인',
    title: '정기결제 실패 5건이 발생했습니다.',
    description: '재결제 대상과 고객 안내 상태를 확인해 주세요.',
    action: '결제 목록 보기',
    route: 'wf-047',
  },
  {
    id: 3,
    icon: Warehouse,
    level: '주의',
    title: '단호박 소불고기 도시락 재고가 부족합니다.',
    description: '다음 회차 공개 수량과 대체 메뉴를 검토해 주세요.',
    action: '재고 관리 보기',
    route: 'wf-039',
  },
]
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-notifications" @navigate="emit('navigate', $event)" />

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <h1>운영 알림</h1>
          <p>배송, 결제, 재고에서 먼저 확인해야 할 항목입니다.</p>
        </div>
      </header>

      <aside class="admin-security-notice">
        <AlertTriangle :size="18" aria-hidden="true" />
        <p>현재 알림은 화면 구성을 위한 예시이며 실제 운영 데이터는 서버에서 제공되어야 합니다.</p>
      </aside>

      <section class="admin-alert-list">
        <article v-for="alert in alerts" :key="alert.id">
          <span class="admin-alert-list__icon">
            <component :is="alert.icon" :size="21" aria-hidden="true" />
          </span>
          <div>
            <small>{{ alert.level }}</small>
            <h2>{{ alert.title }}</h2>
            <p>{{ alert.description }}</p>
          </div>
          <button class="admin-outline-button" type="button" @click="emit('navigate', alert.route)">
            {{ alert.action }}
          </button>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.admin-sidebar {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 26px 16px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
.admin-brand {
  width: fit-content;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
}
.admin-brand span {
  margin-left: 5px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.admin-sidebar nav {
  display: grid;
  gap: 4px;
  margin-top: 30px;
}
.admin-sidebar nav button,
.admin-back-link {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-muted);
  text-align: left;
  font-size: var(--font-caption);
  font-weight: 700;
}
.admin-sidebar nav button.is-active {
  background: var(--color-primary-soft);
  color: var(--color-text);
}
.admin-back-link {
  margin-top: auto;
}
.admin-nav-group {
  display: grid;
  gap: 4px;
  margin-top: 18px;
}
.admin-nav-group:first-child {
  margin-top: 0;
}
.admin-nav-group small {
  padding: 0 13px 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 900;
}
.admin-main {
  min-width: 0;
  padding: clamp(26px, 4vw, 52px);
}
.admin-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-header p:last-child {
  color: var(--color-text-muted);
}
.admin-notification,
.admin-security-notice {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 25px;
  padding: 12px 14px;
  border-radius: 11px;
  background: var(--color-warning-soft);
  color: #8b6415;
}
.admin-notification p,
.admin-security-notice p {
  color: inherit;
  font-size: var(--font-caption);
}
.admin-kpi-grid,
.admin-chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}
.admin-kpi-card,
.admin-panel {
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.admin-kpi-card {
  display: grid;
  gap: 7px;
}
.admin-kpi-card__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.admin-kpi-card p,
.admin-kpi-card small {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.admin-kpi-card strong {
  font-size: var(--font-section-title);
}
.admin-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.admin-panel__heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.admin-toolbar {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 22px;
}
.admin-toolbar label {
  min-width: 220px;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}
.admin-toolbar input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}
.admin-toolbar input:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.admin-data-table {
  overflow-x: auto;
  margin-top: 18px;
}
.admin-data-table table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}
.admin-data-table th,
.admin-data-table td {
  padding: 14px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  font-size: var(--font-caption);
}
.admin-data-table th {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.admin-alert-list {
  display: grid;
  gap: 12px;
  margin-top: 26px;
}
.admin-alert-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface);
}
.admin-alert-list__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.admin-alert-list h2,
.admin-alert-list p {
  margin: 0;
}
.admin-alert-list p,
.admin-alert-list small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    min-height: auto;
    padding: 14px 20px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .admin-sidebar nav {
    display: flex;
    overflow-x: auto;
    margin-top: 12px;
  }
  .admin-sidebar nav button {
    flex: none;
  }
  .admin-back-link {
    display: none;
  }
  .admin-kpi-grid,
  .admin-chart-grid {
    grid-template-columns: 1fr;
  }
  .admin-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .admin-toolbar label {
    min-width: 0;
  }
}
</style>

<style scoped>
.admin-alert-list {
  display: grid;
  gap: 12px;
  margin-top: 26px;
}

.admin-alert-list article {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 21px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
}

.admin-alert-list__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--color-warning-soft);
  color: #85651f;
}

.admin-alert-list small {
  color: var(--color-danger);
  font-weight: 800;
}

.admin-alert-list h2 {
  margin-top: 4px;
  font-size: var(--font-item-title);
}

.admin-alert-list p {
  margin-top: 5px;
  font-size: var(--font-caption);
}

@media (max-width: 760px) {
  .admin-alert-list article {
    grid-template-columns: auto 1fr;
  }
}

@media (max-width: 760px) {
  .admin-alert-list .admin-outline-button {
    grid-column: 1 / -1;
  }
}
</style>
