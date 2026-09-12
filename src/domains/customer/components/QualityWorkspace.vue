<script setup>
import FilePicker from '../../../common/components/forms/FilePicker.vue'
import { displayDateTime } from '../../../common/utils/displayDate.js'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerApi as api } from '../api/customerApi.js'
import { useCustomerRequest } from '../useCustomerRequest.js'
import RequestStatus from './RequestStatus.vue'
const props = defineProps({ admin: Boolean, create: Boolean, detail: Boolean })
const route = useRoute(),
  router = useRouter()
const { busy, error, notice, run } = useCustomerRequest()
const rows = ref([]),
  selected = ref(null),
  files = ref([])
const types = {
  OTHER: '기타',
  DAMAGED: '파손',
  MISSING: '누락',
  QUALITY: '상품 품질',
  DELIVERY: '배송',
}
const states = { RECEIVED: '접수', IN_PROGRESS: '처리 중', RESOLVED: '답변 완료', CLOSED: '종료' }
const next = { RECEIVED: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED' }
const form = reactive({
  inquiryType: 'OTHER',
  content: '',
  orderId: '',
  productId: '',
  deliveryId: '',
})
const answer = ref('')
const needsProduct = computed(() => ['DAMAGED', 'MISSING', 'QUALITY'].includes(form.inquiryType))
const loadSelected = async (id) => {
  selected.value = await api.inquiry(id, props.admin)
  answer.value = selected.value.adminAnswer || ''
}
const reload = () =>
  run(async () => {
    if (props.create) return
    if (props.detail) await loadSelected(route.params.qualityInquiryId)
    else rows.value = await api.inquiries(props.admin)
  })
function selectFiles(event) {
  const chosen = [...event.target.files]
  if (
    chosen.some(
      (f) =>
        !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type) ||
        f.size > 10 * 1024 * 1024,
    ) ||
    chosen.reduce((n, f) => n + f.size, 0) > 11 * 1000 * 1000
  ) {
    error.value = 'JPEG·PNG·WebP·PDF 파일당 10MiB, 합계 11MB 이내로 선택해 주세요.'
    files.value = []
    event.target.value = ''
    return
  }
  error.value = ''
  files.value = chosen
}
async function submit() {
  await run(async () => {
    const data = new FormData()
    data.append('inquiryType', form.inquiryType)
    data.append('content', form.content.trim())
    if (form.inquiryType !== 'OTHER') data.append('orderId', form.orderId)
    if (needsProduct.value) data.append('productId', form.productId)
    if (form.inquiryType === 'DELIVERY') data.append('deliveryId', form.deliveryId)
    files.value.forEach((file) => data.append('attachments', file))
    const result = await api.createInquiry(data)
    await router.push({
      name: 'inquiry-detail',
      params: { qualityInquiryId: result.qualityInquiryId },
    })
  })
}
function process() {
  run(async () => {
    selected.value = await api.processInquiry(selected.value.qualityInquiryId, {
      inquiryType: selected.value.inquiryType,
      priority: selected.value.priority,
      status: next[selected.value.status],
      adminAnswer: answer.value,
    })
    rows.value = await api.inquiries(true)
    notice.value = '처리 상태를 저장했습니다.'
  })
}
watch(
  () => route.params.qualityInquiryId,
  () => {
    selected.value = null
    reload()
  },
)
onMounted(reload)
</script>
<template>
  <section class="ui-stack">
    <RequestStatus :busy="busy" :error="error" :notice="notice" />
    <div class="ui-actions ui-actions--end">
      <RouterLink v-if="!admin" class="button button-secondary" to="/help/inquiries"
        >문의 목록</RouterLink
      ><RouterLink
        v-if="!admin && !create"
        class="button button-primary ui-action-end"
        to="/help/inquiries/new"
        >문의 작성</RouterLink
      ><button v-if="!create" class="button button-secondary" :disabled="busy" @click="reload">
        새로고침
      </button>
    </div>
    <form v-if="create" class="ui-surface ui-stack" @submit.prevent="submit">
      <fieldset :disabled="busy" class="ui-stack" style="border: 0; padding: 0">
        <label class="ui-field"
          >문의 유형<select v-model="form.inquiryType">
            <option
              v-for="(label, key) in types"
              :key="key"
              :value="key"
              :disabled="key !== 'OTHER'"
            >
              {{ label }}
            </option>
          </select></label
        >
        <label v-if="form.inquiryType !== 'OTHER'" class="ui-field"
          >주문 번호<input
            v-model="form.orderId"
            required
            pattern="[1-9][0-9]*"
            inputmode="numeric"
        /></label>
        <label v-if="needsProduct" class="ui-field"
          >상품 번호<input
            v-model="form.productId"
            required
            pattern="[1-9][0-9]*"
            inputmode="numeric"
        /></label>
        <label v-if="form.inquiryType === 'DELIVERY'" class="ui-field"
          >배송 번호<input v-model="form.deliveryId" required maxlength="64"
        /></label>
        <label class="ui-field"
          >문의 내용<textarea v-model="form.content" required rows="6" />
        </label>
        <FilePicker
          v-model="files"
          label="첨부 파일"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hint="JPEG·PNG·WebP·PDF · 파일당 10MiB, 합계 11MB"
          :disabled="busy"
          @change="selectFiles"
        />
        <p class="ui-muted">
          현재 기타 문의를 접수할 수 있습니다. 첨부 파일은 문의와 함께 전송됩니다.
        </p>
        <button class="button button-primary ui-action-end" :disabled="!form.content.trim()">
          문의 접수
        </button>
      </fieldset>
    </form>
    <ul v-if="!create && !detail" class="ui-list">
      <li v-for="row in rows" :key="row.qualityInquiryId" class="ui-list-item">
        <div>
          <h2>{{ types[row.inquiryType] }} 문의 #{{ row.qualityInquiryId }}</h2>
          <p>{{ states[row.status] }} · {{ displayDateTime(row.createdAt) }}</p>
        </div>
        <button
          v-if="admin"
          class="button button-secondary"
          :disabled="busy"
          @click="run(() => loadSelected(row.qualityInquiryId))"
        >
          상세 보기
        </button>
        <RouterLink
          v-else
          class="button button-secondary"
          :to="`/help/inquiries/${row.qualityInquiryId}`"
          >상세 보기</RouterLink
        >
      </li>
      <li v-if="!busy && !error && !rows.length" class="ui-empty">접수된 문의가 없습니다.</li>
    </ul>
    <article v-if="selected" class="ui-surface ui-stack">
      <h2>문의 #{{ selected.qualityInquiryId }} · {{ states[selected.status] }}</h2>
      <p style="white-space: pre-wrap">{{ selected.content }}</p>
      <ul>
        <li v-for="file in selected.attachments" :key="file.attachmentId">
          첨부: {{ file.originalFilename }}
        </li>
      </ul>
      <h3>관리자 답변</h3>
      <p style="white-space: pre-wrap">
        {{ selected.adminAnswer || '아직 답변이 등록되지 않았습니다.' }}
      </p>
      <form v-if="admin && next[selected.status]" class="ui-stack" @submit.prevent="process">
        <label class="ui-field"
          >답변<textarea
            v-model="answer"
            rows="5"
            :disabled="busy"
            :required="selected.status === 'IN_PROGRESS'"
          /></label
        ><button class="button button-primary ui-action-end" :disabled="busy">
          {{ states[next[selected.status]] }}로 변경
        </button>
      </form>
    </article>
  </section>
</template>
