import test from 'node:test'
import assert from 'node:assert/strict'
import { displayDateTime } from './displayDate.js'
test('local service times keep the wall clock, explicit offsets convert to Seoul', () => {
  assert.equal(displayDateTime('2026-09-12T13:15:21.123456'), '2026.09.12 13:15')
  assert.equal(displayDateTime('2026-09-12'), '2026.09.12')
  assert.match(displayDateTime('2026-09-12T04:15:00Z'), /13:15/)
  for (const input of [null, 'broken', '2026-13-12T13:00', '2026-02-30T13:00'])
    assert.equal(displayDateTime(input), '날짜 정보 없음')
})
