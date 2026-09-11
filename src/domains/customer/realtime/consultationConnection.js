export function createStompDecoder(onFrame) {
  let buffer = ''
  return (chunk) => {
    buffer += chunk
    if (buffer.length > 1024 * 1024) throw new Error('상담 메시지가 너무 큽니다.')
    let end
    while ((end = buffer.indexOf('\0')) !== -1) {
      const frame = buffer.slice(0, end).replace(/\r\n/g, '\n').replace(/^\s+/, '')
      buffer = buffer.slice(end + 1)
      const split = frame.indexOf('\n\n')
      if (split < 0) continue
      const lines = frame.slice(0, split).split('\n')
      const command = lines.shift().trim(),
        headers = {}
      for (const line of lines) {
        const at = line.indexOf(':')
        if (at > 0) headers[line.slice(0, at)] = line.slice(at + 1).trim()
      }
      onFrame({ command, headers, body: frame.slice(split + 2) })
    }
    if (/^\s+$/.test(buffer)) buffer = ''
  }
}

export function createConsultationConnection({
  consultationId,
  url,
  ticket,
  onMessage,
  onState,
  onConnected = () => {},
  connectSocket = (url, protocols) => new WebSocket(url, protocols),
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  if (!/^[1-9][0-9]*$/.test(String(consultationId)))
    throw new Error('상담 번호가 올바르지 않습니다.')
  let socket,
    timer,
    handshakeTimer,
    stopped = true,
    generation = 0,
    attempts = 0,
    connected = false
  const destination = `/topic/consultations/${consultationId}`
  const frame = (command, headers = {}, body = '') =>
    `${command}\n${Object.entries(headers)
      .map(([k, v]) => `${k}:${v}\n`)
      .join('')}\n${body}\0`
  function retry(version) {
    connected = false
    cancel(handshakeTimer)
    if (stopped || version !== generation) return
    if (attempts >= 6) {
      onState('failed')
      return
    }
    onState('reconnecting')
    timer = schedule(() => connect(version), Math.min(30000, 1000 * 2 ** attempts++))
  }
  async function connect(version) {
    if (stopped || version !== generation) return
    onState('connecting')
    try {
      const credential = await ticket()
      if (stopped || version !== generation) return
      if (!/^[A-Za-z0-9_-]{43}$/.test(credential)) throw new Error('연결 인증 실패')
      const current = connectSocket(url, ['v12.stomp', `ticket.${credential}`])
      socket = current
      handshakeTimer = schedule(() => current.close(), 10000)
      const decode = createStompDecoder(({ command, headers, body }) => {
        if (stopped || version !== generation || socket !== current) return
        if (command === 'CONNECTED') {
          cancel(handshakeTimer)
          current.send(frame('SUBSCRIBE', { id: 'consultation', destination, ack: 'auto' }))
          connected = true
          attempts = 0
          onState('connected')
          onConnected()
        } else if (command === 'MESSAGE' && headers.destination === destination)
          onMessage(JSON.parse(body))
        else if (command === 'ERROR') current.close()
      })
      current.onopen = () => {
        if (!stopped && version === generation)
          current.send(
            frame('CONNECT', {
              'accept-version': '1.2',
              host: new URL(url).host,
              'heart-beat': '0,0',
            }),
          )
      }
      current.onmessage = (event) => {
        try {
          decode(event.data)
        } catch {
          current.close()
        }
      }
      current.onclose = () => {
        if (socket === current) retry(version)
      }
      current.onerror = () => current.close()
    } catch {
      retry(version)
    }
  }
  return {
    start() {
      this.stop()
      stopped = false
      attempts = 0
      connect(++generation)
    },
    stop() {
      stopped = true
      generation++
      connected = false
      cancel(timer)
      cancel(handshakeTimer)
      const previous = socket
      socket = null
      previous?.close()
      onState('closed')
    },
    send(content) {
      if (!connected || stopped || socket?.readyState !== 1)
        throw new Error('연결 후 다시 시도해 주세요.')
      const text = content.trim()
      if (!text || text.length > 2000 || text.includes('\0'))
        throw new Error('메시지를 확인해 주세요.')
      socket.send(
        frame(
          'SEND',
          {
            destination: `/app/consultations/${consultationId}/messages`,
            'content-type': 'application/json',
          },
          JSON.stringify({ content: text }),
        ),
      )
    },
  }
}
