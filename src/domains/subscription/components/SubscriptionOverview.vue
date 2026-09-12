<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../api/accountDataApi.js'
defineProps({ title: { type: String, default: '내 구독' }, changeNotice: Boolean })
const api = createAccountDataApi(http)
const subscription = ref(null),
  loading = ref(false),
  error = ref('')
let generation = 0
const states = {
  AWAITING_CONFIRMATION: '결제 확인 중',
  SCHEDULED: '시작 예정',
  IN_PROGRESS: '이용 중',
  CANCELLATION_SCHEDULED: '종료 예정',
  PAYMENT_FAILED: '결제 확인 필요',
  CANCELED_BEFORE_START: '시작 전 취소',
  ENDED: '종료',
}
const weekdays = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일',
}
async function load() {
  const id = ++generation
  loading.value = true
  error.value = ''
  subscription.value = null
  try {
    const result = await api.subscription()
    if (id === generation) subscription.value = result
  } catch {
    if (id === generation) error.value = '구독 정보를 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (id === generation) loading.value = false
  }
}
onMounted(load)
onUnmounted(() => generation++)
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
    <p v-if="loading" role="status">구독 정보를 불러오고 있어요.</p>
    <div v-else-if="error" role="alert" class="ui-note">
      <p>{{ error }}</p>
      <button class="button button-secondary" @click="load">다시 시도</button>
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
            states[subscription.subscriptionStatus] || '상태 확인 필요'
          }}</span>
        </div>
        <p v-if="subscription.periodStartDate">
          이용 기간 {{ subscription.periodStartDate }} ~ {{ subscription.periodEndDate }}
        </p>
        <p>{{ subscription.plan?.description }}</p>
        <RouterLink class="button button-secondary" to="/subscription/rounds"
          >주문 일정 보기</RouterLink
        >
      </article>
      <section v-if="subscription.deliveryConditions.length" class="ui-surface">
        <h2>요일별 배송 조건</h2>
        <article
          v-for="rule in subscription.deliveryConditions"
          :key="rule.weekday"
          class="ui-list-item"
        >
          <div>
            <h3>{{ weekdays[rule.weekday] || rule.weekday }} · {{ rule.mealQuantity }}명</h3>
            <p>
              {{
                { LUNCH: '점심', DINNER: '저녁' }[rule.deliveryTimeSlot] || rule.deliveryTimeSlot
              }}
              · {{ rule.address?.name }}
            </p>
            <p>{{ rule.address?.addressLine1 }} {{ rule.address?.addressLine2 }}</p>
          </div>
        </article>
      </section>
      <aside class="ui-note">
        <p>
          {{
            changeNotice
              ? '설정 변경은 적용일과 결제 영향 확인이 필요합니다. 상담에서 변경 가능 여부를 확인해 주세요.'
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
