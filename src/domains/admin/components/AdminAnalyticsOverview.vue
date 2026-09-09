<script setup>
import { computed, onMounted, ref } from 'vue'
import Chart from 'primevue/chart'
import { analyticsPreviewDays, summarizeAnalytics } from '../adminAnalyticsPreview'

const period = ref(7)
const root = ref(null)
const palette = ref(null)
const planLabels = ['건강식', '영양식', '든든식']
const statusLabels = ['배송 완료', '배송 중', '배송 준비', '배송 실패']
const regionLabels = ['서초 권역', '강남 권역', '송파 권역']
const days = computed(() => analyticsPreviewDays.slice(-period.value))
const totals = computed(() => summarizeAnalytics(days.value))
const number = (value) => value.toLocaleString('ko-KR')
const percent = (value) =>
  totals.value.orders ? `${((value / totals.value.orders) * 100).toFixed(1)}%` : '—'
const range = computed(() => `${days.value[0].date} ~ ${days.value.at(-1).date}`)
onMounted(() => {
  const style = getComputedStyle(root.value)
  const color = (token) => style.getPropertyValue(token).trim()
  palette.value = {
    primary: color('--color-primary-hover'),
    blue: color('--color-info'),
    orange: color('--color-accent'),
    danger: color('--color-danger'),
    border: color('--color-border'),
    muted: color('--color-text-muted'),
    font: style.fontFamily,
  }
})
const charts = computed(() => {
  if (!palette.value) return []
  const p = palette.value
  const plans = totals.value.plans
  const statuses = totals.value.statuses
  const regions = totals.value.regions
  const distribution = (labels, data, colors) => ({
    labels,
    datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 0 }],
  })
  return [
    {
      id: 'trend',
      title: '일별 주문·배송 추이',
      type: 'line',
      size: 'wide',
      description: '주문일 기준 전체 주문과 그중 배송 완료된 건수',
      data: {
        labels: days.value.map((day) => day.date.slice(5)),
        datasets: [
          {
            label: '전체 주문',
            data: days.value.map((day) => day.orders),
            borderColor: p.primary,
            backgroundColor: p.primary,
            tension: 0.25,
            pointRadius: 3,
          },
          {
            label: '배송 완료',
            data: days.value.map((day) => day.statuses[0]),
            borderColor: p.blue,
            backgroundColor: p.blue,
            borderDash: [5, 4],
            tension: 0.25,
            pointStyle: 'rect',
            pointRadius: 3,
          },
        ],
      },
      headers: ['날짜', '전체 주문', '배송 완료'],
      rows: days.value.map((day) => [day.date, day.orders, day.statuses[0]]),
    },
    {
      id: 'status',
      title: '배송 상태 분포',
      type: 'doughnut',
      size: 'narrow',
      description: '선택 기간 주문의 예시 기준일 현재 상태',
      data: distribution(statusLabels, statuses, [p.primary, p.blue, p.orange, p.danger]),
      headers: ['상태', '건수', '비중'],
      rows: statusLabels.map((label, i) => [label, statuses[i], percent(statuses[i])]),
    },
    {
      id: 'plans',
      title: '플랜별 주문 비중',
      type: 'doughnut',
      size: 'half',
      description: '건강식·영양식·든든식의 주문 구성',
      data: distribution(planLabels, plans, [p.primary, p.blue, p.orange]),
      headers: ['플랜', '건수', '비중'],
      rows: planLabels.map((label, i) => [label, plans[i], percent(plans[i])]),
    },
    {
      id: 'regions',
      title: '권역별 주문량',
      type: 'bar',
      size: 'half',
      description: '배송 권역별 주문 수 비교 · 단위: 건',
      data: {
        labels: regionLabels,
        datasets: [
          {
            label: '주문 수',
            data: regions,
            backgroundColor: [p.primary, p.blue, p.orange],
            borderRadius: 5,
          },
        ],
      },
      headers: ['권역', '건수', '비중'],
      rows: regionLabels.map((label, i) => [label, regions[i], percent(regions[i])]),
    },
  ]
})
function options(chart) {
  const p = palette.value
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: chart.type !== 'bar',
        position: 'bottom',
        labels: {
          color: p.muted,
          usePointStyle: true,
          boxWidth: 10,
          padding: 16,
          font: { family: p.font, size: 12 },
        },
        onClick: () => {},
      },
    },
  }
  if (chart.type === 'doughnut') return { ...common, cutout: '68%' }
  const axis = {
    grid: { color: p.border },
    ticks: { color: p.muted, precision: 0, font: { family: p.font, size: 12 } },
    border: { display: false },
  }
  return {
    ...common,
    indexAxis: chart.type === 'bar' ? 'y' : 'x',
    scales: {
      x: {
        ...axis,
        ...(chart.type === 'bar' ? { beginAtZero: true } : { grid: { display: false } }),
      },
      y: {
        ...axis,
        ...(chart.type === 'line' ? { beginAtZero: true } : { grid: { display: false } }),
      },
    },
  }
}
</script>

