<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AdminFrame from '../components/AdminFrame.vue'
import { auditRows } from '../adminSupportPreview'
import http from '../../../common/api/http.js'
import { createAdminAuditAndIntegrationEventsApi } from '../api/adminAuditAndIntegrationEventsApi.js'
import {
  datePickerPt,
  dialogPt,
  selectButtonPt,
  tableColumnPt,
  paginatorPt,
} from '../../../common/constants/primeUiPt'
const route = useRoute()
const router = useRouter()
const api = createAdminAuditAndIntegrationEventsApi(http)
const deliveryRows = ref([])
const tabs = ['인증·권한', '고객지원', '배송']
const tab = computed({
  get: () => (tabs.includes(String(route.query.tab)) ? String(route.query.tab) : tabs[0]),
  set: (value) => router.replace({ query: { ...route.query, tab: value } }),
})
const filters = reactive(Object.fromEntries(tabs.map((t) => [t, { target: '', dates: null }])))
const selected = ref(null)
const open = computed({
  get: () => Boolean(selected.value),
  set: (v) => {
    if (!v) selected.value = null
  },
})
const rows = computed(() =>
  tab.value === '배송'
    ? deliveryRows.value
    : auditRows[tab.value].filter((r) => {
        const f = filters[tab.value]
        const date = dayjs(r.at)
        return (
          (!f.target || r.target.includes(f.target.trim())) &&
          (!f.dates?.[0] || !date.isBefore(dayjs(f.dates[0]), 'day')) &&
          (!f.dates?.[1] || !date.isAfter(dayjs(f.dates[1]), 'day'))
        )
      }),
)
async function loadDeliveryAudit() {
  if (tab.value !== '배송') return
  const response = await api.listAuditHistories()
  deliveryRows.value = response.items.map((item) => ({
    id: item.auditHistoryId,
    at: item.occurredAt,
    action: item.action,
    target: `${item.entityType} ${item.entityId}`,
    actor: `${item.actorType} ${item.actorId}`,
    result: item.reasonCode || '정상',
    detail: item.reasonDetail || '',
  }))
}
watch(tab, loadDeliveryAudit)
onMounted(loadDeliveryAudit)
function reset() {
  filters[tab.value] = { target: '', dates: null }
}
</script>
<template>
  <AdminFrame
    title="감사 이력"
    description="서비스별 기록을 분리해 작업 대상과 처리 결과를 확인합니다."
  >
    <SelectButton
      v-model="tab"
      :options="tabs"
      :allow-empty="false"
      :pt="selectButtonPt"
      aria-label="감사 서비스"
    />
    <p class="ui-note">
      {{
        tab === '인증·권한'
          ? 'ADMIN 기준 역할 변경 이력만 표시하는 예시입니다. SUPER_ADMIN 전체 이력은 인증 연결 후 구분합니다.'
          : tab === '배송'
            ? '배송 감사는 ADMIN 대상입니다. SUPER_ADMIN의 배송 접근을 허용하는 화면이 아닙니다.'
            : '고객지원 기록만 조회하는 영역입니다. 개인 상담·첨부 원문은 표시하지 않습니다.'
      }}
    </p>
    <div v-if="tab !== '인증·권한'" class="ops-toolbar">
      <label class="ui-field"
        >대상 검색<input
          v-model="filters[tab].target"
          type="search"
          placeholder="대상 식별자" /></label
      ><label v-if="tab === '고객지원'" class="ui-field" for="audit-dates"
        >조회 기간<DatePicker
          v-model="filters[tab].dates"
          input-id="audit-dates"
          selection-mode="range"
          date-format="yy.mm.dd"
          :manual-input="false"
          :pt="datePickerPt" /></label
      ><button class="button button-secondary" @click="reset">조건 초기화</button>
    </div>
    <section class="ui-surface ui-stack audit-records">
      <div class="ui-row">
        <h2>{{ tab }} 기록</h2>
        <span class="ui-muted">{{ rows.length }}건</span>
      </div>
      <div class="ops-desktop ui-table-scroll" tabindex="0" aria-label="감사 기록 표">
        <DataTable
          :key="tab"
          :value="rows"
          data-key="id"
          :paginator="rows.length > 5"
          :rows="5"
          :pt="{ table: 'ui-table', pcPaginator: paginatorPt }"
          ><Column field="at" header="시각" sortable :pt="tableColumnPt" /><Column
            field="action"
            header="작업"
            :pt="tableColumnPt"
          /><Column field="target" header="대상" :pt="tableColumnPt" /><Column
            field="actor"
            header="행위자"
            :pt="tableColumnPt"
          /><Column
            header="확인"
            :pt="{
              ...tableColumnPt,
              headerCell: 'ui-table-cell ui-table-heading audit-action-cell',
              bodyCell: 'ui-table-cell audit-action-cell',
              columnHeaderContent: 'ui-actions audit-action-heading',
            }"
            ><template #body="{ data }"
              ><button class="button button-secondary" @click="selected = data">
                기록 상세
              </button></template
            ></Column
          ><template #empty
            ><p class="ui-empty">조건에 맞는 기록이 없습니다.</p></template
          ></DataTable
        >
      </div>
      <ul class="ui-list ops-mobile">
        <li v-for="r in rows" :key="r.id" class="ui-list-item">
          <div>
            <h3>{{ r.action }}</h3>
            <p>{{ r.at }}</p>
            <p>{{ r.target }}</p>
          </div>
          <button class="button button-secondary" @click="selected = r">기록 상세</button>
        </li>
        <li v-if="!rows.length" class="ui-empty">조건에 맞는 기록이 없습니다.</li>
      </ul>
    </section>
    <Dialog v-model:visible="open" modal :draggable="false" header="감사 기록 상세" :pt="dialogPt"
      ><div v-if="selected" class="ui-stack">
        <dl class="ui-details">
          <div>
            <dt>기록 ID</dt>
            <dd>{{ selected.id }}</dd>
          </div>
          <div>
            <dt>시각</dt>
            <dd>{{ selected.at }}</dd>
          </div>
          <div>
            <dt>작업</dt>
            <dd>{{ selected.action }}</dd>
          </div>
          <div>
            <dt>대상</dt>
            <dd>{{ selected.target }}</dd>
          </div>
          <div>
            <dt>행위자</dt>
            <dd>{{ selected.actor }}</dd>
          </div>
          <div>
            <dt>결과</dt>
            <dd>{{ selected.result }}</dd>
          </div>
        </dl>
        <p class="ops-copy">{{ selected.detail }}</p>
        <button class="button button-secondary" @click="open = false">닫기</button>
      </div></Dialog
    >
  </AdminFrame>
</template>

<style scoped>
.audit-records {
  margin-top: 20px;
}
.audit-records :deep(.audit-action-cell) {
  width: 1%;
  white-space: nowrap;
  text-align: right;
  padding-right: 0;
}
.audit-records :deep(.audit-action-heading) {
  justify-content: flex-end;
  padding-right: 16px;
}
.audit-records :deep(.ui-table-cell) {
  padding-block: 16px;
}
.audit-records .ui-list-item > .button {
  flex-shrink: 0;
  margin-left: auto;
}
.audit-records .ui-list-item > div {
  overflow-wrap: anywhere;
}
</style>
