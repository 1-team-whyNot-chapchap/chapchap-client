// Reads may be retried; message writes must never be replayed.
export function createConsultationHistorySync({
  load,
  apply,
  onError,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let stopped = true,
    version = 0,
    timer
  async function sync(current) {
    try {
      const value = await load()
      if (!stopped && current === version) apply(value)
    } catch {
      if (stopped || current !== version) return
      onError()
      timer = schedule(() => sync(current), 3000)
    }
  }
  return {
    start() {
      this.stop()
      stopped = false
      sync(++version)
    },
    stop() {
      stopped = true
      version++
      cancel(timer)
    },
  }
}
