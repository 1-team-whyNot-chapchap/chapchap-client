import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsPreviewDays, summarizeAnalytics } from './adminAnalyticsPreview.js'

for (const period of [7, 14]) {
  test(`${period}-day totals agree across every distribution`, () => {
    const days = analyticsPreviewDays.slice(-period)
    const summary = summarizeAnalytics(days)
    assert.equal(days.length, period)
    for (const field of ['plans', 'statuses', 'regions']) {
      assert.equal(
        summary[field].reduce((a, b) => a + b, 0),
        summary.orders,
      )
      for (const day of days) {
        assert.equal(
          day[field].reduce((a, b) => a + b, 0),
          day.orders,
        )
        assert.ok(day[field].every((count) => Number.isInteger(count) && count >= 0))
      }
    }
    assert.equal(days.at(-1).date, '2026-09-09')
  })
}
test('empty totals and date continuity', () => {
  assert.equal(summarizeAnalytics([]).orders, 0)
  analyticsPreviewDays.slice(1).forEach((day, index) => {
    assert.equal(Date.parse(day.date) - Date.parse(analyticsPreviewDays[index].date), 86400000)
  })
})
