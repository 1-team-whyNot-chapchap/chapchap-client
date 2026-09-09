<script setup>
import { computed } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import PageShell from '../../../common/layouts/PageShell.vue'

const props = defineProps({ screen: { type: String, default: 'dashboard' } })
const screens = {
  dashboard: ['운영 대시보드', '오늘의 운영 예외와 처리 우선순위를 확인합니다.', '예외 상세'],
  subscriptions: ['구독 관리', '구독 상태와 변경 요청을 확인합니다.', '구독 상세'],
  orders: ['주문 관리', '주문 접수와 배송 준비 상태를 확인합니다.', '주문 상세'],
  payments: ['결제 관리', '결제 상태와 확인이 필요한 항목을 관리합니다.', '결제 상세'],
  refunds: ['환불 관리', '환불 요청과 처리 상태를 확인합니다.', '환불 상세'],
  deliveries: ['배송 운영', '날짜·시간대·상태별 예외 배송을 확인합니다.', '배송 상세'],
  assignments: ['배정 관리', '미배정 배송과 배정 이슈를 우선 처리합니다.', '배정 상세'],
  capacity: ['수용량 관리', '날짜와 시간대별 배송 수용량을 확인합니다.', '수용량 변경'],
  offdays: ['휴무·제외 관리', '라이더의 휴무 신청과 제외 일정을 검토합니다.', '신청 상세'],
  roles: ['역할 관리', '운영 권한과 역할 부여 현황을 확인합니다.', '역할 상세'],
  accounts: ['관리자 계정', '관리자 계정의 상태와 권한을 관리합니다.', '계정 상세'],
  audit: ['감사 로그', '운영 변경 이력과 수행자를 확인합니다.', '로그 상세'],
}
const current = computed(() => screens[props.screen] ?? screens.dashboard)
const tableConfigs = {
  dashboard: {
    columns: [
      ['domain', '영역'],
      ['exception', '예외'],
      ['state', '상태'],
      ['updated', '최근 갱신'],
    ],
    rows: [
      {
        domain: '배송',
        exception: '확인할 예외가 준비되면 표시',
        state: '확인 필요',
        updated: '—',
      },
    ],
  },
  subscriptions: {
    columns: [
      ['id', '구독 ID'],
      ['user', '사용자'],
      ['state', '상태'],
      ['plan', '플랜'],
      ['period', '이용 기간'],
      ['days', '배송 요일'],
      ['payment', '다음 결제'],
      ['delivery', '다음 배송'],
    ],
    rows: [
      {
        id: 'SUB-001',
        user: '사용자 001',
        state: '조회 준비',
        plan: '—',
        period: '—',
        days: '—',
        payment: '—',
        delivery: '—',
      },
    ],
  },
  orders: {
    columns: [
      ['id', '주문 ID'],
      ['subscription', '구독 ID'],
      ['user', '사용자'],
      ['date', '배송일'],
      ['slot', '시간대'],
      ['menu', '메뉴'],
      ['quantity', '수량'],
      ['amount', '금액'],
      ['delivery', 'Delivery 상태'],
      ['state', '주문 상태'],
    ],
    rows: [
      {
        id: 'ORD-001',
        subscription: 'SUB-001',
        user: '사용자 001',
        date: '—',
        slot: '—',
        menu: '—',
        quantity: '—',
        amount: '—',
        delivery: '대기',
        state: '조회 준비',
      },
    ],
  },
  payments: {
    columns: [
      ['id', '결제 ID'],
      ['user', '사용자'],
      ['type', '유형'],
      ['subscription', '대상 구독'],
      ['period', '이용 기간'],
      ['amount', '금액'],
      ['pg', 'PG 상태'],
      ['state', '내부 상태'],
      ['processedAt', '처리 시각'],
    ],
    rows: [
      {
        id: 'PAY-001',
        user: '사용자 001',
        type: '—',
        subscription: 'SUB-001',
        period: '—',
        amount: '—',
        pg: '공개 상태 대기',
        state: '조회 준비',
        processedAt: '—',
      },
    ],
  },
  refunds: {
    columns: [
      ['id', '환불 ID'],
      ['user', '사용자'],
      ['type', '유형'],
      ['payment', '원 결제'],
      ['order', '대상 주문'],
      ['amount', '금액'],
      ['reason', '원인'],
      ['path', '처리 경로'],
      ['state', '상태'],
    ],
    rows: [
      {
        id: 'REF-001',
        user: '사용자 001',
        type: '—',
        payment: 'PAY-001',
        order: 'ORD-001',
        amount: '—',
        reason: '—',
        path: '—',
        state: '조회 준비',
      },
    ],
  },
  deliveries: {
    columns: [
      ['id', '배송 ID'],
      ['order', '주문 ID'],
      ['rider', '기사'],
      ['area', '지역'],
      ['slot', '시간대'],
      ['assignment', '배정 상태'],
      ['state', '배송 상태'],
      ['method', '전달 방식'],
      ['updated', '최종 갱신'],
      ['exception', '예외'],
    ],
    rows: [
      {
        id: 'DLV-001',
        order: 'ORD-001',
        rider: '배정 대기',
        area: '—',
        slot: '—',
        assignment: '미배정',
        state: '준비',
        method: '—',
        updated: '—',
        exception: '확인 필요',
      },
    ],
  },
  assignments: {
    columns: [
      ['slot', '시간대'],
      ['area', '지역'],
      ['orders', '주문 수'],
      ['candidates', '기사 후보'],
      ['rider', '배정 기사'],
      ['confirmation', '기사 확인'],
      ['capacity', '수용량'],
      ['issue', '이슈'],
      ['state', '확정 상태'],
    ],
    rows: [
      {
        slot: '—',
        area: '—',
        orders: '—',
        candidates: '조회 준비',
        rider: '미배정',
        confirmation: '대기',
        capacity: '—',
        issue: '—',
        state: '대기',
      },
    ],
  },
  capacity: {
    columns: [
      ['rider', '기사'],
      ['area', '지역'],
      ['slot', '시간대'],
      ['stops', '방문지 수'],
      ['meals', '도시락 수'],
      ['recommended', '권장 수용량'],
      ['maximum', '최대 수용량'],
      ['usage', '사용률'],
      ['available', '배정 가능'],
    ],
    rows: [
      {
        rider: '조회 준비',
        area: '—',
        slot: '—',
        stops: '—',
        meals: '—',
        recommended: '—',
        maximum: '—',
        usage: '—',
        available: '확인 대기',
      },
    ],
  },
  offdays: {
    columns: [
      ['type', '구분'],
      ['date', '날짜'],
      ['slot', '시간대'],
      ['rider', '라이더'],
      ['reason', '사유'],
      ['state', '상태'],
      ['updated', '최근 갱신'],
    ],
    rows: [
      {
        type: '휴무 신청',
        date: '—',
        slot: '—',
        rider: '조회 준비',
        reason: '—',
        state: '확인 대기',
        updated: '—',
      },
    ],
  },
  roles: {
    columns: [
      ['id', '사용자 ID'],
      ['role', '현재 역할'],
      ['account', '계정 상태'],
      ['updated', '최근 변경'],
      ['state', '관련 처리 상태'],
    ],
    rows: [{ id: 'USR-001', role: '조회 준비', account: '—', updated: '—', state: '확인 대기' }],
  },
  accounts: {
    columns: [
      ['id', '관리자 ID'],
      ['state', '상태'],
      ['locked', '잠금 여부'],
      ['failures', '로그인 실패'],
      ['password', '비밀번호 변경'],
      ['login', '최근 로그인'],
      ['created', '생성일'],
    ],
    rows: [
      {
        id: 'ADM-001',
        state: '조회 준비',
        locked: '—',
        failures: '—',
        password: '—',
        login: '—',
        created: '—',
      },
    ],
  },
  audit: {
    columns: [
      ['time', '시각'],
      ['service', '서비스'],
      ['admin', '관리자'],
      ['action', '행위'],
      ['targetType', '대상 유형'],
      ['targetId', '대상 ID'],
      ['result', '결과'],
      ['requestId', 'Request ID'],
      ['memo', '메모'],
    ],
    rows: [
      {
        time: '—',
        service: '—',
        admin: '조회 준비',
        action: '—',
        targetType: '—',
        targetId: '—',
        result: '확인 대기',
        requestId: '—',
        memo: '—',
      },
    ],
  },
}
const currentTable = computed(() => tableConfigs[props.screen] ?? tableConfigs.dashboard)
const metrics = computed(() => [
  ['처리 대기', props.screen === 'assignments' ? '배정 확인' : '조회 준비'],
  ['주의 필요', props.screen === 'deliveries' ? '배송 예외' : '확인 대기'],
  ['최근 갱신', '—'],
])
</script>

