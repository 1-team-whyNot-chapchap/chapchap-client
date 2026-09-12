<script setup>
import { computed } from 'vue'
import { CalendarDays, Settings2, MapPin } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import { planLabels } from '../../../common/constants/prototypeData'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
const emit = defineEmits(['navigate'])
const store = useAppStore()
const subscription = computed(() => store.currentSubscription)
</script>
<template>
  <div class="workspace-ui design-review-page">
    <header class="ui-heading">
      <div>
        <h1>내 구독</h1>
        <p>나의 식사 일정과 배송 설정을 확인하세요.</p>
      </div>
      <button class="button button-primary" @click="emit('navigate', 'wf-022')">
        <CalendarDays :size="18" aria-hidden="true" />주문 일정 보기
      </button>
    </header>
    <DesignPreview title="내 구독" empty="이용 중인 구독이 없어요.">
      <div v-if="subscription.status === 'active'" class="ui-stack">
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>{{ planLabels[subscription.planId] }}</h2>
            <span class="mini-badge">이용 중</span>
          </div>
          <dl class="ui-details">
            <div>
              <dt>다음 배송</dt>
              <dd>{{ subscription.dates.nextDelivery }}</dd>
            </div>
            <div>
              <dt>다음 결제</dt>
              <dd>{{ subscription.dates.nextPayment }} · 가격 미정</dd>
            </div>
          </dl>
        </section>
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>요일별 배송 설정</h2>
            <button class="button button-secondary" @click="emit('navigate', 'wf-024')">
              <Settings2 :size="18" aria-hidden="true" />설정 변경
            </button>
          </div>
          <article v-for="rule in subscription.deliveryRules" :key="rule.id" class="ui-list-item">
            <span class="ui-icon"><MapPin :size="20" aria-hidden="true" /></span>
            <div>
              <h3>{{ rule.label }} · {{ rule.personCount }}명</h3>
              <p>
                {{ rule.deliveryTime }} ·
                {{
                  store.addresses.find((a) => a.id === rule.addressId)?.name || '배송지 확인 필요'
                }}
              </p>
            </div>
          </article>
        </section>
        <aside class="ui-note ui-row">
          <div>
            <h3>구독 이용에 도움이 필요하세요?</h3>
            <p>취소 가능 여부와 처리 영향은 상담으로 확인해 주세요.</p>
          </div>
          <button class="button button-secondary" @click="emit('navigate', 'consultation-design')">
            상담하기
          </button>
        </aside>
      </div>
      <div v-else class="ui-empty">
        <h2>이용 중인 구독이 없어요.</h2>
        <button class="button button-primary" @click="emit('navigate', 'plans')">
          플랜 살펴보기
        </button>
      </div>
    </DesignPreview>
  </div>
</template>
