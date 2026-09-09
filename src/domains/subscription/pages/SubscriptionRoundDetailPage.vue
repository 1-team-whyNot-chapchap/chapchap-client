<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const round = computed(() => store.selectedRound)
</script>
<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton label="주문 일정으로" @back="emit('navigate', 'wf-022')" />
    <header class="ui-heading">
      <div>
        <h1>주문 상세</h1>
        <p>{{ round?.id }}</p>
      </div>
      <StatusBadge v-if="round" :status="round.status" />
    </header>
    <DesignPreview title="주문 상세" :allow-empty="false">
      <div v-if="round" class="ui-grid">
        <section class="ui-surface ui-stack">
          <h2>식사 구성</h2>
          <article v-for="menu in round.menuItems" :key="menu.id || menu.name" class="ui-list-item">
            <div>
              <h3>{{ menu.name }}</h3>
            </div>
            <strong>{{ menu.quantity }}개</strong>
          </article>
          <dl class="ui-details">
            <div>
              <dt>주문 금액</dt>
              <dd>{{ round.amountLabel }}</dd>
            </div>
          </dl>
        </section>
        <section class="ui-surface ui-stack">
          <h2>주문 당시 배송 조건</h2>
          <dl class="ui-details">
            <div>
              <dt>배송일</dt>
              <dd>{{ round.deliveryDate }}</dd>
            </div>
            <div>
              <dt>배송지</dt>
              <dd>{{ round.addressName }}</dd>
            </div>
            <div>
              <dt>수령 방식</dt>
              <dd>{{ round.deliveryMethod }}</dd>
            </div>
          </dl>
          <p class="ui-note">
            주문과 배송을 직접 연결하는 정보는 준비 중입니다. 배송 내역에서 날짜와 주소를 확인해
            주세요.
          </p>
          <button class="button button-secondary" @click="emit('navigate', 'wf-033')">
            배송 내역 보기
          </button>
        </section>
      </div>
      <div v-else class="ui-empty">
        <h2>주문을 찾을 수 없어요.</h2>
        <button class="button button-secondary" @click="emit('navigate', 'wf-022')">
          주문 일정으로
        </button>
      </div>
    </DesignPreview>
  </div>
</template>
