import test from 'node:test'
import assert from 'node:assert/strict'
import { createKnowledgePoller, knowledgeStatuses } from './knowledgeProgress.js'
test('processing polls until actual READY contract and cancels stale result', async () => {
  let next,
    calls = 0
  const results = []
  const p = createKnowledgePoller({
    fetchVersion: async () => ({ processingStatus: ++calls === 1 ? 'PROCESSING' : 'READY' }),
    onResult: (x) => results.push(x),
    onError: () => assert.fail(),
    schedule: (fn) => {
      next = fn
      return 1
    },
    cancel: () => {},
  })
  await p.start()
  await next()
  assert.equal(results.length, 2)
  assert.equal(knowledgeStatuses.READY, '처리 완료')
  let resolve
  const q = createKnowledgePoller({
    fetchVersion: () =>
      new Promise((r) => {
        resolve = r
      }),
    onResult: () => assert.fail(),
    onError: () => assert.fail(),
    cancel: () => {},
  })
  const pending = q.start()
  q.stop()
  resolve({ processingStatus: 'READY' })
  await pending
})
test('lookup failure is reported without retrying upload or polling forever', async () => {
  let errors = 0
  const p = createKnowledgePoller({
    fetchVersion: async () => {
      throw new Error()
    },
    onResult: () => assert.fail(),
    onError: () => errors++,
    schedule: () => assert.fail(),
  })
  await p.start()
  assert.equal(errors, 1)
})
