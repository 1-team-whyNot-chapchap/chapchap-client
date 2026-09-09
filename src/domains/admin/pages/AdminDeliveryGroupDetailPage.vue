<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminFrame from '../components/AdminFrame.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import http from '../../../common/api/http.js'
import { createAdminDeliveryAssignmentApi } from '../api/adminDeliveryAssignmentApi.js'
const route = useRoute()
const api = createAdminDeliveryAssignmentApi(http)
const group = ref(null)
const state = ref('loading')
const busy = ref(false)
async function load() {
  state.value = 'loading'
  try {
    group.value = await api.getDeliveryGroup(route.params.deliveryGroupId)
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
async function action(method) {
  busy.value = true
  try {
    await api[method](group.value.deliveryGroupId)
    await load()
  } finally {
    busy.value = false
  }
}
watch(() => route.params.deliveryGroupId, load)
onMounted(load)
</script>
<template>
  <AdminFrame
    title="배송 그룹 상세"
    description="배송 대상과 배정 상태를 확인합니다."
    current="admin-delivery-groups"
  >
    <RouterLink class="ops-link" :to="{ name: 'admin-delivery-groups' }"
      >← 배송 그룹 목록</RouterLink
    >
    <ContentState :state="state" empty-title="배송 그룹을 찾을 수 없습니다." @retry="load">
      <template v-if="group"
        ><section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>배송 그룹 {{ group.deliveryGroupId }}</h2>
            <span class="ops-status">{{ group.status }}</span>
          </div>
          <p>{{ group.deliveryDate }} · {{ group.deliverySlot }}</p>
          <div class="ui-actions">
            <button
              class="button button-secondary"
              :disabled="busy"
              @click="action('runAutoAssignment')"
            >
              자동 배정</button
            ><button
              class="button button-primary"
              :disabled="busy"
              @click="action('confirmDeliveryGroup')"
            >
              최종 확정
            </button>
          </div>
        </section>
        <section class="ui-surface ui-stack">
          <h2>배송 대상</h2>
          <article v-for="item in group.deliveries" :key="item.deliveryId" class="ui-list-item">
            <div>
              <strong>{{ item.deliveryId }}</strong>
              <p>
                {{ item.status }} · {{ item.lunchboxQuantity }}식 · 배정
                {{ item.assignmentId || '미배정' }}
              </p>
            </div>
            <RouterLink
              class="ops-link"
              :to="{ name: 'admin-delivery-detail', params: { deliveryId: item.deliveryId } }"
              >상세</RouterLink
            >
          </article>
        </section>
        <section class="ui-surface ui-stack">
          <h2>배정 현황</h2>
          <p v-for="item in group.assignments" :key="item.assignmentId">
            배정 {{ item.assignmentId }} · 라이더 {{ item.riderId }} · {{ item.status }} ·
            {{ item.stopCount }}곳
          </p>
        </section></template
      >
    </ContentState>
  </AdminFrame>
</template>
