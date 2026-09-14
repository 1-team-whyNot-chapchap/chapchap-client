import test from 'node:test'
import assert from 'node:assert/strict'
import {
  currentSubscriptionSummary,
  selectNextDelivery,
  summaryToday,
} from './mypageSubscriptionSummary.js'

test('오늘은 브라우저 시간대와 관계없이 KST 자정에서 바뀐다', () => {
  assert.equal(summaryToday(new Date('2026-09-13T14:59:59Z')), '2026-09-13')
  assert.equal(summaryToday(new Date('2026-09-13T15:00:00Z')), '2026-09-14')
})

test('내림차순 원본을 변경하지 않고 가장 가까운 ACTIVE 주문을 선택한다', () => {
  const orders = [
    { deliveryDate: '2026-10-12', status: 'ACTIVE' },
    { deliveryDate: '2026-09-17', status: 'ACTIVE' },
    { deliveryDate: '2026-09-16', status: 'ACTIVE' },
    { deliveryDate: '2026-09-15', status: 'INACTIVE' },
    { deliveryDate: '2026-09-14', status: 'PAYMENT_FAILED' },
    { deliveryDate: '2026-09-12', status: 'ACTIVE' },
  ]
  const original = structuredClone(orders)
  assert.equal(selectNextDelivery(orders, '2026-09-13'), orders[2])
  assert.deepEqual(orders, original)
})

test('당일 주문은 배송 시간대가 지나도 포함하고 다음 KST 날짜부터 제외한다', () => {
  const order = { deliveryDate: '2026-09-14', status: 'ACTIVE', deliveryTimeSlot: 'TIME_1100_1300' }
  assert.equal(selectNextDelivery([order], summaryToday(new Date('2026-09-14T14:59:59Z'))), order)
  assert.equal(selectNextDelivery([order], summaryToday(new Date('2026-09-14T15:00:00Z'))), null)
})

test('취소·대기·실패 주문과 잘못된 날짜는 배송 예정으로 표시하지 않는다', () => {
  const orders = [
    'INACTIVE',
    'PAYMENT_FAILED',
    'CHANGE_PENDING',
    'AWAITING_CONFIRMATION',
    'CHANGE_NOT_APPLIED',
    'CANCELED_BEFORE_START',
    'UNKNOWN',
  ].map((status) => ({
    deliveryDate: '2026-09-16',
    status,
  }))
  orders.push({ deliveryDate: '2026-02-30', status: 'ACTIVE' }, null)
  assert.equal(selectNextDelivery(orders, '2026-01-01'), null)
  assert.equal(selectNextDelivery([], '2026-09-13'), null)
  assert.equal(selectNextDelivery(null, '2026-09-13'), null)
  assert.equal(selectNextDelivery(orders, 'not-a-date'), null)
})

test('구독 없음은 정상 빈 결과로 표시한다', () => {
  assert.deepEqual(currentSubscriptionSummary(null), {
    label: '구독 내역이 없어요.',
    planName: '',
    period: '',
  })
})

for (const [status, label] of Object.entries({
  SCHEDULED: '이용 예정',
  IN_PROGRESS: '이용 중',
  CANCELLATION_SCHEDULED: '해지 예정',
  ENDED: '이용 종료',
  PAYMENT_FAILED: '결제 실패',
  CANCELED_BEFORE_START: '시작 전 해지',
  AWAITING_CONFIRMATION: '확정 대기',
  UNKNOWN: '상태 확인 필요',
})) {
  test(`${status}는 서버 상태 그대로 표시하고 없는 플랜·기간을 만들지 않는다`, () => {
    assert.deepEqual(currentSubscriptionSummary({ subscriptionStatus: status, plan: null }), {
      label,
      planName: '',
      period: '',
    })
  })
}

test('실제 중첩 plan.name과 서버 이용 기간을 표시한다', () => {
  assert.deepEqual(
    currentSubscriptionSummary({
      subscriptionStatus: 'SCHEDULED',
      plan: { name: '가정식' },
      periodStartDate: '2026-09-16',
      periodEndDate: '2026-10-13',
    }),
    { label: '이용 예정', planName: '가정식', period: '2026-09-16 ~ 2026-10-13' },
  )
})
