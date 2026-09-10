<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminFrame from '../components/AdminFrame.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import http from '../../../common/api/http.js'
import { createAdminDeliveryOperationsApi } from '../api/adminDeliveryOperationsApi.js'

const route = useRoute()
const api = createAdminDeliveryOperationsApi(http)
const delivery = ref(null)
const state = ref('loading')
const photoLoading = ref(false)
const failureDetail = ref('')
const recoveryReason = ref('')
const recoveryRiderId = ref('')
async function load() {
  state.value = 'loading'
  try {
    delivery.value = await api.getDelivery(route.params.deliveryId)
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
async function openPhoto() {
  photoLoading.value = true
  try {
    window.open(
      (await api.getCompletionPhotoAccess(delivery.value.deliveryId)).accessUrl,
      '_blank',
      'noopener,noreferrer',
    )
  } finally {
    photoLoading.value = false
  }
}
async function failDelivery() {
  if (!failureDetail.value.trim() || !window.confirm('배송을 실패 처리할까요?')) return
  await api.failDelivery(delivery.value.deliveryId, {
    failureStage: 'BEFORE_DEPARTURE',
    failureCode: 'OTHER',
    failureDetail: failureDetail.value.trim(),
    itemRecovered: false,
    adminReasonCode: 'OTHER',
    adminReasonDetail: failureDetail.value.trim(),
  })
  failureDetail.value = ''
  await load()
}
async function recoverDelivery() {
  if (
    !recoveryReason.value.trim() ||
    !Number(recoveryRiderId.value) ||
    !window.confirm('배송 결과를 실패로 복구할까요?')
  )
    return
  await api.recoverDelivery(delivery.value.deliveryId, {
    recoveryResult: 'FAILED',
    reasonCode: 'OTHER',
    reasonDetail: recoveryReason.value.trim(),
    actualRiderId: Number(recoveryRiderId.value),
    failure: {
      failureStage: 'DURING_DELIVERY',
      failureCode: 'OTHER',
      failureDetail: recoveryReason.value.trim(),
      itemRecovered: false,
    },
  })
  recoveryReason.value = ''
  await load()
}
watch(() => route.params.deliveryId, load)
onMounted(load)
</script>
<template>
  <AdminFrame
    title="관리자 배송 상세"
    description="배송 결과와 처리 이력을 확인합니다."
    current="admin-delivery-groups"
  >
    <RouterLink
      class="ops-link"
      :to="
        delivery ? `/admin/delivery-groups/${delivery.deliveryGroupId}` : '/admin/delivery-groups'
      "
      >← 배송 그룹으로</RouterLink
    >
    <ContentState :state="state" empty-title="배송 대상을 찾을 수 없습니다." @retry="load">
      <div v-if="delivery" class="ops-split">
        <div class="ui-stack">
          <section class="ui-surface ui-stack">
            <div class="ui-row">
              <h2>{{ delivery.menuName }}</h2>
              <span class="ops-status">{{ delivery.status }}</span>
            </div>
            <dl class="ui-details">
              <div>
                <dt>배송 번호</dt>
                <dd>{{ delivery.deliveryId }}</dd>
              </div>
              <div>
                <dt>주문 번호</dt>
                <dd>{{ delivery.orderId }}</dd>
              </div>
              <div>
                <dt>배송 일정</dt>
                <dd>
                  {{ delivery.deliveryDate }} · {{ delivery.deliverySlot }} ·
                  {{ delivery.lunchboxQuantity }}식
                </dd>
              </div>
              <div>
                <dt>요청 전달 방식</dt>
                <dd>{{ delivery.requestedHandoffType }}</dd>
              </div>
            </dl>
          </section>
          <section v-if="delivery.status === 'READY'" class="ui-surface ui-stack">
            <h2>배송 실패 처리</h2>
            <label class="ui-field"
              >처리 사유<textarea v-model.trim="failureDetail" rows="3" />
            </label>
            <button
              class="button button-danger-outline"
              :disabled="!failureDetail"
              @click="failDelivery"
            >
              실패 처리
            </button>
          </section>
          <section v-if="delivery.status === 'FAILED'" class="ui-surface ui-stack">
            <h2>사후 복구</h2>
            <label class="ui-field"
              >실제 라이더 ID<input v-model="recoveryRiderId" type="number" min="1" /></label
            ><label class="ui-field"
              >복구 사유<textarea v-model.trim="recoveryReason" rows="3" /></label
            ><button
              class="button button-secondary"
              :disabled="!recoveryReason || !recoveryRiderId"
              @click="recoverDelivery"
            >
              실패 결과 복구
            </button>
          </section>
          <section class="ui-surface ui-stack">
            <h2>전달 결과·증빙</h2>
            <p v-if="delivery.failure">
              실패 사유:
              {{ delivery.failure.effectiveFailureDetail || delivery.failure.effectiveFailureCode }}
            </p>
            <p v-else-if="delivery.completion">
              완료 방식: {{ delivery.completion.effectiveActualHandoffType }} ·
              {{ delivery.completion.effectiveStorageLocation || '위치 미기록' }}
            </p>
            <p v-else>아직 전달 결과가 없습니다.</p>
            <button
              v-if="delivery.completion?.hasCompletionPhoto"
              class="button button-secondary"
              :disabled="photoLoading"
              @click="openPhoto"
            >
              {{ photoLoading ? '불러오는 중…' : '완료 사진 보기' }}
            </button>
          </section>
          <section class="ui-surface ui-stack">
            <h2>상태 이력</h2>
            <ol class="ops-timeline">
              <li v-for="item in delivery.statusHistories" :key="item.changedAt">
                <strong>{{ item.fromStatus || '생성' }} → {{ item.toStatus }}</strong
                ><time>{{ item.changedAt }}</time>
              </li>
            </ol>
            <p v-if="!delivery.statusHistories?.length" class="ui-muted">상태 이력이 없습니다.</p>
          </section>
        </div>
      </div>
    </ContentState>
  </AdminFrame>
</template>
