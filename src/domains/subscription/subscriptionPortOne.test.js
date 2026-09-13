import test from 'node:test'
import assert from 'node:assert/strict'
import { billingKeyFromResponse } from './subscriptionPortOne.js'

test('PortOne 성공 응답의 빌링키만 일회성 등록 대상으로 반환한다', () => {
  assert.equal(billingKeyFromResponse({ billingKey: ' issue-key ' }), 'issue-key')
})

test('취소·실패·빌링키 없는 응답은 등록 성공으로 취급하지 않는다', () => {
  assert.throws(() => billingKeyFromResponse({ code: 'USER_CANCEL', message: '취소됨' }), /취소됨/)
  assert.throws(() => billingKeyFromResponse({}), /카드 등록 결과/)
})
