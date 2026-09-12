import test from 'node:test'
import assert from 'node:assert/strict'
import { createSettingChangeRequest } from './settingChangeForm.js'

const PLAN_ID = '550e8400-e29b-41d4-a716-446655440000'
const ADDRESS_ID = '550e8400-e29b-41d4-a716-446655440001'
const conditions = [
  {
    weekday: 'MONDAY',
    mealQuantity: 2,
    addressId: ADDRESS_ID,
    deliveryTimeSlot: 'TIME_1100_1300',
  },
]

test('설정 변경 요청은 서버 DTO 필드와 값만 만든다', () => {
  assert.deepEqual(createSettingChangeRequest(PLAN_ID, conditions), {
    planId: PLAN_ID,
    deliveryConditions: conditions,
  })
})

test('요일·수량·배송지 오류는 설정 변경 요청 전에 차단한다', () => {
  assert.throws(
    () => createSettingChangeRequest(PLAN_ID, [{ ...conditions[0], weekday: 'SUNDAY' }]),
    /월요일부터 토요일까지/,
  )
  assert.throws(
    () => createSettingChangeRequest(PLAN_ID, [{ ...conditions[0], mealQuantity: 7 }]),
    /1~6개/,
  )
  assert.throws(
    () => createSettingChangeRequest(PLAN_ID, [{ ...conditions[0], addressId: '' }]),
    /배송지를 선택/,
  )
})