<template>
  <PageShell area="admin">
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ current[0] }}</h1>
          <p>{{ current[1] }}</p>
        </div>
        <button class="button" type="button">{{ current[2] }}</button>
      </header>
      <div class="metrics" aria-label="운영 요약">
        <div v-for="[label, value] in metrics" :key="label">
          <span>{{ label }}</span
          ><strong>{{ value }}</strong>
        </div>
      </div>
      <aside class="exception">
        <span class="status status--warning">확인 필요</span
        ><strong>우선 처리할 예외 2건이 있습니다.</strong
        ><button class="button button--secondary" type="button">예외 보기</button>
      </aside>
      <div class="filters">
        <label
          >기간<select>
            <option>오늘</option>
            <option>이번 주</option>
          </select></label
        ><label
          >상태<select>
            <option>전체 상태</option>
            <option>주의 필요</option>
          </select></label
        ><button class="button button--secondary" type="button">필터 적용</button>
      </div>
      <DataTable :value="currentTable.rows" class="operations-table" responsive-layout="scroll">
        <Column
          v-for="[field, header] in currentTable.columns"
          :key="field"
          :field="field"
          :header="header"
        />
        <Column header="행동">
          <template #body
            ><button class="button button--secondary" type="button">상세</button></template
          >
        </Column>
      </DataTable>
      <aside class="notice notice--warning">상세 처리 전에는 대상과 사유를 확인해 주세요.</aside>
    </section>
  </PageShell>
