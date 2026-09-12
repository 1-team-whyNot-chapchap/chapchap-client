<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AdminFrame from '../components/AdminFrame.vue'
import http from '../../../common/api/http.js'
import { createAdminDeliveryAssignmentApi } from '../api/adminDeliveryAssignmentApi.js'
import { popupDatePickerPt, tableColumnPt, paginatorPt } from '../../../common/constants/primeUiPt'
const route = useRoute()
const router = useRouter()
const api = createAdminDeliveryAssignmentApi(http)
const groups = ref([])
const loading = ref(false)
const date = computed({
  get: () =>
    route.query.date && dayjs(String(route.query.date)).isValid()
      ? dayjs(String(route.query.date)).toDate()
      : null,
  set: (value) => setFilter('date', value ? dayjs(value).format('YYYY-MM-DD') : ''),
})
const slot = computed({
  get: () => String(route.query.slot || ''),
  set: (value) => setFilter('slot', value),
})
const status = computed({
  get: () => String(route.query.status || ''),
  set: (value) => setFilter('status', value),
})
const filtered = computed(() => groups.value)
async function load() {
  loading.value = true
  try {
    const response = await api.listDeliveryGroups({
      deliveryDate: route.query.date || undefined,
      deliverySlot: slot.value ? { 점심: 'LUNCH', 저녁: 'DINNER' }[slot.value] : undefined,
      status: status.value || undefined,
    })
    groups.value = response.items.map((item) => ({
      id: item.deliveryGroupId,
      area: `배송 그룹 ${item.deliveryGroupId}`,
      date: item.deliveryDate,
      slot: { LUNCH: '점심', DINNER: '저녁' }[item.deliverySlot] || item.deliverySlot,
      status: item.status,
      count: item.deliveryCount,
      rider: item.unassignedDeliveryCount
        ? `미배정 ${item.unassignedDeliveryCount}건`
        : `배정 완료 ${item.assignedDeliveryCount}건`,
    }))
  } finally {
    loading.value = false
  }
}
function setFilter(key, value) {
  router.replace({ query: { ...route.query, [key]: value || undefined } })
}
function reset() {
  router.replace({ query: route.query.design ? { design: '1' } : {} })
}
function detail(id) {
  return {
    name: 'admin-delivery-group-detail',
    params: { deliveryGroupId: id },
    query: route.query,
  }
}
watch(() => route.query, load, { deep: true })
onMounted(load)
</script>
<template>
  <AdminFrame title="배송 그룹" description="배송일과 시간대별 그룹을 찾아 배정 상태를 확인합니다.">
    <form class="ops-toolbar" @submit.prevent>
      <label class="ui-field" for="group-date"
        >배송일<DatePicker
          v-model="date"
          input-id="group-date"
          date-format="yy.mm.dd"
          :manual-input="false"
          :pt="popupDatePickerPt"
          placeholder="전체 날짜"
      /></label>
      <label class="ui-field"
        >시간대<select v-model="slot">
          <option value="">전체</option>
          <option>점심</option>
          <option>저녁</option>
        </select></label
      >
      <label class="ui-field"
        >상태<select v-model="status">
          <option value="">전체</option>
          <option>배정 전</option>
          <option>확인 대기</option>
          <option>최종 확정</option>
        </select></label
      >
      <button class="button button-secondary" type="button" @click="reset">조건 초기화</button>
    </form>
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>그룹 목록</h2>
        <p class="ui-muted" role="status">{{ filtered.length }}건</p>
      </div>
      <div class="ops-desktop ui-table-scroll" tabindex="0" aria-label="배송 그룹 표">
        <DataTable
          :value="filtered"
          data-key="id"
          :pt="{ table: 'ui-table', pcPaginator: paginatorPt }"
          paginator
          :rows="5"
        >
          <Column field="area" header="배송 그룹" sortable :pt="tableColumnPt"
            ><template #body="{ data }"
              ><RouterLink class="ops-link" :to="detail(data.id)">{{
                data.area
              }}</RouterLink></template
            ></Column
          >
          <Column field="date" header="배송일" sortable :pt="tableColumnPt" /><Column
            field="slot"
            header="시간대"
            :pt="tableColumnPt"
          /><Column field="status" header="상태" :pt="tableColumnPt" /><Column
            field="count"
            header="배송 수"
            :pt="tableColumnPt"
          /><Column field="rider" header="담당 라이더" :pt="tableColumnPt" />
          <template #empty
            ><p class="ui-empty">조건에 맞는 그룹이 없습니다. 조건을 초기화해 주세요.</p></template
          >
        </DataTable>
      </div>
      <ul class="ui-list ops-mobile">
        <li v-for="g in filtered" :key="g.id" class="ui-list-item">
          <div>
            <h3>{{ g.area }}</h3>
            <p>{{ g.date }} · {{ g.slot }} · {{ g.count }}건</p>
            <p>{{ g.rider }}</p>
            <span class="ops-status">{{ g.status }}</span>
          </div>
          <RouterLink class="ops-link" :to="detail(g.id)">그룹 상세</RouterLink>
        </li>
        <li v-if="!filtered.length" class="ui-empty">조건에 맞는 그룹이 없습니다.</li>
      </ul>
    </section>
  </AdminFrame>
</template>
