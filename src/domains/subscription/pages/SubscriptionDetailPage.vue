<script setup>
import { computed } from 'vue'
import { CalendarDays, ChevronRight, CreditCard, MapPin, Settings2 } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { formatDeliveryDate } from '../../../common/utils/date'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()

const planName = computed(() => planLabels[appStore.currentSubscription.planId])
const paymentMethod = computed(
  () => appStore.paymentMethods.find((method) => method.isDefault) || null,
)

function addressName(addressId) {
  return appStore.addresses.find((address) => address.id === addressId)?.name || '배송지 확인 필요'
}
</script>

<template>
  <div class="page subscription-detail-page">
    <PageBackButton label="내 구독으로" @back="emit('navigate', 'subscription')" />

    <section class="page-intro page-intro--with-action">
      <div>
        <h1>현재 구독을<br />확인하세요.</h1>
        <p>이용 기간과 반복 배송 설정은 현재 적용된 값을 기준으로 표시합니다.</p>
      </div>
      <button class="button button-primary" type="button" @click="emit('navigate', 'wf-024')">
        <Settings2 :size="17" aria-hidden="true" />설정 변경
      </button>
    </section>

    <section class="subscription-status-card" aria-label="현재 구독 상태">
      <div>
        <span>현재 상태</span>
        <StatusBadge :status="appStore.isCancellationScheduled ? '해지 예정' : '이용 중'" />
      </div>
      <dl>
        <div>
          <dt>플랜</dt>
          <dd>{{ planName }}</dd>
        </div>
        <div>
          <dt>이용 기간</dt>
          <dd>
            {{ formatDeliveryDate(appStore.currentSubscription.periodStart) }} ~
            {{ formatDeliveryDate(appStore.currentSubscription.periodEnd) }}
          </dd>
        </div>
        <div>
          <dt>다음 배송</dt>
          <dd>{{ formatDeliveryDate(appStore.currentSubscription.dates.nextDelivery) }}</dd>
        </div>
      </dl>
    </section>

    <section class="detail-section" aria-labelledby="delivery-rule-title">
      <div class="section-heading">
        <div>
          <h2 id="delivery-rule-title">반복 배송 설정</h2>
          <p>요일별로 적용 중인 인원·배송지·시간입니다.</p>
        </div>
        <button class="text-button" type="button" @click="emit('navigate', 'wf-024')">
          수정하기 <ChevronRight :size="15" aria-hidden="true" />
        </button>
      </div>
      <div class="delivery-rule-list">
        <article v-for="rule in appStore.currentSubscription.deliveryRules" :key="rule.id">
          <strong>{{ rule.label }}</strong>
          <span>{{ rule.personCount }}명 · {{ rule.deliveryTime }}</span>
          <span><MapPin :size="15" aria-hidden="true" />{{ addressName(rule.addressId) }}</span>
        </article>
      </div>
    </section>

    <section class="detail-section subscription-meta-grid">
      <article>
        <CreditCard :size="20" aria-hidden="true" />
        <div>
          <h2>자동결제수단</h2>
          <p v-if="paymentMethod">
            {{ paymentMethod.brand }} · **** {{ paymentMethod.lastFourDigits }}
          </p>
          <p v-else>등록된 결제수단이 없습니다.</p>
        </div>
      </article>
      <button type="button" @click="emit('navigate', 'wf-022')">
        <CalendarDays :size="20" aria-hidden="true" /><span
          ><strong>주문 일정</strong><small>생성된 회차를 달력에서 확인</small></span
        ><ChevronRight :size="18" aria-hidden="true" />
      </button>
    </section>
  </div>
</template>

<style scoped>
.subscription-detail-page {
  max-width: 900px;
}
.subscription-status-card {
  margin-top: 30px;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 19px;
  background: var(--color-surface);
}
.subscription-status-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.subscription-status-card > div > span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.subscription-status-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0 0;
}
.subscription-status-card dl div {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}
.subscription-status-card dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-status-card dd {
  margin: 6px 0 0;
  font-size: var(--font-body);
  font-weight: 800;
  line-height: var(--line-height-body);
}
.detail-section {
  margin-top: 42px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.section-heading p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.delivery-rule-list {
  display: grid;
  gap: 0;
  margin-top: 16px;
  border-top: 1px solid var(--color-border);
}
.delivery-rule-list article {
  display: grid;
  grid-template-columns: 100px minmax(160px, 1fr) minmax(120px, 0.7fr);
  align-items: center;
  gap: 12px;
  padding: 15px 4px;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-caption);
}
.delivery-rule-list article > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
}
.subscription-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.subscription-meta-grid > article,
.subscription-meta-grid > button {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 92px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}
.subscription-meta-grid > article > svg {
  color: var(--color-primary-pressed);
}
.subscription-meta-grid h2,
.subscription-meta-grid p {
  margin: 0;
}
.subscription-meta-grid h2,
.subscription-meta-grid strong {
  font-size: var(--font-body);
}
.subscription-meta-grid p,
.subscription-meta-grid small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.subscription-meta-grid > button svg:last-child {
  margin-left: auto;
  color: var(--color-text-muted);
}
@media (max-width: 650px) {
  .page-intro--with-action {
    align-items: stretch;
    flex-direction: column;
  }
  .page-intro--with-action .button {
    width: 100%;
  }
  .subscription-status-card dl,
  .subscription-meta-grid {
    grid-template-columns: 1fr;
  }
  .delivery-rule-list article {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .detail-section {
    margin-top: 32px;
  }
}
</style>
