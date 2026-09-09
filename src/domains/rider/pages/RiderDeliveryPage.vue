<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRiderPreviewStore } from '../riderPreviewStore'
import RiderNavigation from '../components/RiderNavigation.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import '../rider-wire.css'
const store = useRiderPreviewStore()
const quantity = computed(() => store.deliveries.reduce((total, row) => total + row.quantity, 0))
const status = computed(() =>
  store.workStarted ? '근무 중' : store.assignment.confirmed ? '확인 완료' : '확인 필요',
)
</script>
<template>
  <div class="workspace-ui rider-workspace design-review-page rider-wire">
    <RiderNavigation />
    <header class="ui-heading">
      <div>
        <h1>오늘의 배송</h1>
        <p>오늘 배정된 배송 목록을 한 번에 확인합니다.</p>
      </div>
      <span class="mini-badge">{{ status }}</span>
    </header>
    <DesignPreview title="오늘의 배송" empty="배정된 배송이 없어요.">
      <dl class="rider-wire-summary">
        <div>
          <dt>방문지</dt>
          <dd>{{ store.deliveries.length }}<small>곳</small></dd>
        </div>
        <div>
          <dt>도시락</dt>
          <dd>{{ quantity }}<small>개</small></dd>
        </div>
      </dl>
      <div class="rider-wire-list-heading">
        <h2>배정 목록</h2>
        <p>{{ store.assignment.date }} · {{ store.assignment.slot }}</p>
      </div>
      <section class="rider-wire-assignments" aria-label="배정 목록">
        <div class="rider-wire-table-head">
          <span>순서 / 배송 지역</span><span>전달 방식</span><span>수량</span><span>상세</span>
        </div>
        <article
          v-for="(delivery, index) in store.deliveries"
          :key="delivery.id"
          class="rider-wire-row"
        >
          <div class="rider-wire-place">
            <strong
              >{{ index + 1 }} · {{ delivery.address.split(' ').slice(0, 2).join(' ') }}</strong
            ><small>{{
              store.workStarted ? delivery.status : '근무 시작 후 상세 확인 가능'
            }}</small>
          </div>
          <span>{{ delivery.method }}</span
          ><strong>{{ delivery.quantity }}개</strong>
          <RouterLink
            v-if="store.workStarted"
            class="button button-secondary"
            :to="{
              name: 'rider-delivery-detail',
              params: { deliveryId: delivery.id },
              query: { assignmentId: store.assignment.id },
            }"
            >상세</RouterLink
          >
          <span v-else class="ui-muted" aria-label="근무 시작 후 상세 확인 가능">—</span>
        </article>
        <p v-if="!store.deliveries.length" class="ui-empty">배정된 배송이 없어요.</p>
      </section>
      <div v-if="!store.workStarted" class="rider-wire-actions">
        <RouterLink class="button button-secondary" to="/rider/issues">이슈 제기</RouterLink>
        <button
          v-if="!store.assignment.confirmed"
          class="button button-primary"
          type="button"
          :disabled="!store.deliveries.length"
          @click="store.assignment.confirmed = true"
        >
          확인
        </button>
        <button
          v-else
          class="button button-primary"
          type="button"
          @click="store.workStarted = true"
        >
          근무 시작
        </button>
      </div>
      <p v-else class="ui-note" role="status">
        근무 중 · 각 배송 행의 상세 버튼에서 배송 정보를 확인할 수 있습니다. 실제 근무 시작 요청은
        전송하지 않았습니다.
      </p>
    </DesignPreview>
  </div>
</template>
