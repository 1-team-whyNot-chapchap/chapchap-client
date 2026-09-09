<script setup>
import { ref } from 'vue'
import { Check } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])
const days = ref(['월', '화', '수', '목', '금', '토'])
const form = ref({
  publicHoliday: '휴무',
  serviceHoliday: '운영',
  zone: '마포구 A권역',
  lunchCapacity: 80,
  dinnerCapacity: 40,
})
const saved = ref(false)
function savePolicy() {
  saved.value = true
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-operating-policy" @navigate="emit('navigate', $event)" />
    <main class="admin-main policy-page">
      <header class="admin-header">
        <h1>운영일·휴무일·권역별 수용량 기준을 설정합니다.</h1>
        <p>
          고객 배송 가능 여부와 구독 마감은 이 정책과 실제 주문·생산 데이터를 함께 검증해야 합니다.
        </p>
      </header>
      <form class="policy-card" @submit.prevent="savePolicy">
        <section>
          <h2>정기 운영일</h2>
          <div class="day-list">
            <label v-for="day in ['월', '화', '수', '목', '금', '토', '일']" :key="day"
              ><input v-model="days" type="checkbox" :value="day" /><span
                >{{ day }}요일</span
              ></label
            >
          </div>
        </section>
        <section>
          <h2>휴무 기준</h2>
          <label
            ><span>공휴일</span
            ><select v-model="form.publicHoliday">
              <option>휴무</option>
              <option>운영</option>
              <option>별도 공지</option>
            </select></label
          ><label
            ><span>서비스 휴무일</span
            ><select v-model="form.serviceHoliday">
              <option>운영</option>
              <option>휴무</option>
              <option>별도 공지</option>
            </select></label
          >
        </section>
        <section>
          <h2>권역별 배송 수용량</h2>
          <label
            ><span>권역</span
            ><select v-model="form.zone">
              <option>마포구 A권역</option>
              <option>마포구 B권역</option>
              <option>서대문구 권역</option>
            </select></label
          >
          <div class="capacity-grid">
            <label
              ><span>점심 배송</span
              ><input v-model.number="form.lunchCapacity" min="0" type="number" />건</label
            ><label
              ><span>저녁 배송</span
              ><input v-model.number="form.dinnerCapacity" min="0" type="number" />건</label
            >
          </div>
        </section>
        <p v-if="saved" class="saved" role="status">
          <Check :size="17" aria-hidden="true" />운영 정책을 데모 상태로 저장했습니다.
        </p>
        <button class="button button-primary" type="submit">정책 저장</button>
      </form>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.policy-page {
  max-width: 1050px;
}
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.06em;
}
.admin-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-header > p:last-child {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.policy-card {
  display: grid;
  gap: 26px;
  margin-top: 28px;
  padding: clamp(20px, 4vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.policy-card section {
  display: grid;
  gap: 13px;
}
.policy-card h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.policy-card label {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 800;
}
.policy-card select,
.policy-card input[type='number'] {
  min-height: 44px;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
}
.day-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.day-list label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
}
.day-list input {
  width: 17px;
  height: 17px;
  accent-color: var(--color-primary-pressed);
}
.capacity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.saved {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 800;
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .capacity-grid {
    grid-template-columns: 1fr;
  }
  .policy-card .button {
    width: 100%;
  }
}
</style>
