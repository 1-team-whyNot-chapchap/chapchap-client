<script setup>
import { computed, reactive, ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { datePickerPt, selectButtonPt } from '../../../common/constants/primeUiPt'
const open = ref(false)
const form = reactive({
  sourceService: '',
  documentKey: '',
  category: '',
  title: '',
  version: '',
  effectiveFrom: null,
})
const file = ref(null)
const fileError = ref('')
const sampleState = ref('등록 결과 없음')
const statusText = computed(
  () =>
    ({
      '등록 결과 없음': '반환된 등록 ID가 없습니다.',
      '접수 예시': 'UPLOADED · 접수됨 (처리 완료 아님)',
      '실패 예시': 'FAILED · 처리 실패 예시',
    })[sampleState.value],
)
const dirty = computed(() => Boolean(file.value || Object.values(form).some(Boolean)))
function start() {
  Object.assign(form, {
    sourceService: '',
    documentKey: '',
    category: '',
    title: '',
    version: '',
    effectiveFrom: null,
  })
  file.value = null
  fileError.value = ''
  open.value = true
}
function selectFile(event) {
  const selected = event.target.files?.[0]
  file.value = null
  fileError.value = ''
  if (!selected) return
  if (!/\.(pdf|md|txt)$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) {
    fileError.value = 'PDF·MD·TXT 파일을 10MiB 이하로 선택해 주세요.'
    event.target.value = ''
    event.target.setCustomValidity(fileError.value)
    return
  }
  event.target.setCustomValidity('')
  // Only metadata is retained; file bytes are neither read nor transmitted.
  file.value = { name: selected.name, size: selected.size }
}
</script>
<template>
  <AdminFrame title="지식 문서" description="문서 버전 등록 항목과 처리 상태를 확인합니다.">
    <template #actions
      ><button class="button button-primary" @click="start">문서 버전 등록 준비</button></template
    >
    <div class="ops-split">
      <section class="ui-surface ui-stack">
        <h2>등록 결과·처리 상태</h2>
        <p class="ui-muted">
          전체 문서나 버전 목록은 아직 제공하지 않습니다. 실제 등록 결과 ID로 상태를 확인하는
          영역입니다.
        </p>
        <div class="ui-field">
          <span>상태 디자인 예시</span
          ><SelectButton
            v-model="sampleState"
            :options="['등록 결과 없음', '접수 예시', '실패 예시']"
            :allow-empty="false"
            :pt="selectButtonPt"
            aria-label="지식 처리 상태 예시"
          />
        </div>
        <div v-if="sampleState === '등록 결과 없음'" class="ui-empty">
          <h3>아직 등록 결과가 없습니다.</h3>
          <p>문서 버전 등록 항목부터 확인해 주세요.</p>
        </div>
        <dl v-else class="ui-details">
          <div>
            <dt>버전 식별자</dt>
            <dd>예시 표시 · 실제 ID 미발급</dd>
          </div>
          <div>
            <dt>처리 상태</dt>
            <dd>{{ statusText }}</dd>
          </div>
          <div>
            <dt>활성 여부</dt>
            <dd>비활성 예시</dd>
          </div>
          <div>
            <dt>실패 코드</dt>
            <dd>{{ sampleState === '실패 예시' ? '서버 응답 확인 필요' : '없음' }}</dd>
          </div>
        </dl>
        <button class="button button-secondary" disabled>등록 결과 상태 조회 · 연결 전</button>
      </section>
      <aside class="ui-surface ui-stack">
        <h2>등록 전 확인</h2>
        <p>
          PDF·Markdown·텍스트 파일, 최대 10MiB입니다. 등록 접수는 AI 색인 완료를 의미하지 않습니다.
        </p>
        <p>
          공개 재처리·활성화 기능은 제공하지 않습니다. 실패 시 원인과 운영 상태를 확인해야 합니다.
        </p>
      </aside>
    </div>
    <OperationReviewDialog v-model:visible="open" title="문서 버전 등록 준비" :dirty="dirty">
      <div class="ui-grid">
        <label class="ui-field"
          >출처 서비스<input v-model.trim="form.sourceService" maxlength="50" required /></label
        ><label class="ui-field"
          >문서 키<input v-model.trim="form.documentKey" maxlength="100" required
        /></label>
      </div>
      <label class="ui-field"
        >분류<input v-model.trim="form.category" maxlength="40" required /></label
      ><label class="ui-field"
        >문서 제목<input v-model.trim="form.title" maxlength="200" required /></label
      ><label class="ui-field"
        >버전<input v-model.trim="form.version" maxlength="30" required
      /></label>
      <label class="ui-field" for="knowledge-effective"
        >적용일<DatePicker
          v-model="form.effectiveFrom"
          input-id="knowledge-effective"
          date-format="yy.mm.dd"
          :manual-input="false"
          :pt="datePickerPt"
          :required="true"
      /></label>
      <label class="ui-field"
        >원문 파일<input
          type="file"
          accept=".pdf,.md,.txt"
          required
          aria-describedby="knowledge-file-help knowledge-file-error"
          :aria-invalid="Boolean(fileError)"
          @change="selectFile"
        /><small id="knowledge-file-help"
          >PDF/MD/TXT · 최대 10MiB. 파일 내용은 읽거나 업로드하지 않습니다.</small
        ></label
      >
      <p v-if="fileError" id="knowledge-file-error" class="ui-error" role="alert">
        {{ fileError }}
      </p>
      <p v-if="file" class="ops-copy">
        {{ file.name }} · {{ Math.ceil(file.size / 1024) }}KB 선택됨 · 미전송
      </p>
    </OperationReviewDialog>
  </AdminFrame>
</template>
