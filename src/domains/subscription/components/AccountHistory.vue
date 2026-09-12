<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../api/accountDataApi.js'
import { displayDateTime } from '../../../common/utils/displayDate.js'
const props = defineProps({ kind: { type: String, required: true }, detail: Boolean })
const route = useRoute()
const api = createAccountDataApi(http)
const rows = ref([]),
  item = ref(null),
  loading = ref(false),
  error = ref('')
const from = ref(''),
  to = ref('')
let version = 0
const names = { payments: '결제 내역', refunds: '환불 내역', orders: '구독 주문 내역' }
const paths = {
  payments: '/mypage/payments',
  refunds: '/mypage/refunds',
  orders: '/subscription/rounds',
}
const statuses = {
  PROCESSING: '처리 중',
  SUCCESS: '완료',
  FAILED: '실패',
  RETRY_WAITING: '재시도 대기',
  RETRY_STOPPED: '재시도 종료',
  PENDING: '처리 대기',
  COMPLETED: '완료',
  REVIEW_REQUIRED: '확인 필요',
  AWAITING_CONFIRMATION: '확정 대기',
  CHANGE_PENDING: '변경 대기',
  ACTIVE: '주문 확정',
  INACTIVE: '비활성',
  PAYMENT_FAILED: '결제 실패',
  CHANGE_NOT_APPLIED: '변경 미적용',
  CANCELED_BEFORE_START: '시작 전 취소',
}
const types = {
  FIRST_SUBSCRIPTION_PAYMENT: '첫 구독 결제',
  REGULAR_PAYMENT: '정기 결제',
  SETTING_CHANGE_PAYMENT: '설정 변경 결제',
  SETTING_CHANGE_PARTIAL_CANCELLATION: '설정 변경 부분 취소',
  CANCELLATION_BEFORE_START: '시작 전 취소',
  NEXT_PERIOD_FULL_CANCELLATION: '다음 이용 기간 취소',
  DELIVERY_PARTIAL_CANCELLATION: '배송 부분 취소',
}
const money = (value) =>
  typeof value === 'number' ? value.toLocaleString('ko-KR') + '원' : '금액 정보 없음'
const dateOf = (row) => row.occurredAt || row.requestedAt || row.deliveryDate
const titleOf = (row) =>
  types[row.paymentType] ||
  row.planName ||
  (props.kind === 'orders' ? '구독 주문' : props.kind === 'refunds' ? '환불' : '결제')
