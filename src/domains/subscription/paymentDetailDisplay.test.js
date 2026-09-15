import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  displayHistoryAmount,
  showsOriginalAmounts,
  paymentCardLabel,
} from './paymentDetailDisplay.js'

test('일반 결제 성공에만 집계 금액을 표시한다', () => {
  for (const paymentType of [
    'FIRST_SUBSCRIPTION_PAYMENT',
    'REGULAR_PAYMENT',
    'SETTING_CHANGE_PAYMENT',
  ]) {
    assert.equal(showsOriginalAmounts({ paymentType, status: 'SUCCESS' }), true)
    assert.equal(showsOriginalAmounts({ paymentType, status: 'FAILED' }), false)
  }
  assert.equal(
    showsOriginalAmounts({ paymentType: 'SETTING_CHANGE_PARTIAL_CANCELLATION', status: 'SUCCESS' }),
    false,
  )
  assert.equal(displayHistoryAmount(0), '0원')
  assert.equal(displayHistoryAmount(null), '금액 확인 필요')
})

test('카드는 성공 시도 또는 최근 시도를 사용하고 다른 시도의 카드로 대체하지 않는다', () => {
  const attempts = [
    { attemptSequence: 1, result: 'FAILED', cardCompany: 'A' },
    { attemptSequence: 2, result: 'SUCCESS', cardCompany: 'B', maskedCardNumber: '****1234' },
  ]
  assert.equal(paymentCardLabel({ status: 'SUCCESS', attempts }), 'B · ****1234')
  assert.equal(paymentCardLabel({ status: 'RETRY_WAITING', attempts }), 'B · ****1234')
  assert.equal(
    paymentCardLabel({
      status: 'SUCCESS',
      attempts: [...attempts, { attemptSequence: 3, result: 'SUCCESS' }],
    }),
    '',
  )
  assert.equal(paymentCardLabel({ attempts: [] }), '')
})

const sourceUrl = new URL('./components/PaymentRefundHistory.vue', import.meta.url)
const { descriptor } = parse(await readFile(sourceUrl, 'utf8'))
let source = compileScript(descriptor, { id: 'history-display-test', inlineTemplate: true }).content
source = source.replace(
  /import \{ useRoute \} from ['"]vue-router['"];?/,
  'const useRoute = () => ({params: {paymentId: "test", refundId: "test"}});',
)
source = source.replace(
  /import \{ usePaymentRefundHistoryStore \} from ['"][^'"]+['"];?/,
  'const usePaymentRefundHistoryStore = () => globalThis.__historyDisplayStore;',
)
source = source.replace(
  /import (\w+) from ['"][^'"]+\.vue['"];?/g,
  'const $1 = { render() { return null } };',
)
source = source.replace(
  /from (['"])([^'"]+)\1/g,
  (_, quote, path) =>
    `from ${quote}${path.startsWith('.') ? new URL(path, sourceUrl).href : import.meta.resolve(path)}${quote}`,
)
const Page = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`))
  .default

async function render(kind, item) {
  globalThis.__historyDisplayStore = {
    paymentDetail: item,
    refundDetail: item,
    paymentDetailStatus: 'success',
    refundDetailStatus: 'success',
    fetchPayment() {},
    fetchRefund() {},
  }
  try {
    const app = createSSRApp(Page, { kind, detail: true })
    app.component('RouterLink', { template: '<a><slot /></a>' })
    return await renderToString(app)
  } finally {
    delete globalThis.__historyDisplayStore
  }
}

test('실제 결제 상세 템플릿은 취소 집계·처리 시도를 숨기고 결제 금액을 유지한다', async () => {
  const html = await render('payments', {
    paymentType: 'SETTING_CHANGE_PARTIAL_CANCELLATION',
    status: 'SUCCESS',
    amount: 31600,
    attempts: [],
  })
  assert.match(html, /31,600원/)
  for (const label of [
    '원 결제 금액',
    '누적 취소 금액',
    '추가 취소 가능 금액',
    '처리 시도',
    '서버가 기록한',
  ])
    assert.ok(!html.includes(label))
})

test('실제 환불 템플릿은 모든 상태의 금액과 접힌 거래 내역을 유지한다', async () => {
  for (const status of ['COMPLETED', 'PENDING', 'FAILED', 'REVIEW_REQUIRED']) {
    const html = await render('refunds', {
      status,
      refundType: 'SETTING_CHANGE_REDUCTION',
      requestedAmount: 31600,
      refundedAmount: 31600,
      unprocessedAmount: 0,
      cancellations: [],
    })
    for (const label of ['환불 요청 금액', '환불 완료 금액', '미처리 금액', '0원'])
      assert.ok(html.includes(label))
    assert.match(html, /<details[^>]*>/)
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/)
    assert.match(html, /환불 처리 내역 \(0건\)/)
    assert.equal((html.match(/31,600원/g) || []).length, 2)
  }
})
