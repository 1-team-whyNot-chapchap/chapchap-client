<script setup>
import { onMounted, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import http from '../../../common/api/http.js'
import { createAdminRiderManagementApi } from '../api/adminRiderManagementApi.js'

const api = createAdminRiderManagementApi(http)
const riders = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    riders.value = await api.listRiders()
  } catch (cause) {
    error.value = cause.message || '라이더 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminFrame
    title="라이더 일정·지역 관리"
    description="등록된 라이더를 선택하여 근무 일정과 담당 지역을 관리합니다."
    current="admin-rider-operations"
  >
    <section class="ui-surface ui-stack">
      <div class="list-header">
        <div>
          <h2>라이더 목록</h2>
          <p>선택한 라이더의 주간 일정, 예외 일정, 담당 지역을 등록하거나 변경할 수 있습니다.</p>
        </div>
        <button class="button button-secondary" :disabled="loading" @click="load">새로고침</button>
      </div>

      <p v-if="loading" role="status">라이더 목록을 불러오고 있습니다.</p>
      <div v-else-if="error" role="alert" class="ui-stack">
        <p>{{ error }}</p>
        <button class="button button-secondary" @click="load">다시 시도</button>
      </div>
      <p v-else-if="riders.length === 0">등록된 라이더가 없습니다.</p>
      <ul v-else class="rider-list">
        <li v-for="rider in riders" :key="rider.riderId">
          <div>
            <strong>라이더 {{ rider.riderId }}</strong>
            <p>배송 업무 {{ rider.isDeliveryActive ? '활성' : '비활성' }}</p>
          </div>
          <RouterLink
            class="button button-primary"
            :to="{ name: 'admin-rider-operation', params: { riderId: rider.riderId } }"
            >일정·지역 관리</RouterLink
          >
        </li>
      </ul>
    </section>
  </AdminFrame>
</template>

<style scoped>
.list-header,
.rider-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.list-header h2,
.rider-list p {
  margin: 0;
}
.rider-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.rider-list li {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
@media (max-width: 560px) {
  .list-header,
  .rider-list li {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
