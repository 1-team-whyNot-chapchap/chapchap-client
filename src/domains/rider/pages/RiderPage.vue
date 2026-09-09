<script setup>
import RiderDeliveryExecution from '../components/RiderDeliveryExecution.vue'
import RiderWorkWorkspace from '../components/RiderWorkWorkspace.vue'

defineProps({ screen: { type: String, default: 'today' } })
</script>

<template>
  <RiderDeliveryExecution v-if="screen === 'detail'" />
  <RiderWorkWorkspace v-else :screen="screen" />
</template>
