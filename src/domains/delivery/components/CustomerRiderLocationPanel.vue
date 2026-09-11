<script setup>
import { onBeforeUnmount, watch } from 'vue'
import RiderLocationMap from './RiderLocationMap.vue'
import { useRiderLocationStream } from '../useRiderLocationStream.js'

const props = defineProps({ deliveryId: { type: String, required: true }, delivering: Boolean })
const emit = defineEmits(['stream-ended'])
const stream = useRiderLocationStream()
const labels = {
  LIVE: '기사 위치를 실시간으로 받는 중',
  UPDATE_DELAYED: '마지막 위치가 지연되고 있습니다',
  LOCATION_UNAVAILABLE: '현재 위치를 아직 확인하지 못했습니다',
  SSE_RECONNECTING: '위치 연결을 다시 시도하고 있습니다',
  ENDED: '배송 위치 공유가 종료되었습니다.',
}
function sync() {
  if (props.delivering && props.deliveryId) stream.start(props.deliveryId)
  else stream.stop()
}
watch(() => [props.deliveryId, props.delivering], sync, { immediate: true })
watch(
  () => [stream.state.status, stream.state.error],
  ([status, error]) => {
    if (status === 'ENDED' || error) emit('stream-ended')
  },
)
onBeforeUnmount(stream.stop)
</script>

<template>
  <section class="ui-surface ui-stack" aria-live="polite">
    <div class="ui-row">
      <h2>기사 현재 위치</h2>
      <span class="mini-badge">{{ labels[stream.state.status] }}</span>
    </div>
    <RiderLocationMap v-if="stream.state.location" :location="stream.state.location" />
    <p v-else class="ui-muted">{{ labels[stream.state.status] }}</p>
    <p v-if="stream.state.error" class="ui-error" role="alert">{{ stream.state.error }}</p>
  </section>
</template>
