<script setup>
import { ref } from 'vue'
import { RotateCcw, TriangleAlert } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'
const emit = defineEmits(['navigate'])
const cases = ref([
  {
    id: 'CN-0812-01',
    type: '구독 해지',
    member: '김하늘',
    target: '9월 정기결제',
    status: '환불 검토',
  },
  {
    id: 'CN-0812-02',
    type: '회차 취소',
    member: '이도윤',
    target: '8월 16일 배송',
    status: '환불 완료',
  },
  {
    id: 'CN-0812-03',
    type: '회차 취소',
    member: '최서윤',
    target: '8월 17일 배송',
    status: '재처리 필요',
  },
])
const message = ref('')
function retry(item) {
  item.status = '재처리 요청됨'
  message.value = `${item.id} 환불 재처리를 요청했어요. PG 원거래 조회 후 결과를 확정해야 합니다.`
}
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-cancellations" @navigate="emit('navigate', $event)" />
    <main class="admin-main page">
      <header>
        <p>SUBSCRIPTION CANCELLATIONS</p>
        <h1>해지·회차 취소와 환불을 관리합니다.</h1>
        <span>실패 건은 새 취소를 만들지 않고 원거래 상태를 먼저 확인합니다.</span>
      </header>
      <p v-if="message" class="feedback" role="status">{{ message }}</p>
      <section>
        <div class="heading">
          <h2>처리 이력</h2>
          <b>{{ cases.length }}건</b>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>구분</th>
                <th>회원</th>
                <th>대상</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in cases" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.member }}</td>
                <td>{{ item.target }}</td>
                <td>
                  <strong
                    :class="{
                      warning: item.status === '환불 검토' || item.status === '재처리 필요',
                    }"
                    >{{ item.status }}</strong
                  >
                </td>
                <td>
                  <button
                    v-if="item.status === '재처리 필요'"
                    class="admin-outline-button"
                    type="button"
                    @click="retry(item)"
                  >
                    <RotateCcw :size="15" />재처리</button
                  ><span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <aside>
        <TriangleAlert :size="19" /><span
          >실제 환불은 관리자 권한, 환불 가능 금액, 중복 요청, PG 거래 상태를 서버에서 검증하고 감사
          이력에 기록해야 합니다.</span
        >
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
.page {
  padding: clamp(26px, 4vw, 52px);
}
header p {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
header span {
  display: block;
  margin-top: 12px;
  color: var(--color-text-muted);
}
.feedback {
  padding: 12px;
  background: var(--color-primary-soft);
  border-radius: 12px;
}
section {
  margin-top: 30px;
  padding: 25px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.heading {
  display: flex;
  justify-content: space-between;
}
.heading h2 {
  margin: 0;
}
.table-wrap {
  overflow-x: auto;
  margin-top: 18px;
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
td strong {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.warning {
  background: var(--color-warning-soft);
  color: #78601c;
}
aside {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  border-radius: 14px;
  background: var(--color-warning-soft);
  color: #78601c;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .page {
    padding: 26px 20px;
  }
}
</style>
