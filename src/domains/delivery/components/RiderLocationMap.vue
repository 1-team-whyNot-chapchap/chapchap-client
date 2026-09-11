<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ location: { type: Object, default: null } })
const host = ref(null)
const unavailable = ref('')
let map = null
let marker = null
let leaflet = null

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  return new Promise((resolve, reject) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.append(css)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('지도를 불러오지 못했습니다.'))
    document.head.append(script)
  })
}
function updateMarker(location) {
  if (!map || !location) return
  const coordinates = [location.latitude, location.longitude]
  if (!marker) marker = leaflet.marker(coordinates).addTo(map).bindTooltip('배송 기사 현재 위치')
  else marker.setLatLng(coordinates)
  map.setView(coordinates, Math.max(map.getZoom(), 15), { animate: true })
}

onMounted(async () => {
  try {
    leaflet = await loadLeaflet()
    map = leaflet.map(host.value, { zoomControl: true }).setView([37.5665, 126.978], 12)
    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      })
      .addTo(map)
    updateMarker(props.location)
  } catch (error) {
    unavailable.value = error.message
  }
})
watch(() => props.location, updateMarker, { deep: true })
onBeforeUnmount(() => map?.remove())
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
