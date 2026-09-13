import test from 'node:test'
import assert from 'node:assert/strict'
import { createSettingChangeComparison } from './settingChangeComparison.js'

function fixture() {
  const addresses = [
    {
      addressId: 'a',
      name: '집',
      addressLine1: '테스트로 1',
      addressLine2: '101호',
      entrancePassword: 'not-for-display',
    },
    { addressId: 'b', name: '집', addressLine1: '테스트로 2', addressLine2: '202호' },
  ]
  const plans = [
    { planId: 'p', name: '가정식' },
    { planId: 'q', name: '든든식' },
  ]
  const subscription = {
    plan: plans[0],
    deliveryConditions: [
      {
        weekday: 'MONDAY',
        mealQuantity: 3,
        deliveryTimeSlot: 'TIME_1100_1300',
        address: addresses[0],
      },
    ],
  }
  const draft = {
    planId: 'p',
    deliveryConditions: [
      { weekday: 'MONDAY', mealQuantity: 3, deliveryTimeSlot: 'TIME_1100_1300', addressId: 'a' },
    ],
  }
  return { subscription, draft, plans, addresses }
}
const compare = ({ subscription, draft, plans, addresses }) =>
  createSettingChangeComparison(subscription, draft, plans, addresses)

test('변경 없는 플랜과 조건은 유지로 표시하며 원본과 민감정보를 보호한다', () => {
  const f = fixture(),
    original = structuredClone(f)
  const groups = compare(f)
  assert.ok(
    groups.every(
      (group) => group.status === 'kept' && group.fields.every((field) => !field.changed),
    ),
  )
  assert.deepEqual(f, original)
  assert.equal(JSON.stringify(groups).includes('not-for-display'), false)
})
test('수량만 변경하면 해당 필드만 변경으로 표시한다', () => {
  const f = fixture()
  f.draft.deliveryConditions[0].mealQuantity = 4
  const fields = compare(f)[1].fields
  assert.deepEqual(
    fields.filter((field) => field.changed).map((field) => field.key),
    ['quantity'],
  )
  assert.equal(fields[1].before, '3식')
  assert.equal(fields[1].after, '4식')
})
test('플랜·같은 이름의 배송지·시간대 변경을 식별하고 이름과 주소를 표시한다', () => {
  const f = fixture()
  f.draft.planId = 'q'
  Object.assign(f.draft.deliveryConditions[0], {
    addressId: 'b',
    deliveryTimeSlot: 'TIME_1700_1900',
  })
  const groups = compare(f)
  assert.equal(groups[0].fields[0].changed, true)
  assert.equal(groups[1].fields[0].changed, true)
  assert.equal(groups[1].fields[0].after, '집 · 테스트로 2 · 202호')
  assert.equal(groups[1].fields[2].after, '17:00 ~ 19:00')
})
test('요일 삭제와 추가를 임의 연결하지 않고 월~토 순서로 표시한다', () => {
  const f = fixture()
  f.draft.deliveryConditions = [
    { ...f.draft.deliveryConditions[0], weekday: 'SATURDAY' },
    { ...f.draft.deliveryConditions[0], weekday: 'TUESDAY' },
  ]
  const days = compare(f).slice(1)
  assert.deepEqual(
    days.map((day) => [day.key, day.status]),
    [
      ['MONDAY', 'removed'],
      ['TUESDAY', 'added'],
      ['SATURDAY', 'added'],
    ],
  )
  assert.ok(days[0].fields.every((field) => field.after === null))
  assert.ok(days[1].fields.every((field) => field.before === null))
})
test('이름이 같아도 다른 플랜 식별자면 변경이다', () => {
  const f = fixture()
  f.plans[1].name = '가정식'
  f.draft.planId = 'q'
  assert.equal(compare(f)[0].fields[0].changed, true)
})
test('기존 구독·선택 플랜·배송지 정보가 없으면 비교를 만들지 않는다', () => {
  const f = fixture()
  assert.equal(compare({ ...f, subscription: null }), null)
  assert.equal(compare({ ...f, plans: [] }), null)
  assert.equal(compare({ ...f, addresses: [] }), null)
  assert.equal(compare({ ...f, draft: { planId: 'p', deliveryConditions: [] } }), null)
})
