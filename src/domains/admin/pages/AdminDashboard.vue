<script setup>
import { ref } from 'vue'
import { ArrowUpRight, BellRing, CreditCard, UsersRound } from 'lucide-vue-next'
import Chart from 'primevue/chart'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])

const recentSubscriptions = [
  {
    name: '이서연',
    plan: '영양식',
    nextDelivery: '8월 3일',
    status: '이용 중',
  },
  {
    name: '박민준',
    plan: '든든식',
    nextDelivery: '8월 3일',
    status: '이용 중',
  },
  {
    name: '김하늘',
    plan: '영양식',
    nextDelivery: '8월 5일',
    status: '결제 확인',
  },
]

const signupChartData = ref({
  labels: ['Google', '카카오', '챱챱 회원', '기타'],
  datasets: [
    {
      data: [42, 31, 19, 8],
      backgroundColor: ['#96A75E', '#F28C28', '#6689A3', '#E1E4DC'],
      borderWidth: 0,
    },
  ],
})

const signupChartOptions = ref({
  cutout: '67%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  maintainAspectRatio: false,
})

const revenueChartData = ref({
  labels: ['3월', '4월', '5월', '6월', '7월', '8월'],
  datasets: [
    {
      data: [16, 22, 24, 29, 35, 42],
      backgroundColor: '#96A75E',
      borderRadius: 7,
      borderSkipped: false,
    },
  ],
})

const revenueChartOptions = ref({
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#7B7F75' },
    },
    y: {
      display: false,
      grid: { display: false },
      border: { display: false },
    },
  },
  maintainAspectRatio: false,
})
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin" @navigate="emit('navigate', $event)" />

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <p class="ui-sample"><span class="admin-demo-badge">시연 데이터</span></p>
          <h1>운영 대시보드</h1>
          <p>오늘의 구독·수익·회원 현황을 빠르게 확인합니다.</p>
          <small class="admin-demo-note">
            아래 수치·차트·최근 구독 정보는 화면 검토를 위한 시연 기준이며 실제 운영 데이터가
            아닙니다.
          </small>
        </div>
        <button
          class="admin-notification"
          type="button"
          aria-label="운영 알림"
          @click="emit('navigate', 'admin-notifications')"
        >
          <BellRing :size="20" aria-hidden="true" />
          <span>3</span>
        </button>
      </header>

      <section class="admin-kpi-grid">
        <article class="admin-kpi-card">
          <span class="admin-kpi-card__icon">
            <UsersRound :size="21" aria-hidden="true" />
          </span>
          <p>현재 구독자</p>
          <strong>1,248명</strong>
          <small><ArrowUpRight :size="14" aria-hidden="true" /> 지난달 대비 8.4%</small>
        </article>
        <article class="admin-kpi-card">
          <span class="admin-kpi-card__icon admin-kpi-card__icon--orange">
            <CreditCard :size="21" aria-hidden="true" />
          </span>
          <p>이번 달 수익</p>
          <strong>42,680,000원</strong>
          <small><ArrowUpRight :size="14" aria-hidden="true" /> 지난달 대비 12.1%</small>
        </article>
        <article class="admin-kpi-card">
          <span class="admin-kpi-card__icon admin-kpi-card__icon--blue">
            <UsersRound :size="21" aria-hidden="true" />
          </span>
          <p>전체 회원</p>
          <strong>2,936명</strong>
          <small>이번 달 신규 216명</small>
        </article>
      </section>

      <section class="admin-chart-grid">
        <article class="admin-panel signup-panel">
          <div class="admin-panel__heading">
            <div>
              <h2>가입 경로 분포</h2>
            </div>
            <button type="button">이번 달</button>
          </div>
          <div class="donut-layout">
            <div class="chart-frame chart-frame--donut">
              <Chart type="doughnut" :data="signupChartData" :options="signupChartOptions" />
            </div>
            <ul class="chart-legend">
              <li><span class="legend-dot legend-dot--olive"></span>Google <strong>42%</strong></li>
              <li>
                <span class="legend-dot legend-dot--orange"></span>카카오 <strong>31%</strong>
              </li>
              <li>
                <span class="legend-dot legend-dot--blue"></span>챱챱 회원 <strong>19%</strong>
              </li>
              <li><span class="legend-dot legend-dot--gray"></span>기타 <strong>8%</strong></li>
            </ul>
          </div>
        </article>
        <article class="admin-panel">
          <div class="admin-panel__heading">
            <div>
              <h2>월별 수익 추이</h2>
            </div>
            <strong class="chart-value">4,268만원</strong>
          </div>
          <div class="chart-frame chart-frame--bar">
            <Chart type="bar" :data="revenueChartData" :options="revenueChartOptions" />
          </div>
        </article>
      </section>

      <section class="admin-panel admin-table-panel">
        <div class="admin-panel__heading">
          <div>
            <h2>최근 구독 현황</h2>
          </div>
          <button class="admin-outline-button" type="button" @click="emit('navigate', 'wf-043')">
            전체 보기
          </button>
        </div>
        <DataTable :value="recentSubscriptions" class="admin-data-table">
          <Column field="name" header="회원" />
          <Column field="plan" header="플랜" />
          <Column field="nextDelivery" header="다음 배송" />
          <Column field="status" header="상태" />
        </DataTable>
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
.admin-demo-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  margin-left: 7px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0;
  vertical-align: middle;
}
.admin-demo-note {
  display: block;
  max-width: 620px;
  margin-top: 10px;
  color: var(--color-info);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
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
  outline-offset: -3px;
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
.admin-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 35px;
}

.admin-kpi-card {
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.admin-kpi-card__icon {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.admin-kpi-card__icon--orange {
  background: var(--color-primary-soft);
  color: #a35d13;
}

.admin-kpi-card__icon--blue {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.admin-kpi-card p {
  margin-top: 19px;
  font-size: var(--font-caption);
}

.admin-kpi-card strong {
  display: block;
  margin-top: 6px;
  font-size: var(--font-section-title);
  letter-spacing: -0.04em;
}

.admin-kpi-card small {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 13px;
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 700;
}

.admin-chart-grid {
  display: grid;
  grid-template-columns: 0.92fr 1.28fr;
  gap: 16px;
  margin-top: 17px;
}

.chart-value {
  font-size: var(--font-body);
}

.donut-layout {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  gap: 18px;
  margin-top: 20px;
}

.chart-frame {
  position: relative;
}

.chart-frame--donut {
  height: 150px;
}

.chart-frame--bar {
  height: 210px;
  margin-top: 22px;
}

.chart-legend {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.chart-legend li {
  display: grid;
  grid-template-columns: 9px 1fr auto;
  align-items: center;
  gap: 7px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.chart-legend strong {
  color: var(--color-text);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot--olive {
  background: var(--color-primary);
}

.legend-dot--orange {
  background: var(--color-primary);
}

.legend-dot--blue {
  background: var(--color-info);
}

.legend-dot--gray {
  background: var(--color-disabled);
}

@media (max-width: 760px) {
  .admin-kpi-grid,
  .admin-chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-kpi-grid {
    gap: 10px;
    margin-top: 27px;
  }
}

@media (max-width: 760px) {
  .admin-kpi-card {
    padding: 18px;
  }
}

@media (max-width: 760px) {
  .donut-layout {
    grid-template-columns: 132px 1fr;
  }
}

@media (max-width: 760px) {
  .chart-frame--donut {
    height: 132px;
  }
}

@media (max-width: 1024px) {
  .admin-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .admin-chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .admin-kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
