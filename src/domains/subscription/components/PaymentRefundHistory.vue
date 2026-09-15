<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { displayDateTime } from '../../../common/utils/displayDate.js'
import { usePaymentRefundHistoryStore } from '../stores/usePaymentRefundHistoryStore.js'
import {
  displayHistoryAmount,
  showsOriginalAmounts,
  paymentCardLabel,
} from '../paymentDetailDisplay.js'

const props = defineProps({ kind: { type: String, required: true }, detail: Boolean })
const route = useRoute()
const store = usePaymentRefundHistoryStore()
const from = ref('')
const to = ref('')

const config = computed(() =>
  props.kind === 'payments'
    ? {
        name: '결제 내역',
        route: '/mypage/payments',
        param: 'paymentId',
        list: store.payments,
        listStatus: store.paymentListStatus,
        listError: store.paymentListError,
        item: store.paymentDetail,
        detailStatus: store.paymentDetailStatus,
        detailError: store.paymentDetailError,
        loadList: (force) => store.fetchPayments(force),
        loadDetail: (id) => store.fetchPayment(id),
      }
    : {
        name: '환불 내역',
        route: '/mypage/refunds',
        param: 'refundId',
        list: store.refunds,
        listStatus: store.refundListStatus,
        listError: store.refundListError,
        item: store.refundDetail,
        detailStatus: store.refundDetailStatus,
        detailError: store.refundDetailError,
        loadList: (force) => store.fetchRefunds(force),
        loadDetail: (id) => store.fetchRefund(id),
      },
)
const paymentTypes = {
  FIRST_SUBSCRIPTION_PAYMENT: '첫 구독 결제',
  REGULAR_PAYMENT: '정기 결제',
  SETTING_CHANGE_PAYMENT: '설정 변경 결제',
  SETTING_CHANGE_PARTIAL_CANCELLATION: '설정 변경 부분 취소',
  CANCELLATION_BEFORE_START: '시작 전 취소',
  NEXT_PERIOD_FULL_CANCELLATION: '다음 이용 기간 취소',
  DELIVERY_PARTIAL_CANCELLATION: '배송 부분 취소',
}
const refundTypes = {
  SETTING_CHANGE_REDUCTION: '설정 변경 환불',
  CANCELLATION_BEFORE_START: '시작 전 취소',
  NEXT_PERIOD_FULL_CANCELLATION: '다음 이용 기간 취소',
  DELIVERY_PARTIAL_CANCELLATION: '배송 부분 취소',
}
const paymentStatuses = {
  PROCESSING: '처리 중',
  SUCCESS: '완료',
  FAILED: '실패',
  RETRY_WAITING: '재시도 대기',
  RETRY_STOPPED: '재시도 중단',
}
const refundStatuses = {
  PENDING: '처리 대기',
  COMPLETED: '환불 완료',
  FAILED: '환불 실패',
  REVIEW_REQUIRED: '확인 필요',
}
const amount = (value) =>
  props.detail ? displayHistoryAmount(value) : `${Number(value ?? 0).toLocaleString('ko-KR')}원`
const itemId = (item) => item?.paymentId || item?.refundId
const itemDate = (item) => item?.occurredAt || item?.requestedAt
const typeLabel = (item) =>
  props.kind === 'payments'
    ? paymentTypes[item.paymentType] || '결제 거래'
    : refundTypes[item.refundType] || '환불'
const statusLabel = (item) =>
  props.kind === 'payments'
    ? paymentStatuses[item.status] || '상태 확인 필요'
    : refundStatuses[item.status] || '상태 확인 필요'
const periodError = computed(() => from.value && to.value && from.value > to.value)
const filteredItems = computed(() =>
  config.value.list.filter((item) => {
    const day = itemDate(item)?.slice(0, 10)
    return (!from.value || day >= from.value) && (!to.value || day <= to.value)
  }),
)
const routeId = computed(() => route.params[config.value.param])
const isDetailMissing = computed(() => config.value.detailError?.status === 404)
const clearPeriod = () => {
  from.value = ''
  to.value = ''
}

watch(
  () => [props.kind, props.detail, routeId.value],
  ([, detail, id]) => {
    if (detail && typeof id === 'string') config.value.loadDetail(id)
    else if (!detail) config.value.loadList(true)
  },
  { immediate: true },
)
</script>

