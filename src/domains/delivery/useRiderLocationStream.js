import { reactive, readonly } from 'vue'
import { authSession } from '../../common/api/http.js'

const RETRY_DELAYS = [1000, 2000, 5000, 10000, 15000]
const INACTIVITY_MS = 45_000

function createParser(onEvent) {
  let buffer = ''
  return (chunk) => {
    buffer += chunk.replace(/\r\n/g, '\n')
    let boundary
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const fields = frame.split('\n').reduce((result, line) => {
        const colon = line.indexOf(':')
        if (colon > 0) result[line.slice(0, colon)] = line.slice(colon + 1).trimStart()
        return result
      }, {})
      if (fields.event) onEvent(fields.event, fields.data ? JSON.parse(fields.data) : null)
    }
  }
}

export function useRiderLocationStream() {
  const state = reactive({
    status: 'SSE_RECONNECTING',
    location: null,
    lastSseReceivedAt: null,
    error: '',
  })
  let controller = null
  let reconnectTimer = null
  let inactivityTimer = null
  let stopped = true
  let retry = 0
  let deliveryId = ''

  function clearTimers() {
    window.clearTimeout(reconnectTimer)
    window.clearInterval(inactivityTimer)
    reconnectTimer = null
    inactivityTimer = null
  }
  function stop() {
    stopped = true
    clearTimers()
    controller?.abort()
    controller = null
  }
  function received() {
    state.lastSseReceivedAt = Date.now()
  }
  function scheduleReconnect(delay) {
    if (stopped) return
    window.clearTimeout(reconnectTimer)
    window.clearInterval(inactivityTimer)
    reconnectTimer = null
    inactivityTimer = null
    state.status = 'SSE_RECONNECTING'
    reconnectTimer = window.setTimeout(connect, delay)
  }
  function nextRetryDelay() {
    const delay = retry < RETRY_DELAYS.length ? RETRY_DELAYS[retry] : 30_000
    retry += 1
    return delay
  }
  function classify(location) {
    const receivedAge = Date.now() - new Date(location.receivedAt).getTime()
    const capturedAge = Date.now() - new Date(location.capturedAt).getTime()
    state.status =
      capturedAge > 90_000
        ? 'LOCATION_UNAVAILABLE'
        : receivedAge > 20_000
          ? 'UPDATE_DELAYED'
          : 'LIVE'
  }
  async function connect() {
    if (stopped) return
    controller = new AbortController()
    try {
      let token = authSession.getAccessToken()
      if (!token) token = await authSession.refreshAccessToken()
      const response = await fetch(
        `/api/delivery/customer/deliveries/${encodeURIComponent(deliveryId)}/rider-location/stream`,
        {
          headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
          credentials: 'include',
          signal: controller.signal,
        },
      )
      if (response.status === 401) {
        try {
          await authSession.refreshAccessToken()
          return scheduleReconnect(0)
        } catch {
          state.error = '로그인 시간이 만료되었습니다.'
          return stop()
        }
      }
      if ([403, 404, 409].includes(response.status)) {
        state.error = '배송 위치 공유를 계속할 수 없습니다.'
        if (response.status === 409) state.status = 'ENDED'
        return stop()
      }
      if (!response.ok || !response.body) throw new Error(`SSE ${response.status}`)
      retry = 0
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const parse = createParser((event, data) => {
        received()
        if (event === 'rider-location') {
          state.location = data
          classify(data)
        } else if (event === 'connected' && !state.location) state.status = 'LOCATION_UNAVAILABLE'
        else if (event === 'tracking-ended') {
          state.status = 'ENDED'
          stop()
        }
      })
      inactivityTimer = window.setInterval(() => {
        if (!state.lastSseReceivedAt || Date.now() - state.lastSseReceivedAt > INACTIVITY_MS) {
          scheduleReconnect(nextRetryDelay())
        }
      }, 1000)
      while (!stopped) {
        const { done, value } = await reader.read()
        if (done) break
        parse(decoder.decode(value, { stream: true }))
      }
      if (!stopped) scheduleReconnect(nextRetryDelay())
    } catch (error) {
      if (!stopped && error.name !== 'AbortError') scheduleReconnect(nextRetryDelay())
    }
  }
  function start(id) {
    stop()
    stopped = false
    retry = 0
    deliveryId = id
    state.location = null
    state.lastSseReceivedAt = null
    state.error = ''
    state.status = 'SSE_RECONNECTING'
    connect()
  }
  return { state: readonly(state), start, stop }
}
