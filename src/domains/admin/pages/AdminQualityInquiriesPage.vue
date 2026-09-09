<script setup>
import { computed, ref, watch } from 'vue'
import SelectButton from 'primevue/selectbutton'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { inquiries, inquiryLabels, inquiryNext } from '../adminSupportPreview'
import { selectButtonPt } from '../../../common/constants/primeUiPt'
const filter = ref('전체')
const selected = ref(null)
const answer = ref('')
const priority = ref('')
const rows = computed(() =>
  inquiries.filter((i) => filter.value === '전체' || inquiryLabels[i.status] === filter.value),
)
const next = computed(() => (selected.value ? inquiryNext[selected.value.status] : null))
const visible = computed({
  get: () => Boolean(selected.value),
  set: (v) => {
    if (!v) selected.value = null
  },
})
watch(selected, (value) => {
  answer.value = ''
  priority.value = value?.priority || ''
})
</script>
<template>
  <AdminFrame
    title="품질 문의 관리"
    description="문의 내용을 읽고 다음 처리 단계와 답변을 검토합니다."
  >
    <SelectButton
      v-model="filter"
      :options="['전체', '접수', '처리 중', '해결', '종료']"
      :allow-empty="false"
      :pt="selectButtonPt"
      aria-label="문의 처리 상태"
    />
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>문의 목록</h2>
        <span class="ui-muted">{{ rows.length }}건</span>
      </div>
      <ul class="ui-list">
        <li v-for="i in rows" :key="i.id" class="ui-list-item">
          <div>
            <span class="ops-status">{{ inquiryLabels[i.status] }}</span>
            <h3>{{ i.title }}</h3>
            <p>{{ i.date }} · {{ i.id }}</p>
          </div>
          <button class="button button-secondary" @click="selected = i">문의 상세·처리</button>
        </li>
        <li v-if="!rows.length" class="ui-empty">
          <h3>해당 상태의 문의가 없습니다.</h3>
          <button class="button button-secondary" @click="filter = '전체'">전체 문의 보기</button>
        </li>
      </ul>
    </section>
    <p class="ui-note">
      문의의 접수 → 처리 중 → 해결 → 종료 순서를 유지합니다. 첨부 열람과 실제 상태 변경은 연결
      전입니다.
    </p>
    <OperationReviewDialog
      v-model:visible="visible"
      title="품질 문의 상세·처리"
      :target="selected?.title || ''"
      :dirty="Boolean(answer || (selected && priority !== selected.priority))"
    >
      <template v-if="selected"
        ><p class="ops-copy">{{ selected.body }}</p>
        <dl class="ui-details">
          <div>
            <dt>현재 상태</dt>
            <dd>{{ inquiryLabels[selected.status] }}</dd>
          </div>
          <div>
            <dt>첨부</dt>
            <dd>{{ selected.attachment || '없음' }}</dd>
          </div>
        </dl>
        <p class="ui-muted">첨부 메타데이터만 표시합니다. 다운로드는 제공하지 않습니다.</p>
        <label class="ui-field"
          >문의 분류<select disabled>
            <option>기타 (OTHER)</option></select
          ><small>주문·상품 식별자 연결 전에는 예시 분류를 변경하지 않습니다.</small></label
        >
        <label class="ui-field">우선순위<input v-model.trim="priority" maxlength="20" /></label>
        <label class="ui-field"
          >검토할 다음 상태<select :value="next" disabled>
            <option :value="next">{{ next ? inquiryLabels[next] : '종료된 문의' }}</option>
          </select></label
        >
        <label class="ui-field"
          >답변 초안 {{ next === 'RESOLVED' ? '(필수)' : '(선택)'
          }}<textarea
            v-model.trim="answer"
            rows="4"
            :required="next === 'RESOLVED'"
            aria-describedby="quality-answer-help"
          /></label
        ><small id="quality-answer-help"
          >해결 상태 검토에는 답변이 필요합니다. 이 창은 실제 상태를 변경하지 않습니다.</small
        >
      </template>
    </OperationReviewDialog>
  </AdminFrame>
</template>
