<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ location: { type: Object, default: null } })
const host = ref(null)
const unavailable = ref('')
let map = null
let marker = null
let kakaoMaps = null

function loadKakaoMap() {
  if (window.kakao?.maps) return Promise.resolve(window.kakao.maps)

  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY
  if (!appKey) return Promise.reject(new Error('카카오맵 설정을 찾을 수 없습니다.'))

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao-map-sdk]')
    if (existing) {
      existing.addEventListener(
        'load',
        () => window.kakao.maps.load(() => resolve(window.kakao.maps)),
        {
          once: true,
        },
      )
      existing.addEventListener(
        'error',
        () => reject(new Error('카카오맵을 불러오지 못했습니다.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.dataset.kakaoMapSdk = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao.maps))
    script.onerror = () => reject(new Error('카카오맵을 불러오지 못했습니다.'))
    document.head.append(script)
  })
}

function updateMarker(location) {
  if (!map || !location) return
  const coordinates = new kakaoMaps.LatLng(location.latitude, location.longitude)
  if (!marker) {
    marker = new kakaoMaps.Marker({
      map,
      position: coordinates,
      title: '배송 기사 현재 위치',
    })
  } else marker.setPosition(coordinates)
  map.setLevel(Math.min(map.getLevel(), 4))
  map.panTo(coordinates)
}

onMounted(async () => {
  try {
    kakaoMaps = await loadKakaoMap()
    const initialLocation = props.location
      ? new kakaoMaps.LatLng(props.location.latitude, props.location.longitude)
      : new kakaoMaps.LatLng(37.5665, 126.978)
    map = new kakaoMaps.Map(host.value, { center: initialLocation, level: 4 })
    updateMarker(props.location)
  } catch (error) {
    unavailable.value = error.message
  }
})
watch(() => props.location, updateMarker, { deep: true })
onBeforeUnmount(() => {
  marker?.setMap(null)
  map = null
})
</script>

<template>
  <div class="rider-location-map" aria-label="기사 현재 위치 지도">
    <div ref="host" class="rider-location-map__canvas" />
    <p v-if="unavailable" class="ui-muted">{{ unavailable }}</p>
  </div>
</template>

<style scoped>
.rider-location-map {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.rider-location-map__canvas {
  height: 280px;
  background: var(--color-primary-soft);
}
.rider-location-map > .ui-muted {
  margin: 12px;
}
</style>
