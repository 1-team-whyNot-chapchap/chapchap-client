<script setup>
import { computed, ref } from 'vue'
import { Check, ClipboardList, Truck } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const emit = defineEmits(['navigate'])
const riders = ['박지민 라이더', '최유진 라이더', '한도윤 라이더']
const orders = ref([
  {
    id: 'CH-240812-18',
    customer: '김하늘',
    slot: '12:00 ~ 13:00',
    meals: '저당 도시락 2개',
    rider: '',
  },
  {
    id: 'CH-240812-21',
    customer: '이도윤',
    slot: '12:30 ~ 13:30',
    meals: '균형 식단 1개',
    rider: '박지민 라이더',
  },
  {
    id: 'CH-240812-25',
    customer: '최서윤',
    slot: '13:00 ~ 14:00',
    meals: '든든 도시락 1개',
    rider: '',
  },
])
const selected = ref({})
const message = ref('')
const unassigned = computed(() => orders.value.filter((order) => !order.rider).length)

function assign(order) {
  const rider = selected.value[order.id]
  if (!rider) {
    message.value = '배정할 라이더를 먼저 선택해 주세요.'
    return
  }
  order.rider = rider
  message.value = `${order.customer}님 배송을 ${rider}에게 배정했어요.`
}
</script>

<template>
  <section class="page assignment-page">
    <PageBackButton label="점주 운영으로" @back="emit('navigate', 'owner-dashboard')" />
    <header>
      <h1>픽업 준비 주문을 라이더에게 배정하세요.</h1>
      <p>연결된 라이더만 선택할 수 있으며, 배정 변경은 배송 처리 전까지 가능합니다.</p>
    </header>
    <section class="assignment-summary">
      <Truck :size="22" aria-hidden="true" />
      <div>
        <strong>{{ unassigned }}건</strong><span>아직 라이더 배정이 필요한 주문</span>
      </div>
      <p>배정 후 라이더의 오늘 배송 목록에 표시됩니다.</p>
    </section>
    <p v-if="message" class="assignment-feedback" role="status">{{ message }}</p>
    <section class="assignment-list" aria-labelledby="assignment-title">
      <div class="section-heading">
        <h2 id="assignment-title">오늘의 배송 배정</h2>
        <span>{{ orders.length }}건</span>
      </div>
      <ul>
        <li v-for="order in orders" :key="order.id">
          <div class="order-info">
            <strong>{{ order.customer }}님 · {{ order.meals }}</strong
            ><span>{{ order.slot }} · {{ order.id }}</span>
          </div>
          <div class="assignment-control">
            <p v-if="order.rider" class="assigned">
              <Check :size="16" aria-hidden="true" />{{ order.rider }} 배정됨
            </p>
            <select
              v-else
              v-model="selected[order.id]"
              :aria-label="`${order.customer}님 배송 라이더 선택`"
            >
              <option value="">라이더 선택</option>
              <option v-for="rider in riders" :key="rider" :value="rider">
                {{ rider }}
              </option></select
            ><button class="button button-primary" type="button" @click="assign(order)">
              {{ order.rider ? '배정 변경' : '배정하기' }}
            </button>
          </div>
        </li>
      </ul>
    </section>
    <aside class="assignment-note">
      <ClipboardList :size="19" aria-hidden="true" />
      <p>
        실제 배정은 점주의 매장 소유권, 라이더 연결 상태, 배송 상태와 중복 배정을 서버에서 검증해야
        합니다.
      </p>
    </aside>
  </section>
</template>

<style scoped>
.assignment-page {
  max-width: 920px;
}
.back-button {
  margin-bottom: 28px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.assignment-page h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.assignment-page header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.assignment-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(180px, 0.8fr);
  gap: 14px;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-primary-soft);
}
.assignment-summary > svg {
  color: var(--color-primary-pressed);
}
.assignment-summary strong,
.assignment-summary span {
  display: block;
}
.assignment-summary strong {
  font-size: var(--font-section-title);
}
.assignment-summary span,
.assignment-summary p {
  margin: 2px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.assignment-summary p {
  line-height: var(--line-height-body);
}
.assignment-feedback {
  margin: 14px 0 0;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
}
.assignment-list {
  margin-top: 28px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.section-heading span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.assignment-list ul {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}
.assignment-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 17px 0;
  border-bottom: 1px solid var(--color-border);
}
.order-info strong,
.order-info span {
  display: block;
}
.order-info span {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.assignment-control {
  display: flex;
  align-items: center;
  gap: 9px;
}
.assignment-control select {
  min-height: 42px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  font: inherit;
  font-size: var(--font-caption);
}
.assignment-control select:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.assignment-control .button {
  min-height: 42px;
}
.assigned {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 800;
}
.assignment-note {
  display: flex;
  gap: 10px;
  margin-top: 25px;
  padding: 15px;
  border-radius: 14px;
  background: var(--color-warning-soft);
  color: #78601c;
}
.assignment-note p {
  margin: 0;
  color: inherit;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 650px) {
  .assignment-summary {
    grid-template-columns: auto 1fr;
  }
  .assignment-summary p {
    grid-column: 1/-1;
  }
  .assignment-list li {
    align-items: stretch;
    flex-direction: column;
  }
  .assignment-control {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }
  .assignment-control select,
  .assignment-control .button {
    width: 100%;
  }
}
</style>
