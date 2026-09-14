<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Chart from 'primevue/chart'
import http, { authSession } from '../../../common/api/http.js'
import { createAdminAccountApi } from '../api/adminAccountApi.js'
import { createAdminDeliveryOperationsApi } from '../api/adminDeliveryOperationsApi.js'
const api = createAdminAccountApi(http),
  deliveryApi = createAdminDeliveryOperationsApi(http)
const days = ref(30),
  stats = ref(null),
  loading = ref(false),
  error = ref(''),
  operations = ref(null),
  operationError = ref('')
let generation = 0
const providerNames = { KAKAO: '카카오', GOOGLE: '구글' }
const count = (status) => stats.value?.statuses.find((s) => s.label === status)?.count ?? 0
const series = computed(() => ({
  labels: stats.value?.registrations.map((r) => r.date.slice(5)) || [],
  datasets: [
    {
      label: '가입 회원 수',
      data: stats.value?.registrations.map((r) => r.count) || [],
      borderColor: '#758644',
      backgroundColor: '#75864420',
      fill: true,
      tension: 0.2,
    },
  ],
}))
const providers = computed(() => ({
  labels: stats.value?.providers.map((r) => providerNames[r.label] || r.label) || [],
  datasets: [
    {
      data: stats.value?.providers.map((r) => r.count) || [],
      backgroundColor: ['#96a75e', '#7499aa', '#bd9273'],
    },
  ],
}))
const providerTotal = computed(() => stats.value?.providers.reduce((s, r) => s + r.count, 0) || 0)
const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { ticks: { maxTicksLimit: 10 } },
  },
}
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } },
}
const operationNames = {
  autoAssignmentFinalFailure: '자동 배정 실패',
  lateOrderReview: '마감 후 주문 검토',
  acknowledgementOverdue: '기사 응답 지연',
  unresolvedDelivery: '미해결 배송',
  eventPublishFailed: '이벤트 발행 실패',
}
async function load() {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(authSession.state.user?.role)) return
  const request = ++generation
  loading.value = true
  error.value = ''
  stats.value = null
  operations.value = null
  operationError.value = ''
  await Promise.all([
    api
      .overview(Number(days.value))
      .then((r) => {
        if (request === generation) stats.value = r
      })
      .catch(() => {
        if (request === generation) error.value = '회원 통계를 불러오지 못했습니다.'
      }),
    authSession.state.user?.role === 'ADMIN'
      ? deliveryApi
          .getOperationCounts()
          .then((r) => {
            if (request === generation) operations.value = r
          })
          .catch((failure) => {
            if (request === generation)
              operationError.value =
                failure.response?.status === 403
                  ? '현재 계정에 배송 서비스 접근 권한이 없습니다. 배송 접근 프로필을 확인해 주세요.'
                  : '배송 운영 현황을 불러오지 못했습니다.'
          })
      : Promise.resolve(),
  ])
  if (request === generation) loading.value = false
}
watch(
  () => `${authSession.state.user?.userId}:${authSession.state.user?.role}`,
  () => {
    generation++
    stats.value = null
    operations.value = null
    loading.value = false
    load()
  },
)
onMounted(load)
onBeforeUnmount(() => {
  generation++
})
</script>
<template>
  <section class="statistics ui-stack" aria-label="회원 및 운영 통계">
    <div class="stats-toolbar">
      <div>
        <h2>서비스 현황</h2>
        <p class="ui-muted">일반 회원 기준 · 한국 시간</p>
      </div>
      <div class="ui-actions">
        <label class="ui-field"
          >가입 추이 기간<select v-model="days" :disabled="loading" @change="load">
            <option :value="7">최근 7일</option>
            <option :value="30">최근 30일</option>
            <option :value="90">최근 90일</option>
          </select></label
        ><button class="button button-secondary" :disabled="loading" @click="load">새로고침</button>
      </div>
    </div>
    <p v-if="loading" role="status">통계를 불러오고 있습니다.</p>
    <div v-else-if="error" class="ui-note" role="alert">
      {{ error }} <button class="button button-secondary" @click="load">다시 조회</button>
    </div>
    <template v-if="stats">
      <div class="metric-grid">
        <article class="ui-surface">
          <p>전체 회원</p>
          <strong>{{ stats.totalMembers.toLocaleString() }}<small>명</small></strong
          ><span>탈퇴 회원 포함</span>
        </article>
        <article class="ui-surface">
          <p>기간 내 신규 가입</p>
          <strong>{{ stats.newMembers.toLocaleString() }}<small>명</small></strong
          ><span>{{ stats.from }} ~ {{ stats.to }}</span>
        </article>
        <article class="ui-surface">
          <p>활성 회원</p>
          <strong>{{ count('ACTIVE').toLocaleString() }}<small>명</small></strong
          ><span>현재 이용 가능한 회원</span>
        </article>
        <article class="ui-surface">
          <p>탈퇴 회원</p>
          <strong>{{ count('WITHDRAWN').toLocaleString() }}<small>명</small></strong
          ><span>누적 탈퇴 계정</span>
        </article>
      </div>
      <div class="chart-grid">
        <section class="ui-surface ui-stack">
          <h3>일별 가입 추이</h3>
          <p class="ui-muted">가입이 없는 날짜는 0명으로 표시됩니다.</p>
          <Chart
            type="line"
            :data="series"
            :options="lineOptions"
            class="chart"
            aria-label="일별 회원 가입 수 그래프"
          />
          <details>
            <summary>가입 수 표로 보기</summary>
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>가입 회원</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in stats.registrations" :key="r.date">
                    <td>{{ r.date }}</td>
                    <td>{{ r.count }}명</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section class="ui-surface ui-stack">
          <h3>소셜 계정 연결 비율</h3>
          <p class="ui-muted">
            활성 회원의 연결 계정 기준이며 한 회원이 여러 소셜 계정을 연결할 수 있습니다.
          </p>
          <Chart
            v-if="providerTotal"
            type="doughnut"
            :data="providers"
            :options="doughnutOptions"
            class="chart"
            aria-label="소셜 계정 연결 비율 그래프"
          />
          <p v-else class="ui-empty">연결된 소셜 계정이 없습니다.</p>
          <ul>
            <li v-for="r in stats.providers" :key="r.label">
              {{ providerNames[r.label] || r.label }} · {{ r.count }}개 ({{
                providerTotal ? ((r.count / providerTotal) * 100).toFixed(1) : 0
              }}%)
            </li>
          </ul>
        </section>
      </div>
      <p class="ui-muted">
        집계 시각 {{ stats.asOf.replace('T', ' ').slice(0, 19) }} · 관리자 계정은 회원 통계에서
        제외합니다.
      </p>
    </template>
    <section v-if="authSession.state.user?.role === 'ADMIN'" class="ui-surface ui-stack">
      <h3>확인이 필요한 배송 운영</h3>
      <p v-if="operationError" role="alert">
        {{ operationError }}
        <button class="button button-secondary" :disabled="loading" @click="load">다시 조회</button>
      </p>
      <div v-else-if="operations" class="operation-grid">
        <div v-for="(label, key) in operationNames" :key="key">
          <span>{{ label }}</span
          ><strong>{{ operations[key] }}건</strong>
        </div>
      </div>
      <RouterLink to="/admin/delivery-operations" class="ops-link">운영 예외 확인 →</RouterLink>
    </section>
  </section>
</template>
<style scoped>
.statistics {
  margin-bottom: 24px;
}
.stats-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.stats-toolbar .ui-actions {
  align-items: flex-end;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.metric-grid article {
  display: grid;
  gap: 12px;
}
.statistics .metric-grid > .ui-surface,
.statistics .chart-grid > .ui-surface {
  margin: 0;
  align-self: stretch;
}
.metric-grid strong {
  font-size: var(--font-page-title, 28px);
}
.metric-grid small {
  font-size: var(--font-body, 14px);
  margin-left: 6px;
}
.metric-grid span {
  color: var(--color-text-muted);
  font-size: var(--font-caption, 12px);
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.chart {
  height: 260px;
}
.data-table {
  max-height: 240px;
  overflow: auto;
}
table {
  width: 100%;
}
th,
td {
  text-align: left;
  padding: 8px;
}
.operation-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.operation-grid > div {
  display: grid;
  gap: 8px;
}
summary {
  cursor: pointer;
  min-height: 44px;
  padding: 12px 0;
}
@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 420px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
