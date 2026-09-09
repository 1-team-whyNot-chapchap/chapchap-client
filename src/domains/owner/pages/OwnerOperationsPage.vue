<script setup>
import { computed, ref } from 'vue'
import { Link2Off, PackageCheck, UsersRound } from 'lucide-vue-next'

const riders = ref([
  { id: 'rider-1', name: '박민지', phone: '010-1234-5678', active: true, deliveries: 3 },
  { id: 'rider-2', name: '최유진', phone: '010-9876-5432', active: true, deliveries: 2 },
])
const production = ref([
  { date: '8월 12일 (월)', quantity: 42, status: '생산 준비' },
  { date: '8월 13일 (화)', quantity: 38, status: '영업 준비' },
  { date: '8월 14일 (수)', quantity: 0, status: '미입력' },
])
const message = ref('')

const activeRiderCount = computed(() => riders.value.filter((rider) => rider.active).length)
const totalProduction = computed(() =>
  production.value.reduce((total, day) => total + day.quantity, 0),
)

function toggleRider(rider) {
  rider.active = !rider.active
  message.value = `${rider.name} 라이더를 ${rider.active ? '활성' : '비활성'} 상태로 변경했습니다.`
}

function disconnectRider(rider) {
  riders.value = riders.value.filter((item) => item.id !== rider.id)
  message.value = `${rider.name} 라이더 연결을 해제했습니다. 다시 연결하려면 초대 코드를 발급해 주세요.`
}

function updateProduction(day) {
  const nextQuantity = window.prompt(`${day.date}의 총 생산 수량을 입력해 주세요.`, day.quantity)
  if (nextQuantity === null) return

  const quantity = Number(nextQuantity)
  if (!Number.isInteger(quantity) || quantity < 0) {
    message.value = '생산 수량은 0 이상의 정수로 입력해 주세요.'
    return
  }

  day.quantity = quantity
  day.status = quantity > 0 ? '생산 확정' : '미입력'
  message.value = `${day.date} 생산 수량을 ${quantity}식으로 반영했습니다.`
}
</script>

<template>
  <section class="page owner-operations-page">
    <header>
      <h1>연결 라이더와 배송일별 생산 수량을 관리해요.</h1>
      <p>
        이 화면의 변경은 데모 상태입니다. 실제 반영 시 점주 권한과 변경 이력이 서버에서 검증되어야
        합니다.
      </p>
    </header>

    <p v-if="message" class="feedback" role="status">{{ message }}</p>

    <section class="summary-grid" aria-label="점주 운영 현황">
      <article>
        <UsersRound :size="21" aria-hidden="true" /><strong>{{ activeRiderCount }}명</strong
        ><span>활성 라이더</span>
      </article>
      <article>
        <PackageCheck :size="21" aria-hidden="true" /><strong>{{ totalProduction }}식</strong
        ><span>3일 생산 합계</span>
      </article>
    </section>

    <section class="management-card" aria-labelledby="rider-title">
      <div class="section-heading">
        <div>
          <h2 id="rider-title">연결된 라이더</h2>
          <p>비활성 라이더에게는 새 배송을 배정하지 않습니다.</p>
        </div>
      </div>
      <ul class="data-list">
        <li v-for="rider in riders" :key="rider.id">
          <div>
            <strong>{{ rider.name }}</strong
            ><span>{{ rider.phone }} · 오늘 {{ rider.deliveries }}건 배정</span>
          </div>
          <div class="row-actions">
            <button class="button button-secondary" type="button" @click="toggleRider(rider)">
              {{ rider.active ? '비활성으로 전환' : '활성으로 전환' }}</button
            ><button
              class="text-button danger-button"
              type="button"
              @click="disconnectRider(rider)"
            >
              <Link2Off :size="16" aria-hidden="true" />연결 해제
            </button>
          </div>
        </li>
        <li v-if="!riders.length" class="empty-row">
          연결된 라이더가 없습니다. 초대 코드 관리에서 새 코드를 발급해 주세요.
        </li>
      </ul>
    </section>

    <section class="management-card" aria-labelledby="production-title">
      <div class="section-heading">
        <div>
          <h2 id="production-title">배송일별 총 생산 수량</h2>
          <p>이 매장의 확정 수량을 기준으로 주문·배송 운영량을 조정합니다.</p>
        </div>
      </div>
      <ul class="data-list">
        <li v-for="day in production" :key="day.date">
          <div>
            <strong>{{ day.date }}</strong
            ><span>{{ day.quantity }}식 · {{ day.status }}</span>
          </div>
          <button class="button button-primary" type="button" @click="updateProduction(day)">
            수량 입력
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.owner-operations-page {
  max-width: 900px;
}
header {
  max-width: 720px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.06em;
}
h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
header > p:last-child,
.section-heading p,
.data-list span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.feedback {
  margin: 20px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 800;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}
.summary-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 12px;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
}
.summary-grid svg {
  grid-row: span 2;
  color: var(--color-primary-pressed);
}
.summary-grid strong {
  font-size: var(--font-section-title);
}
.summary-grid span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.management-card {
  margin-top: 20px;
  padding: clamp(20px, 4vw, 28px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.section-heading p {
  margin: 7px 0 0;
}
.data-list {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}
.data-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.data-list strong,
.data-list span {
  display: block;
}
.data-list span {
  margin-top: 4px;
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.danger-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-danger);
  font-size: var(--font-caption);
  font-weight: 800;
}
.empty-row {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .data-list li {
    align-items: flex-start;
    flex-direction: column;
  }
  .data-list .button,
  .row-actions {
    width: 100%;
  }
  .row-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .danger-button {
    min-height: 42px;
    justify-content: center;
  }
}
</style>
