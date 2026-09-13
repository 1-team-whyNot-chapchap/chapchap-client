import test from 'node:test'
import assert from 'node:assert/strict'
import { createConsultationHistorySync } from './consultationHistory.js'
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('history recovery retries failed reads and stops after success', async () => {
  const jobs = [],
    values = []
  let calls = 0
  const sync = createConsultationHistorySync({
    load: async () => {
      if (++calls < 3) throw Error('offline')
      return ['missed message']
    },
    apply: (value) => values.push(value),
    onError() {},
    schedule: (fn) => jobs.push(fn),
    cancel() {},
  })
  sync.start()
  await tick()
  jobs.shift()()
  await tick()
  jobs.shift()()
  await tick()
  assert.deepEqual(values, [['missed message']])
  assert.equal(jobs.length, 0)
  sync.stop()
})

test('logout or conversation change discards late history and pending retries', async () => {
  let finish
  const values = [],
    jobs = []
  const sync = createConsultationHistorySync({
    load: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
    apply: (value) => values.push(value),
    onError() {},
    schedule: (fn) => jobs.push(fn),
    cancel() {},
  })
  sync.start()
  sync.stop()
  finish(['private old history'])
  await tick()
  assert.deepEqual(values, [])
  assert.deepEqual(jobs, [])
})
