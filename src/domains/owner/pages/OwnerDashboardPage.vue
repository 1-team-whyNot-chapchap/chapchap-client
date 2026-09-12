<script setup>
import { computed, ref } from 'vue'
import { Check, ClipboardList, KeyRound, PackageCheck, Truck } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])

const orders = ref([
  {
    id: 'CH-240812-18',
    customer: '김하늘',
    menu: '저당 도시락 2개',
    pickup: '11:30',
    status: '준비 중',
  },
  {
    id: 'CH-240812-21',
    customer: '이도윤',
    menu: '균형 식단 1개',
    pickup: '12:00',
    status: '주문 확인',
  },
])
const readyCount = computed(
  () => orders.value.filter((order) => order.status === '준비 완료').length,
)
function advanceOrder(order) {
  order.status = order.status === '주문 확인' ? '준비 중' : '준비 완료'
}
</script>

<template>
  <section class="page owner-page">
    <header class="role-heading">
      <h1>오늘의 생산과 픽업을 관리하세요.</h1>
      <p>실제 주문 연동 전까지는 예시 데이터로 동작합니다.</p>
    </header>
    <div class="owner-summary" aria-label="오늘의 운영 요약">
      <article>
        <ClipboardList :size="22" aria-hidden="true" /><strong>{{ orders.length }}</strong
        ><span>오늘 주문</span>
      </article>
      <article>
        <PackageCheck :size="22" aria-hidden="true" /><strong>{{ readyCount }}</strong
        ><span>준비 완료</span>
      </article>
    </div>
    <section class="owner-link-panel" aria-label="라이더 연결 관리">
      <div>
        <KeyRound :size="20" aria-hidden="true" />
        <div>
          <strong>라이더 연결</strong><span>이번 달 초대 코드와 연결 상태를 관리하세요.</span>
        </div>
      </div>
      <button
        class="button button-secondary"
        type="button"
        @click="emit('navigate', 'owner-invitations')"
      >
        초대 코드 관리
      </button>
    </section>
    <section class="owner-link-panel owner-link-panel--assignment" aria-label="배송 배정 관리">
      <div>
        <Truck :size="20" aria-hidden="true" />
        <div>
          <strong>배송 배정</strong><span>픽업 준비 주문을 연결 라이더에게 배정하세요.</span>
        </div>
      </div>
      <button
        class="button button-secondary"
        type="button"
        @click="emit('navigate', 'owner-delivery-assignment')"
      >
        배송 배정 관리
      </button>
    </section>
    <section class="owner-link-panel" aria-label="점주 운영 관리">
      <div>
        <PackageCheck :size="20" aria-hidden="true" />
        <div>
          <strong>라이더·생산 관리</strong
          ><span>연결 라이더 상태와 배송일별 총 생산 수량을 관리하세요.</span>
        </div>
      </div>
      <button
        class="button button-secondary"
        type="button"
        @click="emit('navigate', 'owner-operations')"
      >
        운영 관리 열기
      </button>
    </section>
    <section class="owner-panel" aria-labelledby="owner-orders-title">
      <div class="section-heading">
        <h2 id="owner-orders-title">픽업 대기 주문</h2>
        <span>고객이 도착하기 전 상태를 갱신해 주세요.</span>
      </div>
      <ul class="role-list">
        <li v-for="order in orders" :key="order.id">
          <div>
            <strong>{{ order.menu }}</strong
            ><span>{{ order.customer }} · {{ order.pickup }} 픽업</span
            ><small>{{ order.id }}</small>
          </div>
          <button class="button button-primary" type="button" @click="advanceOrder(order)">
            <Check :size="17" aria-hidden="true" />{{ order.status }}
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.owner-page {
  max-width: var(--content-max-width);
}
.role-heading {
  max-width: 680px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.role-heading h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.role-heading > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
}
.owner-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 30px;
}
.owner-summary article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  align-items: center;
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.owner-summary svg {
  grid-row: span 2;
  color: var(--color-primary-pressed);
}
.owner-summary strong {
  font-size: var(--font-section-title);
}
.owner-summary span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.owner-panel {
  margin-top: 24px;
  padding: 26px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}
.owner-link-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 17px 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-primary-soft);
}
.owner-link-panel > div {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  color: var(--color-primary-pressed);
}
.owner-link-panel strong,
.owner-link-panel span {
  display: block;
}
.owner-link-panel--assignment {
  background: var(--color-surface);
}
.owner-link-panel strong {
  color: var(--color-text);
}
.owner-link-panel span {
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.section-heading span {
  color: var(--color-text-muted);
  font-size: var(--font-body);
}
.role-list {
  display: grid;
  gap: 1px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}
.role-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-border);
}
.role-list li > div {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.role-list span,
.role-list small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.role-list .button {
  flex: none;
}
@media (max-width: 560px) {
  .owner-summary {
    grid-template-columns: 1fr;
  }
  .owner-panel {
    padding: 20px;
  }
  .owner-link-panel {
    align-items: flex-start;
    flex-direction: column;
  }
  .owner-link-panel .button {
    width: 100%;
  }
  .role-list li {
    align-items: flex-start;
    flex-direction: column;
  }
  .role-list .button {
    width: 100%;
  }
}
</style>
