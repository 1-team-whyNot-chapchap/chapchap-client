import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import {
  bindFirstSubscriptionDraft,
  cleanFirstSubscriptionDraft,
  FIRST_SUBSCRIPTION_DRAFT_KEY as KEY,
} from './firstSubscriptionDraft.js'
import { createFirstSubscriptionStore } from './stores/useFirstSubscriptionStore.js'
import { firstSubscriptionStepIssue } from './firstSubscriptionForm.js'

const PLAN = 'db0dfc0b-0115-4e6e-a043-20cf60bf3ce4'
const ADDRESS = '87ef3f3e-8c71-467f-81db-fa5341a91032'
test('실제 서버의 숫자 약관 버전을 동의 후 새로고침에서도 보존한다', async () => {
  const api = {
    getRequiredTerms: async () => [{ termsType: 'SERVICE', version: 1 }],
    agreeRequiredTerms: async () => {},
  }
  const a = fixture(storage(), api)
  fill(a.app)
  await a.app.fetchRequiredTerms()
  a.app.setTermAgreement('SERVICE', true)
  await a.app.agreeRequiredTerms()
  assert.equal(JSON.parse(a.saved.getItem(KEY)).draft.terms[0].version, 1)
  a.stop()
  const b = fixture(a.saved, api)
  await b.app.fetchRequiredTerms()
  assert.equal(b.app.termsConfirmed, true)
  assert.equal(b.app.deliveryConditions.length, 2)
  b.stop()
})
function storage() {
  const data = new Map()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  }
}
function fixture(saved = storage(), api = {}) {
  setActivePinia(createPinia())
  const app = createFirstSubscriptionStore(api)()
  const session = reactive({ user: { userId: '2', role: 'CUSTOMER' } })
  const stop = bindFirstSubscriptionDraft(
    app,
    () => session.user,
    () => saved,
  )
  return { app, session, saved, stop }
}
function fill(app) {
  app.begin(PLAN)
  app.setDeliveryWeekdays(['MONDAY', 'WEDNESDAY'])
  for (const day of ['MONDAY', 'WEDNESDAY'])
    app.updateDeliveryCondition(day, { addressId: ADDRESS, mealQuantity: 3 })
}

