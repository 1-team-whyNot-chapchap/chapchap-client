<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import '../rider-wire.css'
import http from '../../../common/api/http.js'
import { createDeliveryExecutionApi } from '../api/deliveryExecutionApi.js'
const api = createDeliveryExecutionApi(http)
const assignments = ref([])
const loadError = ref('')
async function load() {
  loadError.value = ''
  try {
    assignments.value = (await api.listAssignments()).items
  } catch (error) {
    assignments.value = []
    loadError.value = error.message || '배정 목록을 불러오지 못했습니다.'
  }
}
onMounted(load)
const quantity = computed(() =>
  assignments.value.reduce((total, item) => total + item.lunchboxQuantity, 0),
)
const stopCount = computed(() =>
  assignments.value.reduce((total, item) => total + item.stopCount, 0),
)
const statusLabel = {
  ASSIGNED: '확인 필요',
  ACKNOWLEDGED: '확인 완료',
  ISSUE_REPORTED: '이슈 보고됨',
  CONFIRMED: '배정 확정',
  REASSIGNED: '재배정됨',
}
const slotLabel = { LUNCH: '점심', DINNER: '저녁' }
const status = computed(() => statusLabel[assignments.value[0]?.status] || '배정 없음')
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page rider-wire">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>오늘의 배송</h1>
        <p>오늘 배정된 배송 목록을 한 번에 확인합니다.</p>
      </div>
      <span class="mini-badge">{{ status }}</span>
    </header>
    <DesignPreview title="오늘의 배송" empty="배정된 배송이 없어요.">
      <dl class="rider-wire-summary">
        <div>
          <dt>방문지</dt>
          <dd>{{ stopCount }}<small>곳</small></dd>
        </div>
        <div>
          <dt>도시락</dt>
          <dd>{{ quantity }}<small>개</small></dd>
        </div>
      </dl>
      <div class="rider-wire-list-heading">
        <h2>배정 목록</h2>
        <p>
          {{
            assignments[0]
              ? `${assignments[0].deliveryDate} · ${slotLabel[assignments[0].deliverySlot]}`
              : '배정 없음'
          }}
        </p>
      </div>
      <section class="rider-wire-assignments" aria-label="배정 목록">
        <div class="rider-wire-table-head">
          <span>순서 / 배송 지역</span><span>전달 방식</span><span>수량</span><span>상세</span>
        </div>
        <article
          v-for="(assignment, index) in assignments"
          :key="assignment.assignmentId"
          class="rider-wire-row"
        >
          <div class="rider-wire-place">
            <strong>{{ index + 1 }} · 배정 {{ assignment.assignmentId }}</strong
            ><small>{{ statusLabel[assignment.status] }}</small>
          </div>
          <span>{{ slotLabel[assignment.deliverySlot] }}</span
          ><strong>{{ assignment.lunchboxQuantity }}개</strong>
          <RouterLink
            class="button button-secondary"
            :to="{
              name: 'rider-assignment-detail',
              params: { assignmentId: assignment.assignmentId },
            }"
            >상세</RouterLink
          >
        </article>
        <p v-if="!assignments.length" class="ui-empty">배정된 배송이 없어요.</p>
      </section>
      <div class="rider-wire-actions">
        <RouterLink class="button button-secondary" to="/rider/issues">이슈 제기</RouterLink>
        <button class="button button-secondary" type="button" @click="load">새로고침</button>
      </div>
      <p v-if="loadError" class="ui-note" role="alert">{{ loadError }}</p>
    </DesignPreview>
  </div>
</template>