<template>
  <section ref="root" class="analytics" aria-labelledby="analytics-title">
    <header class="analytics-heading">
      <div>
        <h2 id="analytics-title">운영 지표 미리보기</h2>
        <p>{{ range }}</p>
      </div>
      <div class="period-switch" role="group" aria-label="분석 기간">
        <button
          v-for="value in [7, 14]"
          :key="value"
          type="button"
          :aria-pressed="period === value"
          @click="period = value"
        >
          {{ value }}일
        </button>
      </div>
    </header>
    <p class="analytics-note">
      그래프용 가상 데이터입니다. 아래 운영 업무 목록과 별도의 예시이며 실시간 실적이 아닙니다.
    </p>
    <dl class="metric-strip" aria-live="polite">
      <div>
        <dt>기간 주문 수</dt>
        <dd>{{ number(totals.orders) }}<small>건</small></dd>
        <span>선택 기간 누적</span>
      </div>
      <div>
        <dt>배송 완료율</dt>
        <dd>{{ percent(totals.statuses[0]) }}</dd>
        <span>완료 {{ number(totals.statuses[0]) }}건 / 전체 주문</span>
      </div>
      <div>
        <dt>배송 실패</dt>
        <dd>{{ number(totals.statuses[3]) }}<small>건</small></dd>
        <span>기간 주문 중 {{ percent(totals.statuses[3]) }}</span>
      </div>
      <div>
        <dt>영양식 주문 비중</dt>
        <dd>{{ percent(totals.plans[1]) }}</dd>
        <span>영양식 {{ number(totals.plans[1]) }}건</span>
      </div>
    </dl>
    <div class="analytics-grid">
      <section
        v-for="chart in charts"
        :key="chart.id"
        class="analytics-panel"
        :class="`analytics-panel--${chart.size}`"
        :aria-labelledby="`analytics-${chart.id}`"
      >
        <header>
          <h3 :id="`analytics-${chart.id}`">{{ chart.title }}</h3>
          <p>{{ chart.description }}</p>
        </header>
        <Chart
          class="analytics-chart"
          :type="chart.type"
          :data="chart.data"
          :options="options(chart)"
          :canvas-props="{
            role: 'img',
            'aria-label': `${chart.title}. 정확한 수치는 아래 데이터 표에서 확인하세요.`,
          }"
        />
        <div v-if="chart.type === 'doughnut'" class="distribution-values">
          <span v-for="row in chart.rows" :key="row[0]"
            >{{ row[0] }} <strong>{{ row[2] }}</strong></span
          >
        </div>
        <details class="analytics-details">
          <summary>{{ chart.title }} 데이터 표</summary>
          <div
            class="analytics-table-wrap"
            role="region"
            :aria-label="`${chart.title} 데이터`"
            tabindex="0"
          >
            <table>
              <caption>
                {{
                  range
                }}
                · 가상 데이터
              </caption>
              <thead>
                <tr>
                  <th v-for="heading in chart.headers" :key="heading" scope="col">{{ heading }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in chart.rows" :key="row[0]">
                  <th scope="row">{{ row[0] }}</th>
                  <td v-for="(value, index) in row.slice(1)" :key="chart.headers[index + 1]">
                    {{ value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  </section>
</template>

<style scoped>
.analytics {
  margin-bottom: var(--space-6);
  min-width: 0;
}
.analytics-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.analytics-heading h2,
.analytics-panel h3 {
  margin: 0;
  font-size: var(--admin-font-section-title);
}
.analytics-heading p,
.analytics-panel p,
.analytics-note {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.analytics-note {
  margin-block: var(--space-3) var(--space-5);
}
.period-switch {
  display: flex;
  border: 1px solid var(--color-border);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}
.period-switch button {
  min-width: 56px;
  min-height: 44px;
  border: 0;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text);
}
.period-switch button[aria-pressed='true'] {
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-weight: var(--font-weight-bold);
}
.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  margin: 0 0 var(--space-5);
}
.metric-strip > div {
  padding: var(--space-5);
  min-width: 0;
}
.metric-strip > div + div {
  border-left: 1px solid var(--color-border);
}
.metric-strip dt,
.metric-strip span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.metric-strip dd {
  margin: var(--space-2) 0;
  font-size: var(--admin-font-metric);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}
.metric-strip small {
  font-size: var(--font-caption);
  margin-left: var(--space-1);
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--space-5);
  align-items: stretch;
}
.analytics-panel {
  min-width: 0;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.analytics-panel--wide {
  grid-column: span 8;
}
.analytics-panel--narrow {
  grid-column: span 4;
}
.analytics-panel--half {
  grid-column: span 6;
}
.analytics-chart {
  position: relative;
  height: 270px;
  min-width: 0;
  margin-top: var(--space-4);
}
.distribution-values {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-3);
  font-size: var(--font-caption);
}
.distribution-values strong {
  margin-left: var(--space-1);
}
.analytics-details {
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.analytics-details summary {
  min-height: 44px;
  align-content: center;
  cursor: pointer;
  font-size: var(--font-caption);
}
.analytics-table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--admin-font-table);
}
caption {
  text-align: left;
  padding-block: var(--space-2);
  color: var(--color-text-muted);
}
th,
td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: right;
  white-space: nowrap;
}
th:first-child {
  text-align: left;
}
@media (max-width: 1100px) {
  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .metric-strip > div:nth-child(3) {
    border-left: 0;
  }
  .metric-strip > div:nth-child(n + 3) {
    border-top: 1px solid var(--color-border);
  }
  .analytics-panel {
    grid-column: span 12;
  }
}
@media (max-width: 480px) {
  .analytics-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .metric-strip {
    grid-template-columns: minmax(0, 1fr);
  }
  .metric-strip > div + div {
    border-left: 0;
    border-top: 1px solid var(--color-border);
  }
  .analytics-panel {
    padding: var(--space-4);
  }
  .analytics-chart {
    height: 250px;
  }
}
</style>
