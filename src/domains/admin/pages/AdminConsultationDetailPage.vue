<script setup>
import { computed, ref } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import Dialog from 'primevue/dialog'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { consultations } from '../adminSupportPreview'
import { dialogPt } from '../../../common/constants/primeUiPt'
const route = useRoute()
const chat = computed(() => consultations.find((c) => c.id === route.params.consultationId))
const draft = ref('')
const closeOpen = ref(false)
const leaveOpen = ref(false)
let resolveLeave
onBeforeRouteLeave(() => {
  if (!draft.value.trim()) return true
  leaveOpen.value = true
  return new Promise((resolve) => {
    resolveLeave = resolve
  })
})
function finishLeave(leave) {
  leaveOpen.value = false
  resolveLeave?.(leave)
  resolveLeave = undefined
}
</script>
<template>
  <AdminFrame
    title="상담 처리"
    description="상담 내용과 연결 상태를 확인합니다."
    current="admin-consultations"
  >
    <RouterLink class="ops-link" to="/admin/consultations">← 대기 상담 목록</RouterLink>
    <div v-if="!chat" class="ui-empty">
      <h2>상담을 확인할 수 없습니다.</h2>
      <p>목록에서 예시 상담을 다시 선택해 주세요.</p>
    </div>
    <div v-else class="ops-split">
      <section class="ui-surface ui-stack">
        <div class="ui-row">
          <h2>{{ chat.title }}</h2>
          <span class="ops-status ops-status--warning">미연결</span>
        </div>
        <p>{{ chat.customer }} · {{ chat.id }}</p>
        <p class="ui-note">
          관리자 이력을 아직 조회하지 않았습니다. 이 화면은 실제 상담을 수락한 상태가 아닙니다.
        </p>
        <section class="ops-conversation" aria-label="예시 상담 메시지">
          <article class="ops-message">
            <strong>고객</strong>
            <p>{{ chat.title }}에 대해 문의하고 싶습니다.</p>
            <small>디자인 예시 · 전송된 메시지가 아닙니다.</small>
          </article>
          <p class="ui-muted">실제 메시지 이력과 AI 응답은 연결 후 표시됩니다.</p>
        </section>
        <label class="ui-field"
          >답변 초안<textarea
            v-model="draft"
            maxlength="2000"
            rows="4"
            aria-describedby="chat-draft-help"
            placeholder="서버로 전송되지 않는 미리보기 초안"
          />
        </label>
        <div class="ui-row">
          <small id="chat-draft-help"
            >{{ draft.length }}/2000자 · 연결 전에는 전송할 수 없습니다.</small
          ><button class="button button-primary" disabled>메시지 전송 · 연결 전</button>
        </div>
      </section>
      <aside class="ui-surface ui-stack">
        <h2>상담 종료</h2>
        <p>종료와 AI 요약 처리는 별개입니다. 연결이 끊겨도 메시지를 자동 재전송하지 않습니다.</p>
        <button class="button button-secondary" @click="closeOpen = true">종료 안내 확인</button>
      </aside>
      <OperationReviewDialog v-model:visible="closeOpen" title="상담 종료 검토" :target="chat.title"
        ><p>
          실제 상담은 종료되지 않습니다. 관리자 권한과 최신 상담 상태 확인을 연결한 뒤 종료할 수
          있습니다.
        </p></OperationReviewDialog
      >
    </div>
    <Dialog
      :visible="leaveOpen"
      modal
      :draggable="false"
      header="작성 중인 초안을 닫을까요?"
      :pt="dialogPt"
      @update:visible="finishLeave(false)"
      ><div class="ui-stack">
        <p>아직 전송하지 않은 답변 초안이 있습니다. 나가면 초안은 보관되지 않습니다.</p>
        <div class="ui-actions">
          <button class="button button-secondary" @click="finishLeave(false)">계속 작성</button
          ><button class="button button-danger-outline" @click="finishLeave(true)">
            초안 버리고 나가기
          </button>
        </div>
      </div></Dialog
    >
  </AdminFrame>
</template>
