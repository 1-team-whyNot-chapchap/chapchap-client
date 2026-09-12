import test from 'node:test'
import assert from 'node:assert/strict'
import { createSummaryLoader, summaryMessage } from './handoffSummary.js'

test('polls pending summary and stops on completion', async () => {
  const values = [],
    scheduled = []
  let calls = 0
  const loader = createSummaryLoader({
    fetchSummary: async () =>
      ++calls === 1 ? { status: 'ACCEPTED' } : { status: 'COMPLETED', summary: '고객 요청' },
    onChange: (value) => values.push(value),
    schedule: (fn) => scheduled.push(fn),
    cancel() {},
  })
  await loader.start()
  assert.equal(scheduled.length, 1)
  await scheduled[0]()
  assert.equal(values.at(-1).summary, '고객 요청')
  assert.equal(scheduled.length, 1)
})

test('late result from old consultation or account is discarded', async () => {
  let resolve
  const values = [],
    scheduled = []
  const loader = createSummaryLoader({
    fetchSummary: () =>
      new Promise((r) => {
        resolve = r
      }),
    onChange: (v) => values.push(v),
    schedule: (fn) => scheduled.push(fn),
    cancel() {},
  })
  const pending = loader.start()
  loader.stop()
  resolve({ status: 'COMPLETED', summary: '이전 고객 개인정보' })
  await pending
  assert.deepEqual(values, [])
  assert.deepEqual(scheduled, [])
})

test('fetch failure retries without preventing chat and terminal failures stop polling', async () => {
  const values = [],
    scheduled = []
  let calls = 0
  const loader = createSummaryLoader({
    fetchSummary: async () => {
      if (++calls === 1) throw Error('network')
      return { status: 'FAILED' }
    },
    onChange: (v) => values.push(v),
    schedule: (fn) => scheduled.push(fn),
    cancel() {},
  })
  await loader.start()
  assert.equal(values[0].error, true)
  await scheduled[0]()
  assert.equal(values[1].status, 'FAILED')
  assert.equal(scheduled.length, 1)
})

test('each non-ready state has actionable Korean text', () => {
  for (const status of [
    'PENDING',
    'SUBMITTED',
    'ACCEPTED',
    'FAILED',
    'SUBMISSION_FAILED',
    'DISABLED',
    'NOT_REQUESTED',
  ]) {
    assert.notEqual(summaryMessage(status), summaryMessage('unknown'))
  }
})

test('late successful callback replaces a submission timeout', async () => {
  let calls = 0
  const values = [],
    scheduled = []
  const loader = createSummaryLoader({
    fetchSummary: async () =>
      ++calls === 1
        ? { status: 'SUBMISSION_FAILED' }
        : { status: 'COMPLETED', summary: '늦게 도착한 요약' },
    onChange: (v) => values.push(v),
    schedule: (fn) => scheduled.push(fn),
    cancel() {},
  })
  await loader.start()
  await scheduled[0]()
  assert.equal(values.at(-1).status, 'COMPLETED')
  assert.equal(scheduled.length, 1)
})
