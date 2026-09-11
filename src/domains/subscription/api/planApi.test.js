import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlanApi } from './planApi.js'

const PLAN_ID = '550e8400-e29b-41d4-a716-446655440000'

test('플랜 목록은 공개 Gateway 경로를 호출하고 envelope의 plans를 반환한다', async () => {
  const calls = []
  const plans = [
    {
      planId: PLAN_ID,
      name: '가정식',
      description: '플랜 소개',
      unitPrice: 8900,
    },
  ]
  const api = createPlanApi({
    get: async (url) => {
      calls.push(url)
      return { status: 200, data: { code: '00', message: 'SUCCESS', data: { plans } } }
    },
  })

  assert.deepEqual(await api.listPlans(), plans)
  assert.deepEqual(calls, ['/api/subscription/plans'])
})

test('플랜 상세는 UUID를 경로에 보존하고 고정 메뉴를 반환한다', async () => {
  const calls = []
  const detail = {
    planId: PLAN_ID,
    name: '가정식',
    description: '플랜 소개',
    unitPrice: 8900,
    menus: [
      {
        menuSequence: 1,
        name: '메뉴명',
        description: '메뉴 설명',
        imageUrl: null,
        allergenInfo: '대두',
        nutritionInfo: '열량 450kcal',
        ingredientInfo: '현미',
      },
    ],
  }
  const api = createPlanApi({
    get: async (url) => {
      calls.push(url)
      return { status: 200, data: { code: '00', message: 'SUCCESS', data: detail } }
    },
  })

  assert.deepEqual(await api.getPlan(PLAN_ID), detail)
  assert.deepEqual(calls, [`/api/subscription/plans/${PLAN_ID}`])
})

test('UUID v4가 아닌 플랜 ID는 요청 전에 COMMON_001로 거절한다', async () => {
  let called = false
  const api = createPlanApi({
    get: async () => {
      called = true
    },
  })

  await assert.rejects(api.getPlan('nutrition'), (error) => {
    assert.equal(error.status, 400)
    assert.equal(error.code, 'COMMON_001')
    return true
  })
  assert.equal(called, false)
})

test('플랜 없음 응답의 HTTP 상태와 Error Code를 보존한다', async () => {
  const api = createPlanApi({
    get: async () => {
      throw {
        response: {
          status: 404,
          data: { code: 'SUBSCRIPTION_001', message: '플랜을 찾을 수 없습니다.' },
        },
      }
    },
  })

  await assert.rejects(api.getPlan(PLAN_ID), (error) => {
    assert.equal(error.status, 404)
    assert.equal(error.code, 'SUBSCRIPTION_001')
    assert.equal(error.serverMessage, '플랜을 찾을 수 없습니다.')
    return true
  })
})

test('오류 envelope의 HTTP 상태와 Error Code를 보존한다', async () => {
  const api = createPlanApi({
    get: async () => ({
      status: 500,
      data: { code: 'COMMON_098', message: '데이터베이스 오류' },
    }),
  })

  await assert.rejects(api.listPlans(), (error) => {
    assert.equal(error.status, 500)
    assert.equal(error.code, 'COMMON_098')
    assert.equal(error.serverMessage, '데이터베이스 오류')
    return true
  })
})

test('성공 code라도 계약에 없는 목록·상세 구조는 거절한다', async () => {
  const responses = [
    { status: 200, data: { code: '00', data: [] } },
    { status: 200, data: { code: '00', data: { planId: PLAN_ID } } },
  ]
  const api = createPlanApi({ get: async () => responses.shift() })

  await assert.rejects(api.listPlans(), /플랜 목록 응답을 확인할 수 없습니다/)
  await assert.rejects(api.getPlan(PLAN_ID), /플랜 상세 응답을 확인할 수 없습니다/)
})
