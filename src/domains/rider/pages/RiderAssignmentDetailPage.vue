<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import { MapPin } from 'lucide-vue-next'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createDeliveryExecutionApi } from '../api/deliveryExecutionApi.js'
const route = useRoute()
const assignment = ref(null)
const loading = ref(false)
const isIssueOpen = ref(false)
const issue = ref('')
const notice = ref('')
const api = createDeliveryExecutionApi(http)
const assignmentStatusLabel = {
  ASSIGNED: '배정됨',
  ACKNOWLEDGED: '확인됨',
  ISSUE_REPORTED: '이슈 보고됨',
  CONFIRMED: '확정됨',
  REASSIGNED: '재배정됨',
}
const deliveryStatusLabel = {
  READY: '배송 준비',
  DELIVERING: '배송 중',
  DELIVERED: '배송 완료',
  FAILED: '배송 실패',
}
const slotLabel = { LUNCH: '점심', DINNER: '저녁' }
async function load() {
  loading.value = true
  notice.value = ''
  try {
    assignment.value = await api.getAssignment(route.params.assignmentId)
  } catch (failure) {
    assignment.value = null
    notice.value = failure.message || '배정 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}
async function confirm() {
  try {
    await api.acknowledgeAssignment(route.params.assignmentId)
    await load()
    notice.value = '배정 확인을 저장했습니다.'
  } catch (failure) {
    notice.value = failure.message || '배정 확인을 저장하지 못했습니다.'
  }
}
async function saveIssue() {
  if (!issue.value.trim()) return
  try {
    await api.reportAssignmentIssue(route.params.assignmentId, {
      issueCode: 'OTHER',
      issueDetail: issue.value.trim(),
    })
    await load()
    isIssueOpen.value = false
    notice.value = '배정 이슈를 보고했습니다.'
    issue.value = ''
  } catch (failure) {
    notice.value = failure.message || '이슈를 보고하지 못했습니다.'
  }
}
async function failRemaining() {
  if (!window.confirm('남은 배송을 모두 긴급 실패 처리할까요?')) return
  try {
    await api.failRemainingDeliveries(route.params.assignmentId, {
      failureCode: 'EMERGENCY',
      itemRecovered: false,
    })
    await load()
    notice.value = '남은 배송을 긴급 실패 처리했습니다.'
  } catch (failure) {
    notice.value = failure.message || '긴급 실패 처리를 완료하지 못했습니다.'
  }
}
watch(() => route.params.assignmentId, load)
onMounted(load)
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>배정 상세</h1>
        <p>
          {{
            assignment
              ? `${assignment.deliveryDate} · ${slotLabel[assignment.deliverySlot]}`
              : '요청한 배정을 확인해 주세요.'
          }}
        </p>
      </div>
    </header>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <DesignPreview title="배정 상세" :allow-empty="false"
      ><div v-if="assignment" class="ui-stack">
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>{{ assignmentStatusLabel[assignment.status] }}</h2>
            <button
              class="button button-primary"
              :disabled="assignment.status !== 'ASSIGNED'"
              @click="confirm"
            >
              배정 확인
            </button>
          </div>
          <p class="ui-muted">기사의 확인과 관리자의 배송 확정은 별도 단계입니다.</p>
        </section>
        <section class="ui-surface">
          <h2>배송 대상 {{ assignment.stopCount }}건</h2>
          <article
            v-for="delivery in assignment.deliveries"
            :key="delivery.deliveryId"
            class="ui-list-item"
          >
            <span class="ui-icon"><MapPin :size="20" aria-hidden="true" /></span>
            <div>
              <h3>{{ delivery.recipientName }}</h3>
              <p>{{ delivery.addressLine1 }} {{ delivery.addressLine2 || '' }}</p>
              <p>{{ deliveryStatusLabel[delivery.status] }}</p>
            </div>
            <RouterLink
              class="button button-secondary"
              :to="{
                name: 'rider-delivery-detail',
                params: { deliveryId: delivery.deliveryId },
                query: { assignmentId: assignment.assignmentId },
              }"
              >배송 상세</RouterLink
            >
          </article>
        </section>
        <div class="ui-actions">
          <button class="button button-secondary" @click="isIssueOpen = true">배정 이슈 보고</button
          ><button class="button button-secondary" @click="failRemaining">긴급 일괄 실패</button>
        </div>
      </div>
      <div v-else class="ui-empty">
        <h2>{{ loading ? '배정을 불러오는 중이에요.' : '배정을 찾을 수 없어요.' }}</h2>
        <RouterLink class="button button-primary" to="/rider/deliveries">배정 목록으로</RouterLink>
      </div></DesignPreview
    >
    <Dialog
      v-model:visible="isIssueOpen"
      modal
      :draggable="false"
      header="배정 이슈 보고"
      :pt="dialogPt"
      ><form class="ui-stack" @submit.prevent="saveIssue">
        <p>{{ assignment?.deliveryDate }} · {{ slotLabel[assignment?.deliverySlot] }} 배정</p>
        <label class="ui-field">이슈 내용<textarea v-model="issue" rows="4" required /></label>
        <p class="ui-muted">보고 내용은 운영팀의 배정 이슈 처리 대상으로 등록됩니다.</p>
        <button class="button button-primary" type="submit" :disabled="!issue.trim()">
          이슈 보고
        </button>
      </form></Dialog
    >
  </div>
</template>
