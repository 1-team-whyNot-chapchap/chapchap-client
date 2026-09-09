<script setup>
import { computed, ref } from 'vue'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import dayjs from 'dayjs'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { selectButtonPt, datePickerPt } from '../../../common/constants/primeUiPt'
const tab = ref('배송 예외')
const date = ref(null)
const type = ref('전체')
const open = ref(false)
const visible = computed(
  () =>
    (!date.value || dayjs(date.value).format('YYYY-MM-DD') === '2026-09-09') &&
    (tab.value === '발행 실패' || type.value !== '배정 이슈'),
)
function reset() {
  date.value = null
  type.value = '전체'
}
</script>
<template>
  <AdminFrame
    title="배송 운영 예외"
    description="배송 문제와 이벤트 발행 실패를 구분해서 확인합니다."
    current="admin-delivery-operations"
  >
    <SelectButton
      v-model="tab"
      :options="['배송 예외', '발행 실패']"
      :allow-empty="false"
      :pt="selectButtonPt"
      aria-label="운영 예외 유형"
    />
    <div class="ops-toolbar">
      <label class="ui-field" for="ops-date"
        >조회 날짜<DatePicker
          v-model="date"
          input-id="ops-date"
          date-format="yy.mm.dd"
          :manual-input="false"
          :pt="datePickerPt"
          placeholder="전체 날짜" /></label
      ><label v-if="tab === '배송 예외'" class="ui-field"
        >유형<select v-model="type">
          <option>전체</option>
          <option>배송 실패</option>
          <option>배정 이슈</option>
        </select></label
      ><button class="button button-secondary" @click="reset">조건 초기화</button>
    </div>
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>{{ tab }} 목록</h2>
        <span class="ui-muted">{{ visible ? 1 : 0 }}건</span>
      </div>
      <div v-if="!visible" class="ui-empty">
        <h3>조건에 맞는 예외가 없습니다.</h3>
        <button class="button button-secondary" @click="reset">전체 조건 보기</button>
      </div>
      <article v-else-if="tab === '배송 예외'" class="ui-list-item">
        <div>
          <span class="ops-status ops-status--danger">배송 실패</span>
          <h3>수령인 2 · 서초 1권역</h3>
          <p>2026.09.09 점심 · 수령인 연락 불가</p>
        </div>
        <RouterLink class="ops-link" to="/admin/deliveries/sample-delivery-2">배송 상세</RouterLink>
      </article>
      <article v-else class="ui-list-item">
        <div>
          <span class="ops-status ops-status--warning">Producer 발행 실패</span>
          <h3>이벤트 기록</h3>
          <p>sample-event-1 · 2026.09.09</p>
          <p>배송 결과와 이벤트 전송 결과는 별도로 관리합니다.</p>
        </div>
        <button class="button button-secondary" @click="open = true">재발행 검토</button>
      </article>
    </section>
    <p class="ui-note">
      이벤트 재발행은 Producer의 실패 기록 단위입니다. Consumer DLT 재처리나 배송 상태 되돌리기를
      제공하지 않습니다.
    </p>
    <OperationReviewDialog
      v-model:visible="open"
      title="이벤트 재발행 검토"
      target="sample-event-1 · Producer 발행 실패"
      ><p>
        선택한 이벤트 기록 1건의 재발행을 검토합니다. 현재는 요청을 전송하지 않습니다.
      </p></OperationReviewDialog
    >
  </AdminFrame>
</template>