const idOf = (row) => row.paymentId || row.refundId || row.orderId
const periodError = computed(() => from.value && to.value && from.value > to.value)
const filtered = computed(() =>
  rows.value.filter((row) => {
    const day = dateOf(row)?.slice(0, 10)
    return (!from.value || day >= from.value) && (!to.value || day <= to.value)
  }),
)
function clearPeriod() {
  from.value = ''
  to.value = ''
}
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  item.value = null
  rows.value = []
  try {
    if (props.detail) {
      if (typeof route.query.id !== 'string')
        throw new Error('목록에서 확인할 내역을 선택해 주세요.')
      const result = await api.detail(props.kind, route.query.id)
      if (current === version) item.value = result
    } else {
      const result = await api.history(props.kind)
      if (current === version) rows.value = result
    }
  } catch (cause) {
    if (current === version)
      error.value =
        props.detail && !route.query.id
          ? cause.message
          : '내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    if (current === version) loading.value = false
  }
}
watch(() => [props.kind, props.detail, route.query.id], load, { immediate: true })
onUnmounted(() => {
  version++
})
</script>
<template>
  <div class="workspace-ui design-review-page account-history">
    <PageBackButton
      :to="detail ? paths[kind] : '/mypage'"
      :label="detail ? names[kind] : '마이페이지'"
    />
    <header class="ui-heading">
      <div>
        <h1>{{ names[kind] }}{{ detail ? ' 상세' : '' }}</h1>
        <p>처리 상태와 금액을 확인하세요.</p>
      </div>
    </header>
    <p v-if="loading" role="status">내역을 불러오고 있어요.</p>
    <section v-else-if="error" class="ui-surface ui-stack" role="alert">
      <p>{{ error }}</p>
      <div class="ui-actions ui-actions--end">
        <button v-if="!detail || route.query.id" class="button button-secondary" @click="load">
          다시 시도</button
        ><RouterLink v-else class="button button-primary" :to="paths[kind]"
          >목록에서 선택</RouterLink
        >
      </div>
    </section>
    <template v-else-if="!detail">
      <div class="ui-filter">
        <label class="ui-field"
          >시작일<input v-model="from" type="date" :max="to || undefined" /></label
        ><label class="ui-field"
          >종료일<input v-model="to" type="date" :min="from || undefined" /></label
        ><button class="button button-secondary" @click="clearPeriod">기간 초기화</button>
      </div>
      <p v-if="periodError" role="alert">종료일을 시작일 이후로 선택해 주세요.</p>
      <template v-else
        ><p class="ui-muted" role="status">총 {{ filtered.length }}건</p>
        <section class="ui-stack">
          <article v-for="row in filtered" :key="idOf(row)" class="ui-surface ui-stack">
            <div class="ui-row">
              <h2>{{ titleOf(row) }}</h2>
              <span class="mini-badge">{{ statuses[row.status] || '상태 확인 필요' }}</span>
            </div>
            <p>{{ displayDateTime(dateOf(row)) }}</p>
            <strong>{{ money(kind === 'refunds' ? row.refundedAmount : row.amount) }}</strong>
            <p v-if="kind === 'refunds'">
              요청 {{ money(row.requestedAmount) }} · 미처리 {{ money(row.unprocessedAmount) }}
            </p>
            <div v-else class="ui-actions ui-actions--end">
              <RouterLink
                class="button button-secondary"
                :to="{ path: paths[kind] + '/detail', query: { id: idOf(row) } }"
                :aria-label="`${displayDateTime(dateOf(row))} ${titleOf(row)} 상세 보기`"
                >상세 보기</RouterLink
              >
            </div>
          </article>
          <div v-if="!filtered.length" class="ui-empty">
            {{ from || to ? '선택한 기간에 내역이 없어요.' : '아직 등록된 내역이 없어요.' }}
          </div>
        </section></template
      >
    </template>
    <article v-else-if="item" class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>{{ titleOf(item) }}</h2>
        <span class="mini-badge">{{ statuses[item.status] || '상태 확인 필요' }}</span>
      </div>
      <p>{{ displayDateTime(dateOf(item)) }}</p>
      <strong>{{ money(item.amount) }}</strong>
      <template v-if="kind === 'orders'"
        ><h3>{{ item.menuName || '메뉴 정보 없음' }}</h3>
        <p v-if="item.menuDescription">{{ item.menuDescription }}</p>
        <p>
          {{ item.mealQuantity }}개 ·
          {{ { LUNCH: '점심', DINNER: '저녁' }[item.deliveryTimeSlot] || '시간 확인 필요' }}
        </p>
        <h3>배송지</h3>
        <p>{{ item.recipientName }} · {{ item.recipientPhone }}</p>
        <p>{{ item.addressLine1 }} {{ item.addressLine2 }}</p>
        <p v-if="item.otherDeliveryRequest">{{ item.otherDeliveryRequest }}</p>
        <p v-if="item.allergenInfo">알레르기 정보: {{ item.allergenInfo }}</p>
        <p v-if="item.refund">
          환불 {{ statuses[item.refund.status] || '확인 필요' }} · 완료
          {{ money(item.refund.refundedAmount) }}
        </p></template
      >
      <template v-else
        ><p>
          원 결제 {{ money(item.originalPaymentAmount) }} · 누적 취소
          {{ money(item.cumulativeCancelAmount) }}
        </p>
        <p v-if="item.periodStartDate">
          이용 기간 {{ item.periodStartDate }} ~ {{ item.periodEndDate }}
        </p>
        <section
          v-for="attempt in item.attempts || []"
          :key="attempt.attemptSequence"
          class="ui-note"
        >
          <p>{{ displayDateTime(attempt.requestedAt) }} · {{ money(attempt.requestedAmount) }}</p>
          <p v-if="attempt.cardCompany">{{ attempt.cardCompany }} {{ attempt.maskedCardNumber }}</p>
        </section></template
      >
    </article>
  </div>
</template>
<style scoped>
.account-history {
  max-width: 880px;
  margin-inline: auto;
}
.account-history p,
.account-history h2 {
  overflow-wrap: anywhere;
}
.ui-filter {
  align-items: end;
}
@media (max-width: 640px) {
  .ui-filter > .button {
    margin-left: auto;
  }
}
</style>
