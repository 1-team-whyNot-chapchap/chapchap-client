<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import http from '../../../common/api/http.js'
import { createAdminRiderManagementApi } from '../api/adminRiderManagementApi.js'
import { selectButtonPt, datePickerPt } from '../../../common/constants/primeUiPt'
const route = useRoute()
const api = createAdminRiderManagementApi(http)
const rider = computed(() => ({ id: route.params.riderId, name: `라이더 ${route.params.riderId}` }))
const schedules = ref([])
const exceptions = ref([])
const areas = ref([])
const areaCode = ref('')
async function load() {
  const riderId = route.params.riderId
  schedules.value = await api.listWeeklySchedules(riderId)
  areas.value = await api.listDeliveryAreas(riderId)
  const now = new Date()
  const from = `${now.getFullYear()}-01-01`
  const to = `${now.getFullYear()}-12-31`
  exceptions.value = await api.listScheduleExceptions(riderId, { dateFrom: from, dateTo: to })
}
async function createArea() {
  if (!areaCode.value) return
  await api.createDeliveryArea(route.params.riderId, {
    deliveryAreaCode: areaCode.value,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    isActive: true,
  })
  areaCode.value = ''
  await load()
}
const tab = ref('주간 일정')
const open = ref(false)
const day = ref('월요일')
const slot = ref('점심')
const dates = ref(null)
const reason = ref('')
function openForm() {
  reason.value = ''
  dates.value = null
  open.value = true
}
watch(() => route.params.riderId, load)
onMounted(load)
</script>
<template>
  <AdminFrame
    title="라이더 운영"
    description="배송 그룹에서 선택한 라이더의 일정과 담당 지역을 확인합니다."
    current="admin-delivery-groups"
  >
    <RouterLink
      class="ops-link"
      :to="rider ? '/admin/delivery-groups/' + rider.groupId : '/admin/delivery-groups'"
      >← 배송 그룹으로</RouterLink
    >
    <div v-if="!rider" class="ui-surface ui-empty">
      <h2>라이더를 다시 선택해 주세요.</h2>
      <p>
        기사 정보 조회 연결 전에는 배송 그룹에서 확인한 문맥만 사용할 수 있습니다. 새로고침 후에도
        그룹에서 다시 선택해 주세요.
      </p>
      <RouterLink class="button button-primary" to="/admin/delivery-groups"
        >배송 그룹 보기</RouterLink
      >
    </div>
    <template v-else>
      <section class="ui-surface ui-stack">
        <div class="ui-row">
          <h2>{{ rider.name }}</h2>
          <span class="ops-status">배송 활성</span>
        </div>
        <p>{{ rider.id }}</p>
        <p class="ui-muted">계정 발급과 배송 활성 상태는 별개의 기능입니다.</p>
      </section>
      <section class="ui-surface ui-stack">
        <SelectButton
          v-model="tab"
          :options="['주간 일정', '예외 일정', '담당 지역']"
          :allow-empty="false"
          :pt="selectButtonPt"
          aria-label="라이더 운영 정보"
        />
        <div class="ui-row">
          <h2>{{ tab }}</h2>
          <button class="button button-secondary" @click="openForm">{{ tab }} 검토</button>
        </div>
        <ul v-if="tab === '주간 일정'" class="ui-list">
          <li v-for="d in schedules" :key="d.scheduleId" class="ui-list-item">
            <div>
              <strong>{{ d.dayOfWeek }}요일</strong>
              <p>{{ d.deliverySlot }}</p>
            </div>
          </li>
        </ul>
        <ul v-else-if="tab === '예외 일정'" class="ui-list">
          <li v-for="item in exceptions" :key="item.exceptionId" class="ui-list-item">
            <div>
              <strong>{{ item.scheduleDate }} · {{ item.deliverySlot }}</strong>
              <p>{{ item.isWorking ? '근무' : '휴무' }} · {{ item.reasonCode }}</p>
            </div>
          </li>
          <li v-if="!exceptions.length" class="ui-empty">등록된 예외 일정이 없습니다.</li>
        </ul>
        <template v-else
          ><div class="ui-actions">
            <input v-model.trim="areaCode" class="ui-input" placeholder="담당 지역 코드" /><button
              class="button button-secondary"
              :disabled="!areaCode"
              @click="createArea"
            >
              지역 추가
            </button>
          </div>
          <ul class="ui-list">
            <li v-for="item in areas" :key="item.riderDeliveryAreaId" class="ui-list-item">
              <div>
                <strong>{{ item.deliveryAreaCode }}</strong>
                <p>
                  {{ item.effectiveFrom }} ~ {{ item.effectiveTo || '종료일 없음' }} ·
                  {{ item.isActive ? '활성' : '비활성' }}
                </p>
              </div>
            </li>
            <li v-if="!areas.length" class="ui-empty">담당 지역이 없습니다.</li>
          </ul></template
        >
      </section>
      <aside class="ui-note ui-stack">
        <h2>배송 활성 변경</h2>
        <p>상태 변경은 대상과 현재 배정을 서버에서 확인한 뒤 가능합니다.</p>
        <button class="button button-secondary" disabled>활성 상태 변경 · 연결 전</button>
      </aside>
      <OperationReviewDialog
        v-model:visible="open"
        :title="tab + ' 검토'"
        :target="rider.name"
        :dirty="Boolean(reason || dates)"
      >
        <template v-if="tab === '주간 일정'"
          ><label class="ui-field"
            >요일<select v-model="day">
              <option
                v-for="d in ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일']"
                :key="d"
              >
                {{ d }}
              </option>
            </select></label
          ><label class="ui-field"
            >시간대<select v-model="slot">
              <option>점심</option>
              <option>저녁</option>
            </select></label
          ></template
        >
        <label v-else-if="tab === '예외 일정'" class="ui-field" for="rider-range"
          >예외 기간<DatePicker
            v-model="dates"
            input-id="rider-range"
            selection-mode="range"
            date-format="yy.mm.dd"
            :manual-input="false"
            :pt="datePickerPt"
        /></label>
        <p v-else class="ui-note">
          실제 지역 목록 조회 연결 전입니다. 자유 입력 ID로 지역을 변경하지 않습니다.
        </p>
        <label class="ui-field"
          >검토 사유<textarea v-model.trim="reason" rows="3" required />
        </label>
      </OperationReviewDialog>
    </template>
  </AdminFrame>
</template>
