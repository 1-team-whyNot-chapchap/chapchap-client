import test from 'node:test'
import assert from 'node:assert/strict'
import { createFirstSubscriptionRequest } from './firstSubscriptionForm.js'

const PLAN_ID = '550e8400-e29b-41d4-a716-446655440000'
const ADDRESS_ID = '660e8400-e29b-41d4-a716-446655440000'

test('첫 구독 요청은 서버 계약 필드만 만든다', () => {
  assert.deepEqual(
    createFirstSubscriptionRequest(PLAN_ID, [
      {
        weekday: 'MONDAY',
        addressId: ADDRESS_ID,
        mealQuantity: 2,
        deliveryTimeSlot: 'TIME_1100_1300',
        ignored: true,
      },
    ]),
    {
      planId: PLAN_ID,
      deliveryConditions: [
        {
          weekday: 'MONDAY',
          addressId: ADDRESS_ID,
          mealQuantity: 2,
          deliveryTimeSlot: 'TIME_1100_1300',
        },
      ],
    },
  )
})

test('요일 중복, 일요일, 배송지와 식사 수량 오류를 요청 전에 차단한다', () => {
  const condition = {
    weekday: 'MONDAY',
    addressId: ADDRESS_ID,
    mealQuantity: 1,
    deliveryTimeSlot: 'TIME_1100_1300',
  }
  assert.throws(
    () => createFirstSubscriptionRequest(PLAN_ID, [condition, condition]),
    /서로 다른 배송 요일/,
  )
  assert.throws(
    () => createFirstSubscriptionRequest(PLAN_ID, [{ ...condition, weekday: 'SUNDAY' }]),
    /서로 다른 배송 요일/,
  )
  assert.throws(
    () => createFirstSubscriptionRequest(PLAN_ID, [{ ...condition, addressId: 'home' }]),
    /배송지/,
  )
  assert.throws(
    () => createFirstSubscriptionRequest(PLAN_ID, [{ ...condition, mealQuantity: 7 }]),
    /1~6개/,
  )
})