test('부분 입력을 저장하고 새 Pinia 인스턴스에 복원하며 부족한 단계는 거절한다', () => {
  const a = fixture()
  a.app.begin(PLAN)
  a.app.setDeliveryWeekdays(['MONDAY'])
  a.stop()
  const b = fixture(a.saved)
  assert.equal(b.app.deliveryConditions[0].addressId, '')
  assert.equal(firstSubscriptionStepIssue(5, b.app, []).step, 2)
  b.stop()
})
test('입력만 저장하고 카드·금액·토큰·주소 원문은 복사하지 않는다', () => {
  const f = fixture()
  fill(f.app)
  f.app.deliveryConditions[0].address = 'SECRET ADDRESS'
  f.app.preview = { paymentAmount: 12345 }
  f.app.token = 'SECRET TOKEN'
  const record = JSON.parse(f.saved.getItem(KEY))
  assert.deepEqual(Object.keys(record.draft).sort(), [
    'confirmed',
    'deliveryConditions',
    'planId',
    'terms',
  ])
  assert.ok(!f.saved.getItem(KEY).includes('SECRET'))
  f.stop()
  const b = fixture(f.saved)
  assert.equal(b.app.preview, null)
  assert.equal(b.app.result, null)
  b.stop()
})
test('같은 사용자 객체·프로필 변경은 유지하고 계정 변경·로그아웃은 삭제한다', () => {
  const f = fixture()
  fill(f.app)
  f.session.user = { ...f.session.user, email: 'changed' }
  assert.equal(f.app.deliveryConditions.length, 2)
  f.session.user = { userId: '3', role: 'CUSTOMER' }
  assert.equal(f.app.planId, '')
  assert.equal(f.saved.getItem(KEY), null)
  fill(f.app)
  f.session.user = null
  assert.equal(f.app.planId, '')
  assert.equal(f.saved.getItem(KEY), null)
  f.stop()
})
test('다른 사용자·손상·미지원 저장 자료는 복원하지 않는다', () => {
  for (const value of [
    '{bad',
    JSON.stringify({ version: 2 }),
    JSON.stringify({ version: 1, userId: '3', draft: { planId: PLAN } }),
  ]) {
    const s = storage()
    s.setItem(KEY, value)
    const f = fixture(s)
    assert.equal(f.app.planId, '')
    assert.equal(s.getItem(KEY), null)
    f.stop()
  }
})
test('허용되지 않은 요일·수량·중복·식별자는 거절한다', () => {
  const f = fixture()
  fill(f.app)
  const draft = JSON.parse(f.saved.getItem(KEY)).draft
  for (const change of [
    { weekday: 'SUNDAY' },
    { mealQuantity: 7 },
    { addressId: 'not-uuid' },
    { deliveryTimeSlot: 'MIDNIGHT' },
  ]) {
    const value = structuredClone(draft)
    Object.assign(value.deliveryConditions[0], change)
    assert.equal(cleanFirstSubscriptionDraft(value), null)
  }
  draft.deliveryConditions.push({ ...draft.deliveryConditions[0] })
  assert.equal(cleanFirstSubscriptionDraft(draft), null)
  f.stop()
})
test('동의 성공은 최신 버전 대조 후 복원하며 금액 조회 외의 쓰기는 실행하지 않는다', async () => {
  let writes = 0,
    quotes = 0
  const api = {
    getRequiredTerms: async () => [{ termsType: 'A', version: '1' }],
    agreeRequiredTerms: async () => writes++,
    preview: async () => {
      quotes++
      return { paymentAmount: 100 }
    },
  }
  const a = fixture(storage(), api)
  fill(a.app)
  await a.app.fetchRequiredTerms()
  a.app.setTermAgreement('A', true)
  await a.app.agreeRequiredTerms()
  a.stop()
  const b = fixture(a.saved, api)
  assert.equal(b.app.termsConfirmed, false)
  await b.app.fetchRequiredTerms()
  assert.equal(b.app.termsConfirmed, true)
  await b.app.requestPreview({})
  assert.equal(quotes, 1)
  assert.equal(writes, 1)
  b.stop()
})
test('체크만 한 상태는 복원하되 동의 성공으로 처리하지 않는다', async () => {
  const api = { getRequiredTerms: async () => [{ termsType: 'A', version: '1' }] }
  const a = fixture(storage(), api)
  fill(a.app)
  await a.app.fetchRequiredTerms()
  a.app.setTermAgreement('A', true)
  a.stop()
  const b = fixture(a.saved, api)
  await b.app.fetchRequiredTerms()
  assert.equal(b.app.agreedTerms.A, true)
  assert.equal(b.app.termsConfirmed, false)
  b.stop()
})
test('약관 변경 시 재동의가 필요하고 조회 실패 중 다시 새로고침해도 입력을 보존한다', async () => {
  const a = fixture(storage(), {
    getRequiredTerms: async () => [{ termsType: 'A', version: '1' }],
    agreeRequiredTerms: async () => {},
  })
  fill(a.app)
  await a.app.fetchRequiredTerms()
  a.app.setTermAgreement('A', true)
  await a.app.agreeRequiredTerms()
  a.stop()
  const b = fixture(a.saved, {
    getRequiredTerms: async () => {
      throw Error('offline')
    },
  })
  await b.app.fetchRequiredTerms()
  b.stop()
  const c = fixture(a.saved, { getRequiredTerms: async () => [{ termsType: 'A', version: '2' }] })
  await c.app.fetchRequiredTerms()
  assert.equal(c.app.deliveryConditions.length, 2)
  assert.equal(c.app.termsConfirmed, false)
  assert.equal(c.app.agreedTerms.A, false)
  c.stop()
})
test('이전 계정의 약관 응답은 새 계정 입력을 덮어쓰지 않는다', async () => {
  let resolve
  const f = fixture(storage(), { getRequiredTerms: () => new Promise((r) => (resolve = r)) })
  fill(f.app)
  const pending = f.app.fetchRequiredTerms()
  f.session.user = null
  resolve([{ termsType: 'A', version: '1' }])
  await pending
  assert.equal(f.app.requiredTerms.length, 0)
  assert.equal(f.saved.getItem(KEY), null)
  f.stop()
})
test('신청 성공 시 삭제하고 플랜 변경 시 이전 조건을 제거한다', async () => {
  const f = fixture(storage(), { subscribe: async () => ({ subscriptionId: 'success' }) })
  fill(f.app)
  f.app.begin(ADDRESS)
  assert.equal(f.app.deliveryConditions.length, 0)
  await f.app.submit({})
  assert.equal(f.saved.getItem(KEY), null)
  f.stop()
})
test('저장소 접근 불가여도 메모리 신청 입력은 사용 가능하다', () => {
  const f = fixture({
    getItem() {
      throw Error()
    },
    setItem() {
      throw Error()
    },
    removeItem() {
      throw Error()
    },
  })
  fill(f.app)
  assert.equal(f.app.deliveryConditions.length, 2)
  f.stop()
})
test('기존 최신 입력이 있으면 오래된 모바일 복귀 입력으로 덮어쓰지 않는다', () => {
  const f = fixture()
  fill(f.app)
  f.app.restoreMobileDraft({ planId: ADDRESS, deliveryConditions: [] })
  assert.equal(f.app.planId, PLAN)
  assert.equal(f.app.deliveryConditions.length, 2)
  f.stop()
})
