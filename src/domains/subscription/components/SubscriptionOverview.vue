<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  deliveryTimeSlotLabel,
  deliveryWeekdayLabel,
  formatSubscriptionAddress,
  subscriptionStatusLabel,
} from '../currentSubscriptionDisplay.js'
import { useCurrentSubscriptionStore } from '../stores/useCurrentSubscriptionStore.js'

defineProps({ title: { type: String, default: '내 구독' }, changeNotice: Boolean })
const subscriptionStore = useCurrentSubscriptionStore()
const subscription = computed(() => subscriptionStore.subscription)

onMounted(() => subscriptionStore.fetchCurrentSubscription())

function retry() {
  subscriptionStore.fetchCurrentSubscription(true)
}
</script>
<template>
  <section class="workspace-ui subscription-overview">
    <header class="ui-heading">
      <div>
        <h1>{{ title }}</h1>
        <p>현재 적용 중인 구독과 배송 조건을 확인하세요.</p>
      </div>
      <RouterLink class="button button-secondary" to="/plans">플랜 보기</RouterLink>
    </header>
    <p v-if="['idle', 'loading'].includes(subscriptionStore.status)" role="status">
      구독 정보를 불러오고 있어요.
    </p>
    <div v-else-if="subscriptionStore.status === 'error'" role="alert" class="ui-note">
      <p>
        {{
          subscriptionStore.error?.message || '구독 정보를 불러오지 못했습니다. 다시 시도해 주세요.'
        }}
      </p>
      <button class="button button-secondary" type="button" @click="retry">다시 시도</button>
    </div>
    <div v-else-if="!subscription" class="ui-empty">
      <h2>이용 중인 구독이 없어요.</h2>
      <RouterLink class="button button-primary" to="/plans">플랜 살펴보기</RouterLink>
    </div>
    <div v-else class="ui-stack">
      <article class="ui-surface ui-stack">
        <div class="ui-row">
          <h2>{{ subscription.plan?.name || '현재 적용 중인 플랜 없음' }}</h2>
          <span class="mini-badge">{{
            subscriptionStatusLabel(subscription.subscriptionStatus)
          }}</span>
        </div>
        <p v-if="subscription.periodStartDate">
          이용 기간 {{ subscription.periodStartDate }} ~ {{ subscription.periodEndDate }}
        </p>
        <p>{{ subscription.plan?.description }}</p>
        <div class="ui-actions">
          <RouterLink class="button button-secondary" to="/subscription/rounds"
            >주문 일정 보기</RouterLink
          >
          <RouterLink
            v-if="subscription.subscriptionStatus === 'IN_PROGRESS'"
            class="button button-primary"
            to="/subscription/settings"
            >구독 설정 변경</RouterLink
          >
        </div>
      </article>
      <section v-if="subscription.deliveryConditions.length" class="ui-surface">
        <h2>요일별 배송 조건</h2>
        <article
          v-for="rule in subscription.deliveryConditions"
          :key="rule.weekday"
          class="ui-list-item"
        >
          <div>
            <h3>{{ deliveryWeekdayLabel(rule.weekday) }} · {{ rule.mealQuantity }}명</h3>
            <p>
              {{ deliveryTimeSlotLabel(rule.deliveryTimeSlot) }}
              · {{ rule.address?.name }}
            </p>
            <p>{{ formatSubscriptionAddress(rule.address) }}</p>
          </div>
        </article>
      </section>
      <aside class="ui-note">
        <p>
          {{
            changeNotice
              ? '설정 변경은 적용일과 결제 영향 확인이 필요합니다. 변경 조건을 선택한 뒤 서버 계산 결과를 확인해 주세요.'
              : '구독 변경이나 이용 관련 도움이 필요하면 상담을 이용해 주세요.'
          }}
        </p>
        <div class="ui-actions ui-actions--end">
          <RouterLink class="button button-secondary" to="/help/chat">상담하기</RouterLink>
        </div>
      </aside>
    </div>
  </section>
</template>
