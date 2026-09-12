import test from 'node:test'
import assert from 'node:assert/strict'
import {
  deliveryTimeSlotLabel,
  deliveryWeekdayLabel,
  formatSubscriptionAddress,
  subscriptionStatusLabel,
} from './currentSubscriptionDisplay.js'

test('현재 구독 응답의 enum을 화면 문구로 변환한다', () => {
  assert.equal(subscriptionStatusLabel('CANCELLATION_SCHEDULED'), '해지 예정')
  assert.equal(deliveryWeekdayLabel('WEDNESDAY'), '수요일')
  assert.equal(deliveryTimeSlotLabel('TIME_1700_1900'), '17:00 ~ 19:00')
})

test('배송지 상세 주소는 있을 때만 함께 표시한다', () => {
  assert.equal(formatSubscriptionAddress({ addressLine1: '서울시', addressLine2: null }), '서울시')
  assert.equal(
    formatSubscriptionAddress({ addressLine1: '서울시', addressLine2: '101동 1001호' }),
    '서울시 101동 1001호',
  )
})
