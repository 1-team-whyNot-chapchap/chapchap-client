export function createSseDecoder(onEvent) {
  let buffer = ''
  return (chunk) => {
    buffer += chunk
    if (buffer.length > 1024 * 1024) throw new Error('알림 응답이 너무 큽니다.')
    let match
    while ((match = /\r?\n\r?\n/.exec(buffer))) {
      const block = buffer.slice(0, match.index)
      buffer = buffer.slice(match.index + match[0].length)
      let type = 'message'
      const data = []
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) type = line.slice(6).trim()
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
      }
      if (data.length) onEvent(type, data.join('\n'))
    }
  }
}

export function createNotificationStream({
  open,
  onNotification,
  onState,
  onConnected = () => {},
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let stopped = true,
    version = 0,
    controller,
    timer,
    attempts = 0
  async function connect(currentVersion) {
    if (stopped || version !== currentVersion) return
    controller = new AbortController()
    onState('connecting')
    try {
      const response = await open(controller.signal)
      if (stopped || version !== currentVersion) {
        await response.data.cancel()
        return
      }
      const reader = response.data.getReader(),
        decoder = new TextDecoder()
      onState('connected')
      attempts = 0
      onConnected()
      const parse = createSseDecoder((type, data) => {
        if (type === 'notification') onNotification(JSON.parse(data))
      })
      try {
        while (!stopped && currentVersion === version) {
          const { value, done } = await reader.read()
          if (done) break
          parse(decoder.decode(value, { stream: true }))
        }
      } finally {
        await reader.cancel().catch(() => {})
        reader.releaseLock()
      }
    } catch {
      /* Authentication and response failures are handled by the shared HTTP client. */
    }
    if (stopped || currentVersion !== version) return
    if (attempts >= 6) {
      onState('failed')
      return
    }
    onState('reconnecting')
    timer = schedule(() => connect(currentVersion), Math.min(30000, 1000 * 2 ** attempts++))
  }
  return {
    start() {
      this.stop()
      stopped = false
      attempts = 0
      connect(++version)
    },
    stop() {
      stopped = true
      version++
      cancel(timer)
      controller?.abort()
      onState('closed')
    },
  }
}
