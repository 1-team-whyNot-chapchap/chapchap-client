// Offset-less API values are local service time; preserve the stated wall clock.
export function displayDateTime(value) {
  if (!value) return '날짜 정보 없음'
  const text = String(value)
  const local = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(text)
  if (
    local &&
    (Number(local[2]) < 1 ||
      Number(local[2]) > 12 ||
      Number(local[3]) < 1 ||
      Number(local[3]) > new Date(Number(local[1]), Number(local[2]), 0).getDate() ||
      Number(local[4]) > 23 ||
      Number(local[5]) > 59)
  )
    return '날짜 정보 없음'
  if (local) return `${local[1]}.${local[2]}.${local[3]} ${local[4]}:${local[5]}`
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음'
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.replaceAll('-', '.')
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}
