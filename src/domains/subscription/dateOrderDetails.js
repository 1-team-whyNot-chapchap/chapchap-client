import dayjs from 'dayjs'

const ORDER_DATE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/

export function isOrderDate(value) {
  return (
    typeof value === 'string' &&
    ORDER_DATE.test(value) &&
    dayjs(value).format('YYYY-MM-DD') === value
  )
}

export function orderIdsForDate(orders, date) {
  if (!Array.isArray(orders) || !isOrderDate(date)) return []
  return orders.filter((order) => order?.deliveryDate === date).map((order) => order.orderId)
}