</template>

<style scoped>
.page {
  width: min(100%, var(--admin-content-width));
}
.page-header h1 {
  font-size: var(--admin-font-page-title);
}
.page-header p,
.filters select,
.operations-table {
  font-size: var(--admin-font-table);
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}
.metrics div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-right: 1px solid var(--color-border);
}
.metrics div:last-child {
  border-right: 0;
}
.metrics span {
  color: var(--color-text-muted);
  font-size: var(--admin-font-helper);
  font-weight: var(--font-weight-bold);
}
.metrics strong {
  font-size: var(--admin-font-metric);
}
.exception {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  border-left: 3px solid var(--color-warning);
  background: var(--color-warning-soft);
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: end;
  margin-bottom: var(--space-4);
}
.filters label {
  display: grid;
  gap: var(--space-2);
  font: var(--font-admin-label);
}
.filters select {
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}
.operations-table {
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.operations-table :deep([data-pc-section='table']) {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
}
.operations-table :deep([data-pc-section='headercell']) {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--admin-font-table);
  font-weight: var(--font-weight-bold);
  text-align: left;
  white-space: nowrap;
}
.operations-table :deep([data-pc-section='bodycell']) {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--admin-font-table);
  line-height: var(--line-height-compact);
  white-space: nowrap;
}
.operations-table :deep([data-pc-section='bodyrow']:last-child [data-pc-section='bodycell']) {
  border-bottom: 0;
}
.operations-table :deep(.button) {
  min-height: 36px;
  padding: var(--space-2) var(--space-3);
  font-size: var(--admin-font-table);
}
.notice {
  margin-top: var(--space-4);
}
@media (max-width: 900px) {
  .metrics {
    grid-template-columns: 1fr;
  }
  .metrics div {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .metrics div:last-child {
    border-bottom: 0;
  }
}
@media (max-width: 560px) {
  .exception {
    align-items: flex-start;
    flex-direction: column;
  }
  .exception .button {
    width: 100%;
  }
}
</style>
