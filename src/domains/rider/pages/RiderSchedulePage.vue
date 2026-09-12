<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { datePickerPt } from '../../../common/constants/primeUiPt'
import '../rider-wire.css'
import http from '../../../common/api/http.js'
import { createRiderScheduleApi } from '../api/riderScheduleApi.js'
const api = createRiderScheduleApi(http)
const date = ref(new Date(2026, 8, 9))
const schedules = ref([])
const requests = ref([])
const calendarPt = { ...datePickerPt, panel: 'ui-calendar rider-wire-calendar' }
function dateKey(day) {
  return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
}
function stateFor(key) {
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
async function load() {
  const year = date.value.getFullYear()
  const month = String(date.value.getMonth() + 1).padStart(2, '0')
  const last = new Date(year, date.value.getMonth() + 1, 0).getDate()
  const response = await api.getSchedules({
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${last}`,
  })
  schedules.value = response.schedules
  requests.value = await api.listLeaveRequests()
}
watch(date, load)
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
      <DatePicker v-model="date" inline :pt="calendarPt" aria-label="근무 날짜">
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
      <section class="ui-surface rider-wire-history" aria-label="휴무 신청 내역">
        <h2>신청 내역</h2>
        <article
          v-for="request in requests"
          :key="request.leaveRequestId"
          class="rider-wire-history-row"
        >
          <div>
            <strong>{{ request.leaveDate }} · {{ request.leaveSlot }}</strong>
            <p>{{ request.leaveType }}</p>
            <p v-if="request.reasonDetail">{{ request.reasonDetail }}</p>
          </div>
          <span class="mini-badge">{{ request.status }}</span>
        </article>
        <p v-if="!requests.length">신청 내역이 없습니다.</p>
      </section>
    </DesignPreview>
  </div>
</template>
