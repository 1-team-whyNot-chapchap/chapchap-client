<script setup>
import { computed, ref } from 'vue'
import ConfirmDialog from '../../../common/components/feedback/ConfirmDialog.vue'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PageShell from '../../../common/layouts/PageShell.vue'

const completionOpen = ref(false)
const failureOpen = ref(false)
const isDeliveryStarted = ref(false)
const proofFileName = ref('')
const actualDeliveryMethod = ref('')
const actualStorageLocation = ref('')
const pendingMessage = ref('')
const failureSubmitted = ref(false)
const failureDraft = ref({
  reason: '',
  detail: '',
})

const proofRequired = computed(() => ['doorstep', 'other'].includes(actualDeliveryMethod.value))
const failureErrors = computed(() => {
  const errors = []
  if (!failureDraft.value.reason) errors.push('실패 사유를 선택해 주세요.')
  if (!failureDraft.value.detail.trim()) errors.push('상세 설명을 입력해 주세요.')
  return errors
})

function openDialog(type) {
  pendingMessage.value = ''
  if (type === 'completion') completionOpen.value = true
  if (type === 'failure') failureOpen.value = true
}

function openCompletionView() {
  pendingMessage.value = ''
  completionOpen.value = true
}

function startDelivery() {
  isDeliveryStarted.value = true
  pendingMessage.value = '배송을 시작했습니다. 완료 또는 실패 처리를 선택할 수 있습니다.'
}

function onProofSelected(event) {
  proofFileName.value = event.target.files?.[0]?.name ?? ''
  pendingMessage.value = ''
}

function submitCompletion() {
  if (!actualDeliveryMethod.value || !actualStorageLocation.value.trim()) {
    pendingMessage.value = '실제 전달 방식을 선택해 주세요.'
    return
  }
  if (proofRequired.value && !proofFileName.value) {
    pendingMessage.value = '문 앞 또는 기타 보관 전달은 완료 사진이 필요합니다.'
    return
  }
  completionOpen.value = false
  pendingMessage.value = '배송 완료 처리를 등록했습니다.'
}

function submitFailure() {
  failureSubmitted.value = true
  if (failureErrors.value.length) return
  failureOpen.value = false
  pendingMessage.value = '배송 실패 처리를 등록했습니다.'
}
</script>

<template>
  <PageShell area="rider">
    <main v-if="completionOpen" class="execution-page" aria-labelledby="completion-title">
      <header class="execution-page__header">
        <div>
          <h1 id="completion-title">실제 전달 결과를 확인해 주세요</h1>
          <p>실제 전달 방식과 보관 장소를 기록합니다.</p>
        </div>
      </header>
      <section class="execution-summary" aria-label="배송 대상 요약">
        <div class="section-heading">
          <h2>배송 대상</h2>
          <span class="status status--info">배송 중</span>
        </div>
        <dl>
          <div>
            <dt>배송지</dt>
            <dd>강남구 · 주소 ID D-1001</dd>
          </div>
          <div>
            <dt>도시락</dt>
            <dd>도시락 4개</dd>
          </div>
        </dl>
      </section>
      <section class="proof-section">
        <label class="failure-fields__wide"
          >실제 전달 방식<select v-model="actualDeliveryMethod">
            <option value="">선택</option>
            <option value="direct">직접 전달</option>
            <option value="doorstep">문 앞 전달</option>
            <option value="other">기타 보관</option>
          </select></label
        >
        <label class="failure-fields__wide"
          >실제 보관 장소<input v-model="actualStorageLocation" type="text"
        /></label>
        <label v-if="proofRequired" class="proof-input"
          ><span>완료 사진</span
          ><input
            accept="image/jpeg,image/png,image/webp"
            type="file"
            @change="onProofSelected"
          /><small>{{
            proofFileName || '문 앞·기타 보관 전달에는 사진이 필요합니다.'
          }}</small></label
        >
      </section>
      <p v-if="pendingMessage" class="action-help" role="alert">{{ pendingMessage }}</p>
      <footer class="action-section__buttons">
        <button class="button button--secondary" type="button" @click="completionOpen = false">
          이전</button
        ><button class="button" type="button" @click="submitCompletion">배송 완료 확정</button>
      </footer>
    </main>
    <main v-else class="execution-page" aria-labelledby="execution-title">
      <header class="execution-page__header">
        <div>
          <h1 id="execution-title">현재 배송을 처리해 주세요</h1>
          <p>배송 시작 후 완료 또는 실패 처리를 선택할 수 있습니다.</p>
        </div>
        <span class="status status--warning">{{
          isDeliveryStarted ? '배송 중' : '배송 시작 전'
        }}</span>
      </header>

      <StateNotice
        tone="info"
        title="배송 처리 안내"
        message="배송 시작과 완료·실패 처리는 각각 별도의 단계입니다."
      />

      <section class="execution-summary" aria-labelledby="summary-title">
        <div class="section-heading">
          <h2 id="summary-title">수행 정보</h2>
          <span class="status status--info">{{ isDeliveryStarted ? '배송 중' : '배송 대기' }}</span>
        </div>
        <dl>
          <div>
            <dt>배송 시간대</dt>
            <dd>점심</dd>
          </div>
          <div>
            <dt>배송지</dt>
            <dd>강남구 · 주소 ID D-1001</dd>
          </div>
          <div>
            <dt>전달 요청</dt>
            <dd>문 앞 전달</dd>
          </div>
          <div>
            <dt>수령 방식</dt>
            <dd>문 앞 전달</dd>
          </div>
        </dl>
      </section>

      <section class="action-section" aria-labelledby="action-title">
        <div class="section-heading">
          <h2 id="action-title">배송 처리</h2>
          <p>배송 시작 후 실제 전달 결과를 기록합니다.</p>
        </div>
        <div v-if="!isDeliveryStarted" class="action-section__buttons">
          <button class="button" type="button" @click="startDelivery">배송 시작</button>
        </div>
        <div v-else class="action-section__buttons">
          <button
            class="button"
            type="button"
            aria-describedby="completion-help"
            @click="openCompletionView"
          >
            배송 완료
          </button>
          <button class="button button--danger" type="button" @click="openDialog('failure')">
            배송 실패 처리
          </button>
        </div>
        <p id="completion-help" class="action-help">
          {{ '배송 완료를 선택하면 실제 전달 결과와 필요한 증빙을 확인하는 단계로 이동합니다.' }}
        </p>
      </section>

      <StateNotice v-if="pendingMessage" tone="info" title="요청 상태" :message="pendingMessage" />

      <section class="timeline-section" aria-labelledby="timeline-title">
        <h2 id="timeline-title">처리 이력</h2>
        <ol>
          <li>
            <strong>현재 상태</strong
            ><span>{{ isDeliveryStarted ? '배송 중' : '배송 시작 전' }}</span>
          </li>
          <li>
            <strong>증빙 업로드</strong><span>문 앞·기타 보관 전달 시 사진을 첨부합니다.</span>
          </li>
          <li><strong>완료 또는 실패</strong><span>처리한 결과가 배송 이력에 기록됩니다.</span></li>
        </ol>
      </section>

      <ConfirmDialog
        v-model:open="failureOpen"
        title="배송 실패 처리를 요청할까요?"
        description="실패 사유와 필요한 상세 설명을 입력해 주세요."
        confirm-label="배송 실패 처리"
        danger
        @confirm="submitFailure"
      >
        <div v-if="failureSubmitted && failureErrors.length" class="dialog-error" role="alert">
          <p v-for="error in failureErrors" :key="error">{{ error }}</p>
        </div>
        <div class="failure-fields">
          <label>
            실패 사유
            <select v-model="failureDraft.reason">
              <option value="">선택</option>
              <option value="address">배송지 확인 불가</option>
              <option value="recipient">수령 불가</option>
              <option value="safety">안전상 문제</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label class="failure-fields__wide">
            상세 설명
            <textarea
              v-model="failureDraft.detail"
              rows="3"
              placeholder="서버에 전달할 필요한 상황만 작성해 주세요."
            ></textarea>
          </label>
        </div>
      </ConfirmDialog>
    </main>
  </PageShell>
