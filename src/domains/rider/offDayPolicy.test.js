import test from 'node:test'
import assert from 'node:assert/strict'
import { earliestOffDay, isOffDayAllowed, offDayReasons } from './offDayPolicy.js'

test('only annual leave, sick leave and other reasons', () => {
  assert.deepEqual(offDayReasons, ['연차', '병가', '기타'])
})
test('five-day boundary inclusive, counted in Korean calendar days', () => {
  const now = new Date('2026-09-09T12:00:00+09:00')
  assert.equal(isOffDayAllowed(new Date(2026, 8, 13), now), false)
  assert.equal(isOffDayAllowed(new Date(2026, 8, 14), now), true)
  assert.equal(isOffDayAllowed(new Date(2026, 8, 15), now), true)
  assert.equal(isOffDayAllowed(null, now), false)
  assert.equal(isOffDayAllowed(new Date('invalid'), now), false)
})
test('Korean midnight and month/year/leap-year boundaries', () => {
  for (const [now, expected] of [
    ['2026-09-09T14:59:59Z', new Date(2026, 8, 14)],
    ['2026-09-09T15:00:00Z', new Date(2026, 8, 15)],
    ['2026-12-29T00:00:00+09:00', new Date(2027, 0, 3)],
    ['2028-02-25T00:00:00+09:00', new Date(2028, 2, 1)],
  ])
    assert.equal(earliestOffDay(new Date(now)).getTime(), expected.getTime())
})
