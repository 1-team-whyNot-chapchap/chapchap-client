import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

export function formatDeliveryDate(date) {
  return dayjs(date).format('M월 D일 (ddd)')
}
