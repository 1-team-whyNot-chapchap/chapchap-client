<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import AdminFrame from '../components/AdminFrame.vue'
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
const areaEndDates = ref({})
const weeklyDay = ref(1)
const weeklySlot = ref('LUNCH')
const exceptionDate = ref(new Date())
const exceptionSlot = ref('LUNCH')
const exceptionWorking = ref(false)
const exceptionReason = ref('OTHER')
const exceptionDetail = ref('')
const actionError = ref('')
const weekdayOptions = [
  { label: '월요일', value: 1 },
  { label: '화요일', value: 2 },
  { label: '수요일', value: 3 },
  { label: '목요일', value: 4 },
  { label: '금요일', value: 5 },
  { label: '토요일', value: 6 },
  { label: '일요일', value: 7 },
]
const slotOptions = [
  { label: '점심', value: 'LUNCH' },
  { label: '저녁', value: 'DINNER' },
]
const reasonOptions = [
  { label: '연차', value: 'ANNUAL_LEAVE' },
  { label: '병가', value: 'SICK_LEAVE' },
  { label: '교육', value: 'TRAINING' },
  { label: '대체 근무', value: 'SUBSTITUTE_WORK' },
  { label: '기타', value: 'OTHER' },
]
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
  actionError.value = ''
  if (!areaCode.value) return
  try {
    await api.createDeliveryArea(route.params.riderId, {
      deliveryAreaCode: areaCode.value,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isActive: true,
    })
    areaCode.value = ''
    await load()
  } catch (error) {
    actionError.value = error.message || '담당 지역을 추가하지 못했습니다.'
  }
}
const toIsoDate = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
async function createWeeklySchedule() {
  actionError.value = ''
  try {
    await api.createWeeklySchedule(route.params.riderId, {
      dayOfWeek: weeklyDay.value,
      deliverySlot: weeklySlot.value,
    })
    await load()
  } catch (error) {
    actionError.value = error.message || '주간 일정을 등록하지 못했습니다.'
  }
}
async function deleteWeeklySchedule(scheduleId) {
  if (!window.confirm('이 주간 일정을 삭제할까요?')) return
  actionError.value = ''
  try {
    await api.deleteWeeklySchedule(route.params.riderId, scheduleId)
    await load()
  } catch (error) {
    actionError.value = error.message || '주간 일정을 삭제하지 못했습니다.'
  }
}
async function createScheduleException() {
  actionError.value = ''
  if (!exceptionDate.value) {
    actionError.value = '예외 적용일을 선택해 주세요.'
    return
  }
  if (exceptionReason.value === 'OTHER' && !exceptionDetail.value) {
    actionError.value = '기타 사유의 상세 내용을 입력해 주세요.'
    return
  }
  try {
    await api.createScheduleException(route.params.riderId, {
      scheduleDate: toIsoDate(exceptionDate.value),
      deliverySlot: exceptionSlot.value,
      isWorking: exceptionWorking.value,
      reasonCode: exceptionReason.value,
      reasonDetail: exceptionDetail.value || null,
    })
    exceptionDetail.value = ''
    await load()
  } catch (error) {
    actionError.value = error.message || '예외 일정을 등록하지 못했습니다.'
  }
}
async function deleteScheduleException(item) {
  if (item.leaveRequestId) return
  if (!window.confirm('이 예외 일정을 삭제할까요?')) return
  actionError.value = ''
  try {
    await api.deleteScheduleException(route.params.riderId, item.exceptionId)
    await load()
  } catch (error) {
    actionError.value = error.message || '예외 일정을 삭제하지 못했습니다.'
  }
}
async function updateDeliveryArea(item) {
  actionError.value = ''
  try {
    await api.updateDeliveryArea(route.params.riderId, item.riderDeliveryAreaId, {
      effectiveTo: areaEndDates.value[item.riderDeliveryAreaId] || item.effectiveTo || null,
      isActive: item.isActive,
    })
    await load()
  } catch (error) {
    actionError.value = error.message || '담당 지역을 변경하지 못했습니다.'
  }
}
const tab = ref('주간 일정')
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
        </div>
        <p v-if="actionError" class="ui-note" role="alert">{{ actionError }}</p>
        <template v-if="tab === '주간 일정'">
          <form class="ui-actions" @submit.prevent="createWeeklySchedule">
            <select v-model="weeklyDay" class="ui-input" aria-label="근무 요일">
              <option v-for="option in weekdayOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <select v-model="weeklySlot" class="ui-input" aria-label="배송 시간대">
              <option v-for="option in slotOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button class="button button-secondary">일정 추가</button>
          </form>
          <ul class="ui-list">
            <li v-for="d in schedules" :key="d.scheduleId" class="ui-list-item">
              <div>
                <strong>{{
                  weekdayOptions.find((option) => option.value === d.dayOfWeek)?.label
                }}</strong>
                <p>{{ slotOptions.find((option) => option.value === d.deliverySlot)?.label }}</p>
              </div>
              <button
                class="button button-danger-outline"
                @click="deleteWeeklySchedule(d.scheduleId)"
              >
                삭제
              </button>
            </li>
            <li v-if="!schedules.length" class="ui-empty">등록된 주간 일정이 없습니다.</li>
          </ul>
        </template>
        <template v-else-if="tab === '예외 일정'">
          <form class="ui-stack" @submit.prevent="createScheduleException">
            <div class="ui-actions">
              <DatePicker
                v-model="exceptionDate"
                date-format="yy.mm.dd"
                :manual-input="false"
                :pt="datePickerPt"
              />
              <select v-model="exceptionSlot" class="ui-input" aria-label="예외 시간대">
                <option v-for="option in slotOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <select v-model="exceptionWorking" class="ui-input" aria-label="근무 여부">
                <option :value="false">휴무</option>
                <option :value="true">근무</option>
              </select>
            </div>
            <div class="ui-actions">
              <select v-model="exceptionReason" class="ui-input" aria-label="예외 사유">
                <option v-for="option in reasonOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input
                v-model.trim="exceptionDetail"
                class="ui-input"
                placeholder="상세 사유 (기타는 필수)"
              />
              <button class="button button-secondary">예외 일정 추가</button>
            </div>
          </form>
          <ul class="ui-list">
            <li v-for="item in exceptions" :key="item.exceptionId" class="ui-list-item">
              <div>
                <strong
                  >{{ item.scheduleDate }} ·
                  {{
                    slotOptions.find((option) => option.value === item.deliverySlot)?.label
                  }}</strong
                >
                <p>
                  {{ item.isWorking ? '근무' : '휴무' }} ·
                  {{ reasonOptions.find((option) => option.value === item.reasonCode)?.label
                  }}{{ item.reasonDetail ? ` · ${item.reasonDetail}` : '' }}
                </p>
              </div>
              <span v-if="item.leaveRequestId" class="ui-muted">휴무 신청 연동</span>
              <button
                v-else
                class="button button-danger-outline"
                @click="deleteScheduleException(item)"
              >
                삭제
              </button>
            </li>
            <li v-if="!exceptions.length" class="ui-empty">등록된 예외 일정이 없습니다.</li>
          </ul>
        </template>
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
              <div class="ui-stack">
                <strong>{{ item.deliveryAreaCode }}</strong>
                <p>
                  {{ item.effectiveFrom }} ~ {{ item.effectiveTo || '종료일 없음' }} ·
                  {{ item.isActive ? '활성' : '비활성' }}
                </p>
                <div class="ui-actions">
                  <label class="ui-field"
                    >종료일<input
                      v-model="areaEndDates[item.riderDeliveryAreaId]"
                      class="ui-input"
                      type="date"
                  /></label>
                  <label class="ui-field"
                    ><input v-model="item.isActive" type="checkbox" /> 활성</label
                  >
                  <button class="button button-secondary" @click="updateDeliveryArea(item)">
                    저장
                  </button>
                </div>
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
    </template>
  </AdminFrame>
</template>
