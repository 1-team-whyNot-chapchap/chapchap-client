<script setup>
import { ref } from 'vue'
import { ClipboardList, Route, UsersRound } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])
const selectedRider = ref('')
const notice = ref('')
const deliveries = [
  {
    id: 'DEL-240812-01',
    zone: '마포 A',
    window: '12:00–13:00',
    recipient: '김하늘',
    state: '배정 대기',
  },
  {
    id: 'DEL-240812-02',
    zone: '마포 A',
    window: '12:30–13:30',
    recipient: '이도윤',
    state: '배정 대기',
  },
  {
    id: 'DEL-240812-03',
    zone: '성동 B',
    window: '17:00–18:00',
    recipient: '최서윤',
    state: '라이더 확인 중',
  },
]
function reviewAssignment() {
  notice.value = selectedRider.value
    ? `${selectedRider.value} 라이더 배정 요청을 시연 상태로 검토했습니다. 실제 배정은 배송 수용량·근무 상태·권한을 서버에서 확인해야 합니다.`
    : '먼저 배정할 라이더를 선택해주세요.'
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-delivery-assignment" @navigate="emit('navigate', $event)" />
    <main class="admin-main assignment-page">
      <header>
        <p class="ui-sample">시연 데이터</p>
        <h1>배송 배정 현황을<br />관리합니다.</h1>
        <p>배정 전 라이더의 근무 가능 시간과 배송 수용량을 검증해야 합니다.</p>
      </header>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <section class="assignment-toolbar">
        <div>
          <ClipboardList :size="20" aria-hidden="true" /><strong
            >배정 대기 {{ deliveries.length }}건</strong
          ><span>표시된 수치와 배송 정보는 시연 데이터입니다.</span>
        </div>
        <label
          >라이더 선택<select v-model="selectedRider">
            <option value="">선택하세요</option>
            <option>박지민</option>
            <option>윤가람</option>
          </select></label
        ><button class="button button-primary" type="button" @click="reviewAssignment">
          <UsersRound :size="17" aria-hidden="true" />배정 요청 검토
        </button>
      </section>
      <section class="delivery-card">
        <div class="card-heading">
          <Route :size="20" aria-hidden="true" />
          <h2>오늘의 배송</h2>
        </div>
        <div class="table-wrap" tabindex="0">
          <table>
            <thead>
              <tr>
                <th>배송 번호</th>
                <th>권역</th>
                <th>시간</th>
                <th>수령인</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="delivery in deliveries" :key="delivery.id">
                <td>
                  <strong>{{ delivery.id }}</strong>
                </td>
                <td>{{ delivery.zone }}</td>
                <td>{{ delivery.window }}</td>
                <td>{{ delivery.recipient }}</td>
                <td>
                  <b :class="{ checking: delivery.state === '라이더 확인 중' }">{{
                    delivery.state
                  }}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <aside>
        <Route :size="19" aria-hidden="true" />
        <p>
          실제 배정은 중복 배정 방지, 라이더 권한, 근무 상태, 고객 알림 순서를 서버 트랜잭션에서
          보장해야 합니다.
        </p>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.assignment-page {
  min-width: 0;
}
.section-kicker {
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
header p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.notice {
  margin: 18px 0 0;
  padding: 13px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.assignment-toolbar {
  display: flex;
  align-items: end;
  gap: 13px;
  margin-top: 26px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
}
.assignment-toolbar > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 8px;
  min-width: 185px;
}
.assignment-toolbar svg {
  grid-row: 1 / span 2;
  color: var(--color-primary-pressed);
}
.assignment-toolbar strong,
.assignment-toolbar span {
  display: block;
}
.assignment-toolbar span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.assignment-toolbar label {
  display: grid;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.assignment-toolbar select {
  min-width: 130px;
  min-height: 40px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
.delivery-card {
  margin-top: 16px;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.card-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-pressed);
}
.card-heading h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-section-title);
}
.table-wrap {
  overflow-x: auto;
  margin-top: 18px;
  border-top: 1px solid var(--color-border);
}
.table-wrap:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}
th,
td {
  padding: 14px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  font-size: var(--font-caption);
}
th {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
td b {
  padding: 5px 8px;
  border-radius: 99px;
  background: var(--color-warning-soft);
  color: #78601c;
  font-size: var(--font-caption);
}
.checking {
  background: var(--color-info-soft);
  color: var(--color-info);
}
aside {
  display: flex;
  gap: 9px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 13px;
  background: var(--color-warning-soft);
  color: #78601c;
}
aside p {
  margin: 0;
  color: inherit;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
.assignment-toolbar {
  align-items: stretch;
  flex-direction: column;
}
.assignment-toolbar label,
.assignment-toolbar select,
.assignment-toolbar .button {
  width: 100%;
  box-sizing: border-box;
}
</style>
