import test from 'node:test'
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import {
  getSubscriptionPeriod,
  getSubscriptionCalendarDates,
  getDeliveryDatesForWeekdays,
} from './deliveryPolicy.js'

for (const [now, expectedStart, expectedEnd] of [
  ['2026-09-09', '2026-09-14', '2026-10-11'],
  ['2026-12-20', '2026-12-21', '2027-01-17'],
  ['2028-02-06', '2028-02-07', '2028-03-05'],
  ['2026-09-14', '2026-09-21', '2026-10-18'],
]) {
  test(`28-day inclusive cycle and month grids: ${now}`, () => {
    const { start, end } = getSubscriptionPeriod(now)
    assert.equal(start.format('YYYY-MM-DD'), expectedStart)
    assert.equal(end.format('YYYY-MM-DD'), expectedEnd)
    assert.equal(end.diff(start, 'day') + 1, 28)
    const dates = getDeliveryDatesForWeekdays([1, 2, 4], now)
    assert.equal(dates.length, 12)
    assert.equal(new Set(dates).size, 12)
    const grids = [start, end].flatMap((month) =>
      getSubscriptionCalendarDates(month, [1, 2, 4], now),
    )
    assert.deepEqual(
      [...new Set(grids.filter((d) => d.isDeliveryDay).map((d) => d.value))].sort(),
      dates,
    )
    const endGrid = getSubscriptionCalendarDates(end, [1, 2, 4], now)
    assert.equal(endGrid.find((d) => d.value === expectedEnd).isAvailable, true)
    const following = endGrid.find((d) => d.value === end.add(1, 'day').format('YYYY-MM-DD'))
    assert.equal(following.isAvailable, false)
    assert.equal(following.isAfterPeriod, true)
  })
}

test('no weekdays, duplicates, Sunday and months outside the cycle', () => {
  assert.deepEqual(getDeliveryDatesForWeekdays([], '2026-09-09'), [])
  assert.equal(getDeliveryDatesForWeekdays([0, 1, 1], '2026-09-09').length, 4)
  for (const month of ['2026-08-01', '2026-11-01']) {
    const grid = getSubscriptionCalendarDates(month, [1, 2, 3, 4, 5, 6], '2026-09-09')
    assert.equal(grid.length % 7, 0)
    assert.equal(dayjs(grid[0].value).day(), 0)
    assert.equal(
      grid.some((date) => date.isDeliveryDay),
      false,
    )
  }
})
