<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import { MapPin } from 'lucide-vue-next'
import { useRiderPreviewStore } from '../riderPreviewStore'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createDeliveryExecutionApi } from '../api/deliveryExecutionApi.js'
const route = useRoute()
const store = useRiderPreviewStore()
const valid = computed(() => route.params.assignmentId === store.assignment.id)
const isIssueOpen = ref(false)
const issue = ref('')
const notice = ref('')
const api = createDeliveryExecutionApi(http)
async function confirm() {
  try {
    await api.acknowledgeAssignment(route.params.assignmentId)
    store.assignment.confirmed = true
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
    isIssueOpen.value = false
    notice.value = '배정 이슈를 보고했습니다.'
    issue.value = ''
  } catch (failure) {
    notice.value = failure.message || '이슈를 보고하지 못했습니다.'
  }
}
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>배정 상세</h1>
        <p>
          {{
            valid
              ? `${store.assignment.date} · ${store.assignment.slot}`
              : '요청한 배정을 확인해 주세요.'
          }}
        </p>
      </div>
    </header>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <DesignPreview title="배정 상세" :allow-empty="false"
      ><div v-if="valid" class="ui-stack">
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>{{ store.assignment.confirmed ? '확인됨' : '배정 내용을 확인하세요.' }}</h2>
            <button
              class="button button-primary"
              :disabled="store.assignment.confirmed"
              @click="confirm"
            >
              배정 확인 시연
            </button>
          </div>
          <p class="ui-muted">기사의 확인과 관리자의 배송 확정은 별도 단계입니다.</p>
        </section>
        <section class="ui-surface">
          <h2>배송 대상 {{ store.deliveries.length }}건</h2>
          <article v-for="delivery in store.deliveries" :key="delivery.id" class="ui-list-item">
            <span class="ui-icon"><MapPin :size="20" aria-hidden="true" /></span>
            <div>
              <h3>{{ delivery.recipient }}</h3>
              <p>{{ delivery.address }}</p>
              <p>{{ delivery.status }}</p>
            </div>
            <RouterLink
              class="button button-secondary"
              :to="{
                name: 'rider-delivery-detail',
                params: { deliveryId: delivery.id },
                query: { assignmentId: store.assignment.id },
              }"
              >배송 상세</RouterLink
            >
          </article>
        </section>
        <div class="ui-actions">
          <button class="button button-secondary" @click="isIssueOpen = true">배정 이슈 보고</button
          ><button class="button button-secondary" disabled>긴급 일괄 실패 · 연결 전</button>
        </div>
      </div>
      <div v-else class="ui-empty">
        <h2>배정을 찾을 수 없어요.</h2>
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
        <p>{{ store.assignment.date }} · {{ store.assignment.slot }} 배정</p>
        <label class="ui-field">이슈 내용<textarea v-model="issue" rows="4" required /></label>
        <p class="ui-muted">예시 입력이며 운영팀에 전송되지 않습니다.</p>
        <button class="button button-primary" type="submit" :disabled="!issue.trim()">
          입력 확인
        </button>
      </form></Dialog
    >
  </div>
</template>
