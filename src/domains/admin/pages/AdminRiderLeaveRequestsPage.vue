<script setup>
import { onMounted, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import http from '../../../common/api/http.js'
import { createAdminRiderManagementApi } from '../api/adminRiderManagementApi.js'
const api = createAdminRiderManagementApi(http)
const rows = ref([])
const state = ref('loading')
async function load() {
  state.value = 'loading'
  try {
    rows.value = (await api.listLeaveRequests()).items
    state.value = rows.value.length ? 'ready' : 'empty'
  } catch {
    state.value = 'error'
  }
}
async function approve(id) {
  if (!window.confirm('휴무 신청을 승인할까요?')) return
  await api.approveLeaveRequest(id)
  await load()
}
async function reject(id) {
  const reason = window.prompt('반려 사유를 입력해 주세요.')
  if (!reason?.trim()) return
  await api.rejectLeaveRequest(id, { reasonDetail: reason.trim() })
  await load()
}
onMounted(load)
</script>
<template>
  <AdminFrame title="라이더 휴무 신청" description="휴무 신청을 검토하고 승인 또는 반려합니다."
    ><ContentState :state="state" empty-title="휴무 신청이 없습니다." @retry="load"
      ><section class="ui-surface ui-stack">
        <article v-for="row in rows" :key="row.leaveRequestId" class="ui-list-item">
          <div>
            <strong>라이더 {{ row.riderId }} · {{ row.leaveDate }} · {{ row.leaveSlot }}</strong>
            <p>{{ row.leaveType }} · {{ row.reasonDetail || '사유 미입력' }} · {{ row.status }}</p>
          </div>
          <div v-if="row.status === 'PENDING'" class="ui-actions">
            <button class="button button-primary" @click="approve(row.leaveRequestId)">승인</button
            ><button class="button button-secondary" @click="reject(row.leaveRequestId)">
              반려
            </button>
          </div>
        </article>
      </section></ContentState
    ></AdminFrame
  >
</template>
