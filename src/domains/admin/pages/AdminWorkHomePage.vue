<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import { customerApi } from '../../customer/api/customerApi.js'
import { authSession } from '../../../common/api/http.js'
const loading = ref(false),
  error = ref(''),
  waiting = ref(null)
let disposed = false
async function load() {
  if (loading.value || authSession.state.user?.role !== 'ADMIN') return
  loading.value = true
  error.value = ''
  waiting.value = null
  try {
    const rows = await customerApi.consultations(true)
    if (!disposed) waiting.value = rows.length
  } catch {
    if (!disposed) error.value = '대기 상담을 불러오지 못했습니다.'
  } finally {
    if (!disposed) loading.value = false
  }
}
onMounted(load)
onUnmounted(() => {
  disposed = true
})
</script>
<template>
  <AdminFrame
    title="관리자 업무 홈"
    description="담당 업무를 선택하고 실제 처리 목록을 확인하세요."
  >
    <div class="ui-grid work-home-grid">
      <section v-if="authSession.state.user?.role === 'ADMIN'" class="ui-surface ui-stack">
        <h2>배송 운영</h2>
        <p>배정 그룹과 배송 예외는 각 업무 목록에서 확인할 수 있습니다.</p>
        <div class="ui-actions">
          <RouterLink class="button button-primary" to="/admin/delivery-groups"
            >배송 그룹 보기</RouterLink
          ><RouterLink class="button button-secondary" to="/admin/delivery-operations"
            >운영 예외 보기</RouterLink
          >
        </div>
      </section>
      <section v-if="authSession.state.user?.role === 'ADMIN'" class="ui-surface ui-stack">
        <h2>고객지원</h2>
        <p v-if="loading" role="status">대기 상담을 불러오고 있습니다.</p>
        <div v-else-if="error" role="alert">
          <p>{{ error }}</p>
          <button class="button button-secondary" @click="load">다시 조회</button>
        </div>
        <p v-else-if="waiting !== null">대기 상담 {{ waiting }}건</p>
        <div class="ui-actions">
          <RouterLink class="button button-secondary" to="/admin/consultations"
            >대기 상담 보기</RouterLink
          ><RouterLink class="button button-secondary" to="/admin/quality-inquiries"
            >품질 문의 보기</RouterLink
          ><RouterLink class="button button-secondary" to="/admin/knowledge"
            >지식 문서 관리</RouterLink
          >
        </div>
      </section>
    </div>
    <section class="ui-surface ui-stack">
      <h2>계정과 운영 기록</h2>
      <div class="ui-actions">
        <RouterLink class="ops-link" to="/admin/riders">라이더 등록·관리</RouterLink
        ><RouterLink
          v-if="authSession.state.user?.role === 'SUPER_ADMIN'"
          class="ops-link"
          to="/admin/accounts"
          >관리자 계정</RouterLink
        ><RouterLink class="ops-link" to="/admin/audit-logs">감사 이력</RouterLink
        ><RouterLink class="ops-link" to="/admin/password">비밀번호 변경</RouterLink>
      </div>
    </section>
  </AdminFrame>
</template>
<style scoped>
.work-home-grid {
  align-items: stretch;
  margin-bottom: var(--space-6);
}
.work-home-grid > section {
  display: flex;
  flex-direction: column;
}
.work-home-grid .ui-actions {
  margin-top: auto;
}
</style>
