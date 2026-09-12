<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { datePickerPt } from '../../../common/constants/primeUiPt'
import '../rider-wire.css'
import http from '../../../common/api/http.js'
import { createRiderScheduleApi } from '../api/riderScheduleApi.js'
const api = createRiderScheduleApi(http)
const date = ref(new Date())
const schedules = ref([])
const requests = ref([])
const calendarPt = { ...datePickerPt, panel: 'ui-calendar rider-wire-calendar' }
function dateKey(day) {
  return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
}
function stateFor(key) {
  if (loading.value || error.value)
    return { label: loading.value ? '조회 중' : '확인 불가', style: 'unknown' }
  const [year, month, day] = key.split('-').map(Number)
  if (new Date(year, month - 1, day).getDay() === 0) return { label: '휴무', style: 'off' }
  const dayRequests = requests.value.filter((request) => request.leaveDate === key)
  if (dayRequests.some((request) => request.status === 'PENDING'))
    return { label: '신청 중', style: 'pending' }
  if (dayRequests.some((request) => request.status === 'APPROVED'))
    return { label: '휴무', style: 'off' }
  if (schedules.value.some((schedule) => schedule.date === key && schedule.isWorking))
    return { label: '근무', style: 'work' }
  return { label: '미등록', style: 'unknown' }
}
const visibleMonth = ref(new Date())
const loading = ref(false)
const error = ref('')
let requestId = 0
const requestStatuses = {
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '반려',
  CANCELLED: '취소',
}
const leaveSlots = { ALL_DAY: '종일', LUNCH: '점심', DINNER: '저녁' }
const leaveTypes = { ANNUAL_LEAVE: '연차', SICK_LEAVE: '병가', OTHER: '기타' }
async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  schedules.value = []
  requests.value = []
  const year = visibleMonth.value.getFullYear()
  const month = String(visibleMonth.value.getMonth() + 1).padStart(2, '0')
  const last = new Date(year, visibleMonth.value.getMonth() + 1, 0).getDate()
  try {
    const [response, leaves] = await Promise.all([
      api.getSchedules({ dateFrom: `${year}-${month}-01`, dateTo: `${year}-${month}-${last}` }),
      api.listLeaveRequests(),
    ])
    if (id !== requestId) return
    schedules.value = response.schedules
    requests.value = leaves
  } catch {
    if (id === requestId) error.value = '근무 일정을 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (id === requestId) loading.value = false
  }
}
onUnmounted(() => {
  requestId++
})
watch(date, (value) => {
  if (value) {
    visibleMonth.value = value
    load()
  }
})
function changeMonth({ year, month }) {
  visibleMonth.value = new Date(year, month - 1, 1)
  load()
}
onMounted(load)
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page rider-wire">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>근무 일정</h1>
        <p>근무·휴무는 달력에서 확인하고, 휴무 신청은 별도 화면에서 진행합니다.</p>
      </div>
    </header>
    <DesignPreview title="근무 일정" empty="등록된 근무 일정이 없어요.">
      <div class="rider-wire-calendar-action">
        <RouterLink class="button button-primary" to="/rider/off-days/new">휴무일 신청</RouterLink>
      </div>
      <p v-if="loading" role="status">근무 일정을 불러오고 있어요.</p>
      <div v-else-if="error" role="alert" class="ui-note">
        <p>{{ error }}</p>
        <button class="button button-secondary" @click="load">다시 시도</button>
      </div>
      <DatePicker
        v-model="date"
        @month-change="changeMonth"
        inline
        :pt="calendarPt"
        aria-label="근무 날짜"
      >
        <template #date="{ date: day }"
          ><span class="rider-wire-day" :class="stateFor(dateKey(day)).style"
            ><strong>{{ day.day }}</strong
            ><small>{{
              day.otherMonth && new Date(day.year, day.month, day.day).getDay() !== 0
                ? ''
                : stateFor(dateKey(day)).style === 'pending'
                  ? '대기'
                  : stateFor(dateKey(day)).label
            }}</small></span
          ></template
        >
      </DatePicker>
      <div class="rider-wire-legend" aria-label="일정 범례">
        <span>근무일</span><span>휴무일 (일요일 고정)</span><span>대기 (신청 중)</span
        ><span>미등록</span>
      </div>
      <section
        v-if="!loading && !error"
        class="ui-surface rider-wire-history"
        aria-label="휴무 신청 내역"
      >
        <h2>신청 내역</h2>
        <article
          v-for="request in requests"
          :key="request.leaveRequestId"
          class="rider-wire-history-row"
        >
          <div>
            <strong
              >{{ request.leaveDate }} ·
              {{ leaveSlots[request.leaveSlot] || request.leaveSlot }}</strong
            >
            <p>{{ leaveTypes[request.leaveType] || request.leaveType }}</p>
            <p v-if="request.reasonDetail">{{ request.reasonDetail }}</p>
          </div>
          <span class="mini-badge">{{ requestStatuses[request.status] || request.status }}</span>
        </article>
        <p v-if="!requests.length">신청 내역이 없습니다.</p>
      </section>
    </DesignPreview>
  </div>
</template>