<template>
  <div class="payment-refund-history workspace-ui design-review-page">
    <PageBackButton
      :to="detail ? config.route : '/mypage'"
      :label="detail ? config.name : '마이페이지'"
    />
    <header class="page-intro">
      <p class="section-kicker">구독 이용 내역</p>
      <h1>{{ config.name }}{{ detail ? ' 상세' : '' }}</h1>
      <p v-if="!detail">기간별 처리 내역을 확인하세요.</p>
    </header>

    <section v-if="detail && typeof routeId !== 'string'" class="ui-empty" role="alert">
      <h2>확인할 내역을 찾을 수 없어요.</h2>
      <RouterLink class="button button-primary" :to="config.route">목록으로</RouterLink>
    </section>
    <section
      v-else-if="detail && ['idle', 'loading'].includes(config.detailStatus)"
      class="ui-empty"
      aria-busy="true"
    >
      <h2>상세 내역을 불러오고 있어요.</h2>
    </section>
    <section v-else-if="detail && config.detailStatus === 'error'" class="ui-empty" role="alert">
      <h2>상세 내역을 확인할 수 없어요.</h2>
      <p>
        {{
          isDetailMissing
            ? '삭제됐거나 확인 권한이 없는 내역일 수 있습니다.'
            : config.detailError?.serverMessage || '잠시 후 다시 시도해 주세요.'
        }}
      </p>
      <div class="ui-actions ui-actions--end">
        <button class="button button-secondary" type="button" @click="config.loadDetail(routeId)">
          다시 시도</button
        ><RouterLink class="button button-primary" :to="config.route">목록으로</RouterLink>
      </div>
    </section>
    <template v-else-if="detail && config.item">
      <section class="history-card">
        <div class="history-card__heading">
          <div>
            <p v-if="kind === 'payments'">{{ displayDateTime(itemDate(config.item)) }}</p>
            <h2>{{ typeLabel(config.item) }}</h2>
          </div>
          <span class="mini-badge">{{ statusLabel(config.item) }}</span>
        </div>
        <strong v-if="kind === 'payments'">{{ amount(config.item.amount) }}</strong>
      </section>
      <section v-if="kind === 'payments'" class="history-card">
        <h2>결제 정보</h2>
        <dl>
          <div>
            <dt>결제 대상 기간</dt>
            <dd>{{ config.item.periodStartDate }} ~ {{ config.item.periodEndDate }}</dd>
          </div>
          <div v-if="showsOriginalAmounts(config.item)">
            <dt>원 결제 금액</dt>
            <dd>{{ amount(config.item.originalPaymentAmount) }}</dd>
          </div>
          <div v-if="showsOriginalAmounts(config.item)">
            <dt>누적 취소 금액</dt>
            <dd>{{ amount(config.item.cumulativeCancelAmount) }}</dd>
          </div>
          <div v-if="paymentCardLabel(config.item)">
            <dt>결제 수단</dt>
            <dd>{{ paymentCardLabel(config.item) }}</dd>
          </div>
        </dl>
      </section>
      <section v-if="kind === 'refunds'" class="history-card">
        <h2>환불 결과</h2>
        <dl>
          <div>
            <dt>환불 요청 금액</dt>
            <dd>{{ amount(config.item.requestedAmount) }}</dd>
          </div>
          <div>
            <dt>환불 완료 금액</dt>
            <dd>{{ amount(config.item.refundedAmount) }}</dd>
          </div>
          <div>
            <dt>미처리 금액</dt>
            <dd>{{ amount(config.item.unprocessedAmount) }}</dd>
          </div>
          <div>
            <dt>요청 시각</dt>
            <dd>{{ displayDateTime(config.item.requestedAt) }}</dd>
          </div>
          <div>
            <dt>완료 시각</dt>
            <dd>
              {{ config.item.completedAt ? displayDateTime(config.item.completedAt) : '완료 대기' }}
            </dd>
          </div>
        </dl>
      </section>
      <details v-if="kind === 'refunds'" :key="routeId" class="history-card">
        <summary>환불 처리 내역 ({{ config.item.cancellations.length }}건)</summary>
        <div v-if="!config.item.cancellations.length" class="ui-empty">
          연결된 취소 거래가 없어요.
        </div>
        <article
          v-for="cancellation in config.item.cancellations"
          :key="cancellation.paymentId"
          class="attempt-card"
        >
          <div>
            <strong>{{ amount(cancellation.amount) }}</strong
            ><span class="mini-badge">{{
              paymentStatuses[cancellation.status] || '상태 확인 필요'
            }}</span>
          </div>
          <p>{{ displayDateTime(cancellation.occurredAt) }}</p>
          <RouterLink
            class="button button-secondary"
            :to="`/mypage/payments/${cancellation.paymentId}`"
            >결제 거래 보기</RouterLink
          >
        </article>
      </details>
    </template>

    <template v-else>
      <section
        v-if="['idle', 'loading'].includes(config.listStatus)"
        class="ui-empty"
        aria-busy="true"
      >
        <h2>{{ config.name }}을 불러오고 있어요.</h2>
      </section>
      <section v-else-if="config.listStatus === 'error'" class="ui-empty" role="alert">
        <h2>{{ config.name }}을 불러오지 못했어요.</h2>
        <p>{{ config.listError?.serverMessage || '잠시 후 다시 시도해 주세요.' }}</p>
        <button class="button button-secondary" type="button" @click="config.loadList(true)">
          다시 시도
        </button>
      </section>
      <template v-else>
        <div class="ui-filter">
          <label class="ui-field"
            >시작일<input v-model="from" type="date" :max="to || undefined" /></label
          ><label class="ui-field"
            >종료일<input v-model="to" type="date" :min="from || undefined" /></label
          ><button class="button button-secondary" type="button" @click="clearPeriod">
            기간 초기화
          </button>
        </div>
        <p v-if="periodError" role="alert">종료일을 시작일 이후로 선택해 주세요.</p>
        <template v-else
          ><p class="ui-muted" role="status">총 {{ filteredItems.length }}건</p>
          <section v-if="filteredItems.length" class="history-list">
            <article v-for="item in filteredItems" :key="itemId(item)" class="history-card">
              <div class="history-card__heading">
                <div>
                  <p>{{ displayDateTime(itemDate(item)) }}</p>
                  <h2>{{ typeLabel(item) }}</h2>
                </div>
                <span class="mini-badge">{{ statusLabel(item) }}</span>
              </div>
              <strong>{{ amount(kind === 'payments' ? item.amount : item.refundedAmount) }}</strong>
              <p v-if="kind === 'refunds'">
                요청 {{ amount(item.requestedAmount) }} · 미처리
                {{ amount(item.unprocessedAmount) }}
              </p>
              <div class="ui-actions ui-actions--end">
                <RouterLink class="button button-secondary" :to="`${config.route}/${itemId(item)}`"
                  >상세 보기</RouterLink
                >
              </div>
            </article>
          </section>
          <section v-else class="ui-empty">
            <h2>
              {{ from || to ? '선택한 기간에 내역이 없어요.' : `아직 ${config.name}이 없어요.` }}
            </h2>
          </section></template
        >
      </template>
    </template>
  </div>
</template>

<style scoped>
.payment-refund-history {
  max-width: 800px;
  margin-inline: auto;
}
.page-intro {
  margin: 24px 0 32px;
}
.page-intro h1,
.history-card h2 {
  margin: 0;
}
.page-intro p:last-child,
.history-card__heading p,
.attempt-card p {
  color: var(--color-text-muted);
}
.history-list {
  display: grid;
  gap: 14px;
}
.history-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.history-card__heading,
.attempt-card > div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.history-card__heading p,
.attempt-card p {
  margin: 0;
}
.history-card > strong {
  font-size: var(--font-section-title);
}
.history-card dl {
  display: grid;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.history-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-border);
}
.history-card dt {
  color: var(--color-text-muted);
}
.history-card dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}
.attempt-card {
  display: grid;
  gap: 7px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}
.attempt-card:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
@media (max-width: 560px) {
  .history-card {
    padding: 16px;
  }
  .history-card dl div {
    display: grid;
    gap: 6px;
  }
  .history-card dd {
    text-align: left;
  }
}
</style>