</template>

<style scoped>
.execution-page {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 44px var(--page-padding-desktop) 100px;
}
.execution-page__header,
.section-heading,
.day-condition header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.execution-page__header {
  margin-bottom: 18px;
}
.execution-page__eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.execution-page h1,
.section-heading h2,
.timeline-section h2 {
  margin: 0;
  letter-spacing: -0.04em;
}
.execution-page h1 {
  font-size: var(--font-display);
}
.execution-page__header p:not(.execution-page__eyebrow),
.section-heading p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.execution-summary,
.proof-section,
.action-section,
.timeline-section {
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
}
.execution-summary {
  border-top: 0;
}
.section-heading {
  margin-bottom: 18px;
}
.section-heading h2,
.timeline-section h2 {
  font-size: var(--font-section-title);
}
.execution-summary dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.execution-summary dl div {
  min-width: 0;
  padding: 16px;
  background: var(--color-surface);
}
.execution-summary dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.execution-summary dd {
  margin: 7px 0 0;
  line-height: var(--line-height-body);
}
.proof-input {
  display: grid;
  gap: 8px;
  padding: 18px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  font-weight: 800;
}
.proof-input input {
  max-width: 100%;
  font-weight: 400;
}
.proof-input small,
.proof-status,
.action-help {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.proof-status,
.action-help {
  margin: 12px 0 0;
  font-size: var(--font-body);
}
.action-section__buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.timeline-section ol {
  display: grid;
  gap: 18px;
  padding: 0;
  margin: 18px 0 0;
  list-style: none;
}
.timeline-section li {
  position: relative;
  display: grid;
  gap: 4px;
  padding-left: 24px;
}
.timeline-section li::before {
  position: absolute;
  top: 5px;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  content: '';
}
.timeline-section span {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.dialog-summary {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}
.dialog-summary span {
  color: var(--color-text-muted);
  font-size: var(--font-body);
}
.dialog-error {
  padding: 12px 14px;
  border-left: 4px solid var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.dialog-error p {
  margin: 0;
  line-height: var(--line-height-body);
}
.failure-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.failure-fields label,
.failure-fields fieldset {
  display: grid;
  gap: 7px;
  min-width: 0;
  margin: 0;
  font-size: var(--font-body);
  font-weight: 800;
}
.failure-fields select,
.failure-fields input:not([type='radio']),
.failure-fields textarea {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.failure-fields textarea {
  resize: vertical;
}
.failure-fields__wide {
  grid-column: 1 / -1;
}
.failure-fields fieldset {
  padding: 0;
  border: 0;
}
.failure-fields fieldset label {
  display: flex;
  align-items: center;
  font-weight: 400;
}
.failure-fields input[type='radio'] {
  width: 20px;
  height: 20px;
  margin: 0 8px 0 0;
  accent-color: var(--color-primary);
}
@media (max-width: 768px) {
  .execution-page {
    padding: 28px var(--page-padding-mobile) 96px;
  }
}
@media (max-width: 500px) {
  .execution-page__header,
  .section-heading {
    flex-direction: column;
  }
  .execution-summary dl,
  .action-section__buttons,
  .failure-fields {
    grid-template-columns: 1fr;
  }
  .failure-fields__wide {
    grid-column: auto;
  }
  .action-section__buttons .button {
    width: 100%;
  }
}
</style>
