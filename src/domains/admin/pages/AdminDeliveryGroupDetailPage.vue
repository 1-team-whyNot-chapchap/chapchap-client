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
const notice = ref('')
const candidates = ref([])
const selectedDeliveryIds = ref([])
const selectedRiderId = ref(null)
const manualReason = ref('OPERATIONAL_ADJUSTMENT')
const manualReasonDetail = ref('')
const manualReasonOptions = [
  { label: '자동 배정 실패', value: 'AUTO_ASSIGNMENT_FAILED' },
  { label: '지연 주문', value: 'LATE_ORDER' },
  { label: '지역 예외', value: 'AREA_EXCEPTION' },
  { label: '운영 조정', value: 'OPERATIONAL_ADJUSTMENT' },
  { label: '기타', value: 'OTHER' },
]
async function load() {
  state.value = 'loading'
  notice.value = ''
  try {
    const [deliveryGroup, riderCandidates] = await Promise.all([
      api.getDeliveryGroup(route.params.deliveryGroupId),
      api.listRiderCandidates(route.params.deliveryGroupId),
    ])
    group.value = deliveryGroup
    candidates.value = riderCandidates.items
    selectedDeliveryIds.value = selectedDeliveryIds.value.filter((deliveryId) =>
      deliveryGroup.deliveries.some((item) => item.deliveryId === deliveryId && !item.assignmentId),
    )
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
const selectedCandidate = () =>
  candidates.value.find((candidate) => candidate.riderId === selectedRiderId.value)
const canManuallyAssign = () => {
  const candidate = selectedCandidate()
  return Boolean(
    candidate &&
    selectedDeliveryIds.value.length &&
    (candidate.isEligible || !candidate.isAreaMatched) &&
    (manualReason.value !== 'OTHER' || manualReasonDetail.value),
  )
}
async function createManualAssignment() {
  if (!canManuallyAssign()) return
  const candidate = selectedCandidate()
  const areaException = !candidate.isAreaMatched
  busy.value = true
  notice.value = ''
  try {
    await api.createManualAssignments(group.value.deliveryGroupId, {
      assignments: [
        {
          riderId: candidate.riderId,
          deliveryIds: selectedDeliveryIds.value,
          areaException,
          reasonCode: areaException ? 'AREA_EXCEPTION' : manualReason.value,
          reasonDetail: manualReasonDetail.value || null,
        },
      ],
    })
    selectedDeliveryIds.value = []
    selectedRiderId.value = null
    manualReasonDetail.value = ''
    await load()
    notice.value = '수동 배정을 완료했습니다.'
  } catch (error) {
    notice.value = error.message || '수동 배정을 완료하지 못했습니다.'
  } finally {
    busy.value = false
  }
}
async function action(method) {
  if (busy.value || !group.value) return
  busy.value = true
  notice.value = ''
  try {
    await api[method](group.value.deliveryGroupId)
    await load()
    notice.value =
      method === 'runAutoAssignment'
        ? '자동 배정을 완료했습니다.'
        : '배송 그룹을 최종 확정했습니다.'
  } catch (error) {
    notice.value = error.message || '배송 그룹 작업을 완료하지 못했습니다.'
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
          <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
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
            <input
              v-if="!item.assignmentId"
              v-model="selectedDeliveryIds"
              :value="item.deliveryId"
              type="checkbox"
              :disabled="busy"
              :aria-label="`${item.deliveryId} 수동 배정 선택`"
            />
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
          <h2>수동 배정</h2>
          <p class="ui-muted">미배정 배송을 선택한 뒤 배정할 라이더를 선택하세요.</p>
          <label class="ui-field"
            >라이더 후보<select v-model.number="selectedRiderId" :disabled="busy">
              <option :value="null">라이더를 선택하세요</option>
              <option
                v-for="candidate in candidates"
                :key="candidate.riderId"
                :value="candidate.riderId"
                :disabled="!candidate.isEligible && candidate.isAreaMatched"
              >
                라이더 {{ candidate.riderId }} · {{ candidate.assignedStopCount }}곳 /
                {{ candidate.assignedLunchboxQuantity }}식{{
                  candidate.isAreaMatched ? '' : ' · 지역 예외'
                }}
              </option>
            </select></label
          >
          <p v-if="selectedCandidate() && !selectedCandidate().isAreaMatched" class="ui-note">
            담당 지역이 일치하지 않아 지역 예외 배정으로 처리됩니다.
          </p>
          <label class="ui-field"
            >배정 사유<select
              v-model="manualReason"
              :disabled="busy || !selectedCandidate()?.isAreaMatched"
            >
              <option
                v-for="option in manualReasonOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select></label
          >
          <label v-if="manualReason === 'OTHER'" class="ui-field"
            >상세 사유<textarea
              v-model.trim="manualReasonDetail"
              rows="3"
              required
              :disabled="busy"
            />
          </label>
          <button
            class="button button-primary"
            :disabled="busy || !canManuallyAssign()"
            @click="createManualAssignment"
          >
            선택한 배송 수동 배정
          </button>
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
