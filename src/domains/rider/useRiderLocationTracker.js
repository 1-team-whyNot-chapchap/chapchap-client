import { reactive, readonly } from 'vue'
import http from '../../common/api/http.js'

const SEND_INTERVAL_MS = 5000
const MAX_ACCURACY_M = 50
const MAX_POSITION_AGE_MS = 90_000

const state = reactive({
  active: false,
  permissionError: '',
  latestValidPosition: null,
  lastSentAt: null,
})
let watchId = null
let intervalId = null
let sending = false

function normalize(position) {
  const { latitude, longitude, accuracy } = position.coords
  const timestamp = position.timestamp
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
    accuracy < 0 || accuracy > MAX_ACCURACY_M || !Number.isFinite(timestamp)
  ) return null
  return { latitude, longitude, accuracy, capturedAt: new Date(timestamp).toISOString(), timestamp }
}

async function sendLatest() {
  if (sending || !state.latestValidPosition) return
  const location = state.latestValidPosition
  if (Date.now() - location.timestamp > MAX_POSITION_AGE_MS) return
  sending = true
  try {
    await http.put('/api/delivery/rider/location', {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      capturedAt: location.capturedAt,
    })
    state.lastSentAt = Date.now()
  } catch (error) {
    // The server is authoritative when an admin finished the rider's last delivery.
    if (error.response?.data?.code === 'DELIVERY_048' || error.response?.status === 409) stop()
  } finally {
    sending = false
  }
}

function start() {
  if (state.active || !navigator.geolocation) {
    if (!navigator.geolocation) state.permissionError = '이 브라우저에서는 위치 정보를 사용할 수 없습니다.'
    return
  }
  state.permissionError = ''
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const valid = normalize(position)
      if (valid) state.latestValidPosition = valid
    },
    (error) => {
      state.permissionError = error.code === error.PERMISSION_DENIED
        ? '배송 중 위치 공유 권한이 필요합니다.'
        : '현재 위치를 확인하지 못했습니다. 위치 권한과 신호를 확인해 주세요.'
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
  )
  intervalId = window.setInterval(sendLatest, SEND_INTERVAL_MS)
  state.active = true
}

function stop() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  if (intervalId !== null) window.clearInterval(intervalId)
  watchId = null
  intervalId = null
  sending = false
  state.active = false
  state.latestValidPosition = null
  state.lastSentAt = null
}

/** Shared singleton: individual delivery detail components never own the browser watch. */
export function useRiderLocationTracker() {
  return { state: readonly(state), start, stop, sendLatest }
}
