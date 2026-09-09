<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import { MapPin, PackageCheck } from 'lucide-vue-next'
import { useRiderPreviewStore } from '../riderPreviewStore'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createDeliveryExecutionApi } from '../api/deliveryExecutionApi.js'
const props = defineProps({ deliveryId: { type: String, required: true } })
const route = useRoute()
const store = useRiderPreviewStore()
const delivery = computed(() =>
  route.query.assignmentId === store.assignment.id
    ? store.deliveries.find((d) => d.id === props.deliveryId)
    : null,
)
const panel = ref('')
const method = ref('')
const place = ref('')
const contacted = ref(false)
const contactedAt = ref('')
const contactResult = ref('')
const photo = ref(null)
const photoError = ref('')
const failure = ref('')
const notice = ref('')
const submitting = ref(false)
const api = createDeliveryExecutionApi(http)
const finished = computed(() => ['배송 완료', '배송 실패'].includes(delivery.value?.status))
const canComplete = computed(
  () =>
    method.value === '직접 전달' ||
    (method.value === '비대면 전달' &&
      place.value.trim() &&
      photo.value &&
      (delivery.value?.method !== '직접 전달' ||
        (contacted.value && contactedAt.value && contactResult.value.trim()))),
)
watch(
  () => route.fullPath,
  () => {
    panel.value = ''
    notice.value = ''
    photo.value = null
  },
)
async function start() {
  if (delivery.value?.status !== '배송 준비') return
  submitting.value = true
  try {
    const response = await api.startDelivery(delivery.value.id)
    delivery.value.status = response.status === 'DELIVERING' ? '배송 중' : response.status
    notice.value = '배송을 시작했습니다.'
  } catch (failure) {
    notice.value = failure.message || '배송을 시작하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
function openComplete() {
  method.value = delivery.value.method
  place.value = ''
  photo.value = null
  photoError.value = ''
  contacted.value = false
  contactedAt.value = ''
  contactResult.value = ''
  panel.value = 'complete'
}
function selectPhoto(event) {
  const file = event.target.files[0]
  photoError.value = ''
  photo.value = null
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    photoError.value = 'JPEG·PNG·WebP 이미지를 선택해 주세요.'
    return
  }
  photo.value = file
}
async function complete() {
  if (!canComplete.value || delivery.value?.status !== '배송 중') return
  submitting.value = true
  try {
    const response = await api.completeDelivery(
      delivery.value.id,
      {
        actualHandoffType: method.value === '직접 전달' ? 'DIRECT' : 'DOORSTEP',
        storageLocation: place.value.trim() || null,
        contactAttemptedAt: contactedAt.value ? new Date(contactedAt.value).toISOString() : null,
        contactResult: contactResult.value ? 'CONTACTED' : null,
      },
      photo.value,
    )
    delivery.value.status = response.status === 'DELIVERED' ? '배송 완료' : response.status
    panel.value = ''
    photo.value = null
    notice.value = '배송 완료 처리가 저장되었습니다.'
  } catch (failure) {
    notice.value = failure.message || '배송 완료를 처리하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
async function fail() {
  if (!failure.value.trim() || finished.value) return
  submitting.value = true
  try {
    await api.failDelivery(delivery.value.id, {
      failureStage: 'DURING_DELIVERY',
      failureCode: 'OTHER',
      failureDetail: failure.value.trim(),
      itemRecovered: false,
    })
    delivery.value.status = '배송 실패'
    panel.value = ''
    failure.value = ''
    notice.value = '배송 실패 처리가 저장되었습니다.'
  } catch (requestFailure) {
    notice.value = requestFailure.message || '배송 실패를 처리하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>라이더 배송 상세</h1>
        <p>{{ delivery ? delivery.recipient : '배정에서 배송을 다시 선택해 주세요.' }}</p>
      </div>
      <span v-if="delivery" class="mini-badge">{{ delivery.status }}</span>
    </header>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <DesignPreview title="라이더 배송" :allow-empty="false"
      ><div v-if="delivery" class="ui-stack">
        <section class="ui-surface ui-stack">
          <h2 class="ui-actions"><MapPin :size="22" aria-hidden="true" />수령 정보</h2>
          <dl class="ui-details">
            <div>
              <dt>주소</dt>
              <dd>{{ delivery.address }}</dd>
            </div>
            <div>
              <dt>수령 방식</dt>
              <dd>{{ delivery.method }}</dd>
            </div>
            <div>
              <dt>요청사항</dt>
              <dd>{{ delivery.request }}</dd>
            </div>
            <div>
              <dt>배송일</dt>
              <dd>{{ store.assignment.date }} · {{ store.assignment.slot }}</dd>
            </div>
          </dl>
        </section>
        <section class="ui-surface ui-stack">
          <h2>배송 처리</h2>
          <p class="ui-muted">실제 실행 가능 여부는 배정 확정과 서버 상태 확인 후 결정됩니다.</p>
          <button
            v-if="delivery.status === '배송 준비'"
            class="button button-primary"
            :disabled="submitting"
            @click="start"
          >
            배송 시작 시연</button
          ><button
            v-else-if="delivery.status === '배송 중'"
            class="button button-primary"
            @click="openComplete"
          >
            <PackageCheck :size="18" aria-hidden="true" />배송 완료 입력
          </button>
          <button v-if="!finished" class="button button-secondary" @click="panel = 'failure'">
            배송 실패 입력
          </button>
          <p v-else class="ui-note">예시 처리가 끝났어요. 배정 상세에서 다른 배송을 확인하세요.</p>
        </section>
        <RouterLink
          class="button button-secondary"
          :to="`/rider/assignments/${store.assignment.id}`"
          >배정 상세로</RouterLink
        >
      </div>
      <div v-else class="ui-empty">
        <h2>해당 배정의 배송을 찾을 수 없어요.</h2>
        <RouterLink class="button button-primary" to="/rider/deliveries"
          >배정 목록에서 선택</RouterLink
        >
      </div></DesignPreview
    >
    <Dialog
      :visible="panel === 'complete'"
      modal
      :draggable="false"
      header="배송 완료 확인"
      :pt="dialogPt"
      @update:visible="panel = ''"
    >
      <form class="ui-stack" @submit.prevent="complete">
        <p>{{ delivery?.recipient }} · {{ delivery?.address }}</p>
        <label class="ui-field"
          >전달 방식<select v-model="method">
            <option>직접 전달</option>
            <option>비대면 전달</option>
          </select></label
        >
        <template v-if="method === '비대면 전달'"
          ><label class="ui-field">보관 위치<textarea v-model="place" rows="2" required /></label
          ><label class="ui-field"
            >완료 사진 (필수)<input
              type="file"
              class="completion-photo-input"
              accept=".jpg,.jpeg,.png,.webp"
              required
              @change="selectPhoto"
          /></label>
          <p v-if="photo" class="ui-muted">{{ photo.name }} · 업로드하지 않음</p>
          <p v-if="photoError" class="ui-error" role="alert">{{ photoError }}</p>
          <label v-if="delivery?.method === '직접 전달'" class="ui-field"
            >연락 시도 시각<input v-model="contactedAt" type="datetime-local" required
          /></label>
          <label v-if="delivery?.method === '직접 전달'" class="ui-field"
            >연락 결과<input v-model="contactResult" required placeholder="예: 응답 없음"
          /></label>
          <label v-if="delivery?.method === '직접 전달'" class="ui-check"
            ><input v-model="contacted" type="checkbox" required />연락을 시도했으나 직접 전달할 수
            없었어요.</label
          ></template
        >
        <p class="ui-muted">
          실제 처리 시 사진·보관 위치·연락 결과를 서버에서 검증합니다. 현재는 입력 배치만
          확인합니다.
        </p>
        <button class="button button-primary" type="submit" :disabled="!canComplete || submitting">
          완료 반영
        </button>
      </form>
    </Dialog>
    <Dialog
      :visible="panel === 'failure'"
      modal
      :draggable="false"
      header="배송 실패 확인"
      :pt="dialogPt"
      @update:visible="panel = ''"
      ><form class="ui-stack" @submit.prevent="fail">
        <p>{{ delivery?.recipient }} · {{ delivery?.address }}</p>
        <label class="ui-field">실패 사유<textarea v-model="failure" rows="4" required /></label>
        <p class="ui-muted">실제 고객 알림이나 후속 처리는 실행하지 않습니다.</p>
        <button
          class="button button-primary"
          type="submit"
          :disabled="!failure.trim() || submitting"
        >
          실패 반영
        </button>
      </form></Dialog
    >
  </div>
</template>

<style scoped>
.ui-field .completion-photo-input {
  width: 100%;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-weight: 400;
  text-overflow: ellipsis;
}
.completion-photo-input::file-selector-button {
  min-height: 44px;
  margin-right: 12px;
  padding: 10px 16px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.completion-photo-input:focus-visible {
  outline: 2px solid var(--color-primary-hover);
  outline-offset: 3px;
}
@media (hover: hover) {
  .completion-photo-input::file-selector-button:hover {
    background: var(--color-primary);
  }
}
</style>
