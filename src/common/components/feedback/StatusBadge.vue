<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

// computed는 status가 바뀔 때 알맞은 색상 이름을 다시 계산합니다.
const statusClass = computed(() => {
  if (['결제 완료', '배송 완료', '이용 중'].includes(props.status)) {
    return 'status-badge--success'
  }

  if (['배송 준비', '결제 확인', '환불 검토'].includes(props.status)) {
    return 'status-badge--warning'
  }

  return 'status-badge--info'
})
</script>

<template>
  <span class="status-badge" :class="statusClass">
    {{ status }}
  </span>
</template>

<style scoped>
.mini-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  font-size: var(--font-caption);
  font-weight: 800;
}

.status-badge {
  padding: 5px 9px;
}
</style>
