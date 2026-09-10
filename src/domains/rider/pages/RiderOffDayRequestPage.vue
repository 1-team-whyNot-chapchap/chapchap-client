<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import RiderNavigation from '../components/RiderNavigation.vue'
import { popupDatePickerPt } from '../../../common/constants/primeUiPt'
import '../rider-wire.css'
import { earliestOffDay, isOffDayAllowed, offDayReasons } from '../offDayPolicy'
import http from '../../../common/api/http.js'
import { createRiderScheduleApi } from '../api/riderScheduleApi.js'

const api = createRiderScheduleApi(http)
const offDayCalendarPt = {
  ...popupDatePickerPt,
  panel: 'ui-calendar ui-calendar-popup rider-offday-calendar',
}
const date = ref(null)
const slot = ref('종일')
const reason = ref('연차')
const detail = ref('')
const error = ref('')
const notice = ref('')
const submitting = ref(false)
const minDate = ref(earliestOffDay())
function refreshMinDate() {
  minDate.value = earliestOffDay()
}
async function submit() {
  if (submitting.value) return
  refreshMinDate()
  error.value = ''
  notice.value = ''
  if (!(date.value instanceof Date) || Number.isNaN(date.value.getTime())) {
    error.value = '휴무를 신청할 날짜를 선택해주세요.'
    return
  }
  const key = `${date.value.getFullYear()}-${String(date.value.getMonth() + 1).padStart(2, '0')}-${String(date.value.getDate()).padStart(2, '0')}`
  if (!isOffDayAllowed(date.value)) {
    error.value = '휴무일 5일 전까지만 신청할 수 있습니다. 오늘부터 5일 이후의 날짜를 선택해주세요.'
    return
  }
  if (!offDayReasons.includes(reason.value)) {
    error.value = '신청 사유는 연차, 병가, 기타 중 선택해주세요.'
    return
  }
  if (reason.value === '기타' && !detail.value.trim()) {
    error.value = '기타 사유를 입력해주세요.'
    return
  }
  submitting.value = true
  try {
    await api.createLeaveRequest({
      leaveDate: key,
      leaveSlot: { 종일: 'ALL_DAY', '점심 시간대': 'LUNCH', '저녁 시간대': 'DINNER' }[slot.value],
      leaveType: { 연차: 'ANNUAL_LEAVE', 병가: 'SICK_LEAVE', 기타: 'OTHER' }[reason.value],
      reasonDetail: detail.value.trim() || null,
    })
    notice.value = '휴무 신청을 제출했습니다. 승인 상태는 근무 일정에서 확인해 주세요.'
    date.value = null
    detail.value = ''
  } catch (failure) {
    error.value = failure.message || '휴무 신청을 제출하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="workspace-ui rider-workspace design-review-page rider-wire">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>휴무일 신청</h1>
        <p>휴무 날짜와 시간대를 선택하고 사유를 남겨주세요.</p>
      </div>
    </header>
    <form class="ui-surface rider-wire-form" novalidate @submit.prevent="submit">
      <div class="ui-field">
        <label for="offday-date">휴무 날짜</label
        ><DatePicker
          v-model="date"
          input-id="offday-date"
          date-format="yy-mm-dd"
          :manual-input="false"
          :min-date="minDate"
          aria-describedby="offday-date-policy"
          @show="refreshMinDate"
          :pt="offDayCalendarPt"
          placeholder="날짜 선택"
        />
        <small id="offday-date-policy">휴무일 5일 전까지 신청 가능 · 주말·공휴일 포함</small>
      </div>
      <label class="ui-field" for="offday-slot"
        >시간대<select id="offday-slot" v-model="slot" class="ui-input">
          <option>종일</option>
          <option>점심 시간대</option>
          <option>저녁 시간대</option>
        </select></label
      >
      <label class="ui-field full" for="offday-reason"
        >신청 사유<select id="offday-reason" v-model="reason" class="ui-input">
          <option v-for="item in offDayReasons" :key="item" :value="item">{{ item }}</option>
        </select></label
      >
      <label class="ui-field full" for="offday-detail"
        >상세 사유 (기타 선택 시 필수)<textarea
          id="offday-detail"
          v-model="detail"
          class="ui-input"
          rows="4"
          maxlength="500"
          placeholder="필요한 내용만 간단히 작성해주세요. 민감한 개인정보는 입력하지 마세요."
        />
      </label>
      <p v-if="error" class="full" role="alert">{{ error }}</p>
      <p v-if="notice" class="full ui-note" role="status">{{ notice }}</p>
      <div class="rider-wire-actions full">
        <RouterLink class="button button-secondary" to="/rider/schedule">취소</RouterLink
        ><button class="button button-primary" type="submit" :disabled="submitting">
          {{ submitting ? '신청 중…' : '신청하기' }}
        </button>
      </div>
    </form>
    <RouterLink v-if="notice" class="button button-secondary" to="/rider/schedule">
      근무 일정에서 신청 내역 보기
    </RouterLink>
  </div>
</template>
