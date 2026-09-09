// 디자인 검수 전용 가상 데이터. 실제 운영 목록·주문·성과 집계가 아닙니다.
const volumes = [82, 91, 76, 64, 88, 103, 96, 101, 114, 89, 72, 108, 121, 116]
export const analyticsPreviewDays = volumes.map((orders, index) => {
  const healthy = Math.floor(orders * 0.3)
  const nutrition = Math.floor(orders * 0.45)
  const failed = [1, 2, 0, 1, 2, 1, 0, 2, 1, 3, 0, 1, 2, 2][index]
  const preparing = index === 13 ? 21 : 0
  const delivering = index === 13 ? 34 : 0
  const seocho = Math.floor(orders * 0.4)
  const gangnam = Math.floor(orders * 0.35)
  return {
    date: new Date(Date.UTC(2026, 7, 27 + index)).toISOString().slice(0, 10),
    orders,
    plans: [healthy, nutrition, orders - healthy - nutrition],
    statuses: [orders - failed - preparing - delivering, delivering, preparing, failed],
    regions: [seocho, gangnam, orders - seocho - gangnam],
  }
})

export function summarizeAnalytics(days) {
  return days.reduce(
    (result, day) => {
      result.orders += day.orders
      for (const field of ['plans', 'statuses', 'regions']) {
        day[field].forEach((count, index) => {
          result[field][index] += count
        })
      }
      return result
    },
    { orders: 0, plans: [0, 0, 0], statuses: [0, 0, 0, 0], regions: [0, 0, 0] },
  )
}
