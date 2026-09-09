<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import DatePicker from 'primevue/datepicker'
import RiderNavigation from '../components/RiderNavigation.vue'
import { useRiderPreviewStore } from '../riderPreviewStore'
import { popupDatePickerPt } from '../../../common/constants/primeUiPt'
import '../rider-wire.css'
import { earliestOffDay, isOffDayAllowed, offDayReasons } from '../offDayPolicy'

const store = useRiderPreviewStore()
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
const minDate = ref(earliestOffDay())
function refreshMinDate() {
  minDate.value = earliestOffDay()
}
function submit() {
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
  if (
    store.offDayRequests.some(
      (item) =>
        item.date === key &&
        (item.slot === '종일' || slot.value === '종일' || item.slot === slot.value),
    )
  ) {
    error.value = '해당 날짜와 시간대에는 이미 휴무 신청 또는 승인 내역이 있습니다.'
    return
  }
  if (reason.value === '기타' && !detail.value.trim()) {
    error.value = '기타 사유를 입력해주세요.'
    return
  }
  store.offDayRequests.unshift({
    id: `preview-${Date.now()}`,
    date: key,
    slot: slot.value,
    reason: reason.value,
    detail: detail.value.trim(),
    status: '신청 중',
  })
  notice.value =
    '예시 신청 내역에 추가했습니다. 실제 신청은 전송되지 않았으며 새로고침하면 초기화됩니다.'
  date.value = null
  detail.value = ''
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
        ><button class="button button-primary" type="submit">신청하기</button>
      </div>
    </form>
    <RouterLink v-if="notice" class="button button-secondary" to="/rider/schedule">
      근무 일정에서 신청 내역 보기
    </RouterLink>
  </div>
</template>
