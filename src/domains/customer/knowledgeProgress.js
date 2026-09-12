export const knowledgeStatuses = {
  UPLOADED: '접수됨',
  PROCESSING: '처리 중',
  READY: '처리 완료',
  FAILED: '처리 실패',
}
export function createKnowledgePoller({
  fetchVersion,
  onResult,
  onError,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let stopped = false
  let timer
  async function load() {
    try {
      const value = await fetchVersion()
      if (stopped) return
      onResult(value)
      if (['READY', 'FAILED'].includes(value.processingStatus)) return
      timer = schedule(load, 3000)
    } catch {
      if (!stopped) onError()
    }
  }
  return {
    start: load,
    stop() {
      stopped = true
      cancel(timer)
    },
  }
}
