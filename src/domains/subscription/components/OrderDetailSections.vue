<script setup>
import { PackageCheck } from 'lucide-vue-next'
import { deliveryMethodLabel } from '../../delivery/deliveryMethodLabel.js'
import { deliveryTimeSlotLabel } from '../currentSubscriptionDisplay.js'

defineProps({
  order: {
    type: Object,
    required: true,
  },
})

const refundStatuses = {
  PENDING: '처리 대기',
  COMPLETED: '환불 완료',
  FAILED: '환불 실패',
  REVIEW_REQUIRED: '확인 필요',
}

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString('ko-KR')}원`
}
</script>

<template>
  <section class="detail-card detail-card--menu">
    <img v-if="order.imageUrl" :src="order.imageUrl" :alt="`${order.menuName} 메뉴`" />
    <div v-else class="menu-placeholder">
      <PackageCheck :size="32" aria-hidden="true" />메뉴 이미지 준비 중
    </div>
    <div>
      <p class="section-kicker">{{ order.planName }}</p>
      <h2>{{ order.menuName }}</h2>
      <p v-if="order.menuDescription">{{ order.menuDescription }}</p>
      <p>{{ order.mealQuantity }}식 · {{ deliveryTimeSlotLabel(order.deliveryTimeSlot) }}</p>
    </div>
  </section>

  <section class="detail-card">
    <h2>메뉴</h2>
    <dl>
      <div>
        <dt>알레르기</dt>
        <dd>{{ order.allergenInfo || '정보 없음' }}</dd>
      </div>
      <div>
        <dt>영양</dt>
        <dd>{{ order.nutritionInfo || '정보 없음' }}</dd>
      </div>
      <div>
        <dt>원재료</dt>
        <dd>{{ order.ingredientInfo || '정보 없음' }}</dd>
      </div>
    </dl>
  </section>

  <section class="detail-card">
    <h2>배송지</h2>
    <dl>
      <div>
        <dt>수령인</dt>
        <dd>{{ order.recipientName }} · {{ order.recipientPhone }}</dd>
      </div>
      <div>
        <dt>주소</dt>
        <dd>{{ [order.addressLine1, order.addressLine2].filter(Boolean).join(' ') }}</dd>
      </div>
      <div>
        <dt>배송 방식</dt>
        <dd>{{ deliveryMethodLabel(order.deliveryMethodCode) }}</dd>
      </div>
      <div v-if="order.otherDeliveryRequest">
        <dt>배송 요청</dt>
        <dd>{{ order.otherDeliveryRequest }}</dd>
      </div>
    </dl>
  </section>

  <section v-if="order.refund" class="detail-card">
    <h2>연결된 환불</h2>
    <dl>
      <div>
        <dt>상태</dt>
        <dd>{{ refundStatuses[order.refund.status] || '상태 확인 필요' }}</dd>
      </div>
      <div>
        <dt>요청 금액</dt>
        <dd>{{ formatAmount(order.refund.requestedAmount) }}</dd>
      </div>
      <div>
        <dt>완료 금액</dt>
        <dd>{{ formatAmount(order.refund.refundedAmount) }}</dd>
      </div>
      <div>
        <dt>미처리 금액</dt>
        <dd>{{ formatAmount(order.refund.unprocessedAmount) }}</dd>
      </div>
    </dl>
  </section>

  <aside class="readonly-notice">
    주문 당시 확정된 메뉴·수량·배송 정보입니다. 이 화면에서는 개별 주문을 변경하거나 미룰 수
    없습니다.
  </aside>
</template>

<style scoped>
.detail-card {
  display: grid;
  gap: 14px;
  padding: 20px;
  margin-top: 16px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.detail-card h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.detail-card dl {
  display: grid;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--color-border);
}
.detail-card dl div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-card dt {
  color: var(--color-text-muted);
}
.detail-card dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
}
.detail-card--menu {
  grid-template-columns: 180px minmax(0, 1fr);
  align-items: center;
  padding: 0 20px 0 0;
  overflow: hidden;
}
.detail-card--menu img,
.menu-placeholder {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: var(--color-surface-subtle);
}
.menu-placeholder {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.detail-card--menu > div:last-child {
  padding: 20px 0;
}
.detail-card--menu h2,
.detail-card--menu p {
  margin: 0;
}
.detail-card--menu p:not(.section-kicker) {
  margin-top: 8px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.readonly-notice {
  padding: 15px;
  margin-top: 16px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
@media (max-width: 560px) {
  .detail-card {
    padding: 16px;
  }
  .detail-card--menu {
    grid-template-columns: 1fr;
    padding: 0;
  }
  .detail-card--menu img,
  .menu-placeholder {
    height: 200px;
  }
  .detail-card--menu > div:last-child {
    padding: 16px;
  }
  .detail-card dl div {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
