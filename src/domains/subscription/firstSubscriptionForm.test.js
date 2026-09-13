import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createFirstSubscriptionRequest,
  firstSubscriptionStepIssue,
  DELIVERY_WEEKDAYS,
} from './firstSubscriptionForm.js'

const PLAN_ID = '550e8400-e29b-41d4-a716-446655440000'
const ADDRESS_ID = '660e8400-e29b-41d4-a716-446655440000'

const validCondition = {
  weekday: 'MONDAY',
  addressId: ADDRESS_ID,
  mealQuantity: 1,
  deliveryTimeSlot: 'TIME_1100_1300',
}
const validApplication = () => ({
  deliveryConditions: [{ ...validCondition }],
  termsConfirmed: true,
})
const addresses = [{ addressId: ADDRESS_ID }]

test('2~5단계 직접 진입은 요일 미선택·중복·일요일·7건을 모두 1단계로 안내한다', () => {
  for (const step of [2, 3, 4, 5]) {
    for (const conditions of [
      [],
      [validCondition, validCondition],
      [{ ...validCondition, weekday: 'SUNDAY' }],
      Array(7).fill(validCondition),
    ]) {
      assert.equal(
        firstSubscriptionStepIssue(step, { deliveryConditions: conditions }, addresses).step,
        1,
      )
    }
  }
})

test('1~6개 요일과 수량 경계값은 허용하고 없는 배송지를 가장 먼저 안내한다', () => {
  for (let count = 1; count <= 6; count++) {
    const application = {
      termsConfirmed: true,
      deliveryConditions: DELIVERY_WEEKDAYS.slice(0, count).map((weekday) => ({
        ...validCondition,
        weekday,
        mealQuantity: count,
      })),
    }
    for (const step of [1, 2, 3, 4, 5])
      assert.equal(firstSubscriptionStepIssue(step, application, addresses), null)
  }
  for (const addressId of ['', 'wrong', '770e8400-e29b-41d4-a716-446655440000']) {
    const application = validApplication()
    application.deliveryConditions[0] = { ...validCondition, addressId, mealQuantity: 0 }
    for (const step of [3, 4, 5])
      assert.equal(firstSubscriptionStepIssue(step, application, addresses).step, 2)
  }
})

test('3단계에서는 수량을 고칠 수 있고 4~5단계는 잘못된 수량·시간을 거절한다', () => {
  for (const changes of [
    { mealQuantity: 0 },
    { mealQuantity: 7 },
    { mealQuantity: 1.5 },
    { mealQuantity: '2' },
    { deliveryTimeSlot: '' },
  ]) {
    const application = validApplication()
    Object.assign(application.deliveryConditions[0], changes)
    assert.equal(firstSubscriptionStepIssue(3, application, addresses), null)
    for (const step of [4, 5])
      assert.equal(firstSubscriptionStepIssue(step, application, addresses).step, 3)
  }
})

test('약관 체크만으로는 5단계에 진입하지 못하고 서버 동의 완료 후에 허용한다', () => {
  const application = {
    ...validApplication(),
    termsConfirmed: false,
    agreedTerms: { SERVICE: true },
  }
  assert.equal(firstSubscriptionStepIssue(4, application, addresses), null)
  assert.equal(firstSubscriptionStepIssue(5, application, addresses).step, 4)
  application.termsConfirmed = true
  assert.equal(firstSubscriptionStepIssue(5, application, addresses), null)
})

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
