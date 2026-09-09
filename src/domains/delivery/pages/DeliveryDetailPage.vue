<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PackageCheck, MapPin } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import http from '../../../common/api/http.js'
import { createCustomerDeliveryApi } from '../api/customerDeliveryApi.js'

const route = useRoute()
const router = useRouter()
const api = createCustomerDeliveryApi(http)
const delivery = ref(null)
const state = ref('loading')
const error = ref('')
const photoLoading = ref(false)
let requestId = 0

const statusLabel = (value) =>
  ({ READY: '배송 준비', DELIVERING: '배송 중', DELIVERED: '배송 완료', FAILED: '배송 실패' })[
    value
  ] || value
const slotLabel = (value) => ({ LUNCH: '점심', DINNER: '저녁' })[value] || value
const handoffLabel = (value) =>
  ({ DIRECT: '직접 전달', DOOR: '문 앞 전달', GUARD: '경비실 전달' })[value] || value || '확인 중'

async function loadDelivery() {
  const deliveryId = route.query.deliveryId
  if (!deliveryId) {
    delivery.value = null
    state.value = 'empty'
    return
  }
  const current = ++requestId
  state.value = 'loading'
  error.value = ''
  try {
    const response = await api.get(deliveryId)
    if (current !== requestId) return
    delivery.value = response
    state.value = 'ready'
  } catch (failure) {
    if (current !== requestId) return
    error.value = failure.message
    state.value = 'error'
  }
}

async function openCompletionPhoto() {
  if (!delivery.value?.hasCompletionPhoto || photoLoading.value) return
  photoLoading.value = true
  try {
    const { accessUrl } = await api.getCompletionPhotoAccess(delivery.value.deliveryId)
    window.open(accessUrl, '_blank', 'noopener,noreferrer')
  } catch (failure) {
    error.value = failure.message
  } finally {
    photoLoading.value = false
  }
}

watch(() => route.query.deliveryId, loadDelivery)
onMounted(loadDelivery)
onBeforeUnmount(() => requestId++)
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton label="배송 내역으로" @back="router.push({ name: 'wf-033' })" />
    <header class="ui-heading">
      <div>
        <h1>배송 상세</h1>
        <p>{{ delivery?.deliveryId || '배송 정보를 확인해 주세요.' }}</p>
      </div>
    </header>
    <DesignPreview title="배송 상세" :allow-empty="false">
      <ContentState :state="state" empty-title="배송을 찾을 수 없어요." @retry="loadDelivery">
        <p v-if="state === 'error' && error" class="ui-error" role="alert">{{ error }}</p>
        <div v-if="delivery" class="ui-grid">
          <section class="ui-surface ui-stack">
            <div class="ui-row">
              <h2><PackageCheck :size="22" aria-hidden="true" /> 배송 정보</h2>
              <StatusBadge :status="statusLabel(delivery.status)" />
            </div>
            <dl class="ui-details">
              <div>
                <dt>배송 예정일</dt>
                <dd>{{ delivery.deliveryDate }} · {{ slotLabel(delivery.deliverySlot) }}</dd>
              </div>
              <div>
                <dt>메뉴</dt>
                <dd>
                  {{ delivery.menu?.menuName || '메뉴 정보 없음' }} ·
                  {{ delivery.menu?.quantity || 0 }}개
                </dd>
              </div>
              <div>
                <dt>완료 사진</dt>
                <dd>
                  <button
                    v-if="delivery.hasCompletionPhoto"
                    class="button button-secondary"
                    :disabled="photoLoading"
                    @click="openCompletionPhoto"
                  >
                    {{ photoLoading ? '불러오는 중…' : '완료 사진 보기' }}
                  </button>
                  <span v-else>등록된 사진 없음</span>
                </dd>
              </div>
            </dl>
            <p v-if="delivery.isDelayed" class="ui-note">배송이 지연되었습니다.</p>
          </section>
          <section class="ui-surface ui-stack">
            <h2><MapPin :size="22" aria-hidden="true" /> 수령 정보</h2>
            <dl class="ui-details">
              <div>
                <dt>요청 전달 방식</dt>
                <dd>{{ handoffLabel(delivery.requestedHandoffType) }}</dd>
              </div>
              <div>
                <dt>실제 전달 방식</dt>
                <dd>{{ handoffLabel(delivery.actualHandoffType) }}</dd>
              </div>
              <div>
                <dt>배송 상태 안내</dt>
                <dd>{{ delivery.customerFailureMessage || '특이사항이 없습니다.' }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </ContentState>
    </DesignPreview>
  </div>
</template>
