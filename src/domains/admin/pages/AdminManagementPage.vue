<script setup>
import { computed, ref } from 'vue'
import { Building2, ShieldCheck, UsersRound } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])
const activeTab = ref('members')
const notice = ref('')
const tabs = [
  { id: 'members', label: '회원·권한', icon: UsersRound },
  { id: 'stores', label: '가맹점', icon: Building2 },
  { id: 'plans', label: '플랜·회차', icon: ShieldCheck },
]
const members = ref([
  { name: '김하늘', role: 'CUSTOMER', status: '이용 중' },
  { name: '박지민', role: 'RIDER', status: '이용 중' },
  { name: '정민서', role: 'OWNER', status: '이용 중' },
])
const stores = ref([
  { name: '챱챱 성수점', owner: '정민서', status: '운영 중' },
  { name: '챱챱 마포점', owner: '윤서진', status: '운영 준비' },
])
const plans = [
  { name: '건강식', rounds: '이번 주 3회', status: '편성 완료' },
  { name: '영양식', rounds: '이번 주 3회', status: '편성 완료' },
  { name: '든든식', rounds: '다음 주 편성 필요', status: '확인 필요' },
]
const rows = computed(
  () => ({ members: members.value, stores: stores.value, plans })[activeTab.value],
)
function selectTab(tabId) {
  activeTab.value = tabId
  notice.value = ''
}
function toggleStatus(row) {
  if (activeTab.value === 'members') row.status = row.status === '이용 중' ? '이용 정지' : '이용 중'
  if (activeTab.value === 'stores') row.status = row.status === '운영 중' ? '운영 중지' : '운영 중'
  notice.value = `${row.name} 항목을 ${row.status} 상태로 변경했어요.`
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-management" @navigate="emit('navigate', $event)" />
    <main class="admin-main admin-management">
      <header>
        <h1>회원과 운영 기준을 관리합니다.</h1>
        <p>상태 변경 전 대상과 영향을 확인하고, 실제 변경은 서버 감사 이력에 남겨야 합니다.</p>
      </header>
      <div class="management-tabs" role="tablist" aria-label="운영 관리 항목">
        <button
          v-for="tab in tabs"
          :id="`${tab.id}-tab`"
          :key="tab.id"
          :class="{ 'is-active': activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          role="tab"
          type="button"
          @click="selectTab(tab.id)"
        >
          <component :is="tab.icon" :size="17" aria-hidden="true" />{{ tab.label }}
        </button>
      </div>
      <p v-if="notice" class="management-notice" role="status">{{ notice }}</p>
      <section class="management-panel" role="tabpanel" :aria-labelledby="`${activeTab}-tab`">
        <div class="panel-heading">
          <div>
            <h2>{{ tabs.find((tab) => tab.id === activeTab)?.label }} 현황</h2>
            <p>운영 대상 {{ rows.length }}건</p>
          </div>
        </div>
        <div class="management-table-wrap" tabindex="0">
          <table>
            <thead>
              <tr>
                <th>대상</th>
                <th>
                  {{ activeTab === 'members' ? '역할' : activeTab === 'stores' ? '점주' : '회차' }}
                </th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.name">
                <td>{{ row.name }}</td>
                <td>{{ row.role || row.owner || row.rounds }}</td>
                <td>
                  <b
                    :class="{
                      'is-warning': ['확인 필요', '운영 준비', '이용 정지', '운영 중지'].includes(
                        row.status,
                      ),
                    }"
                    >{{ row.status }}</b
                  >
                </td>
                <td>
                  <button
                    v-if="activeTab !== 'plans'"
                    class="admin-outline-button"
                    type="button"
                    @click="toggleStatus(row)"
                  >
                    {{
                      row.status.includes('중지') || row.status.includes('정지')
                        ? '재개'
                        : '상태 변경'
                    }}</button
                  ><button
                    v-else
                    class="admin-outline-button"
                    type="button"
                    @click="
                      notice = `${row.name} 플랜의 회차 편성 화면은 다음 운영 작업에서 연결합니다.`
                    "
                  >
                    편성 확인
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <aside class="admin-policy-note">
        <ShieldCheck :size="20" aria-hidden="true" />
        <p>
          관리자 역할 변경은 SUPER_ADMIN만 처리할 수 있으며, 실제 권한·가맹점 상태 변경은 서버에서
          권한과 변경 이력을 검증해야 합니다.
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
.admin-management {
  min-width: 0;
  padding: clamp(26px, 4vw, 52px);
}
.admin-management header {
  max-width: 760px;
}
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.05em;
}
.admin-management h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-management header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.management-tabs {
  display: flex;
  gap: 8px;
  margin-top: 30px;
  overflow-x: auto;
}
.management-tabs button {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  min-height: 43px;
  padding: 0 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: 800;
}
.management-tabs button.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.management-notice {
  margin: 14px 0 0;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
}
.management-panel {
  margin-top: 18px;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.panel-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.panel-heading p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.management-table-wrap {
  overflow-x: auto;
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
}
table {
  width: 100%;
  min-width: 610px;
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
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.is-warning {
  background: var(--color-warning-soft);
  color: #78601c;
}
.management-table-wrap:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.admin-policy-note {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  border-radius: 14px;
  background: var(--color-warning-soft);
  color: #78601c;
}
.admin-policy-note p {
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
@media (max-width: 700px) {
  .admin-management {
    padding: 26px 20px;
  }
}
</style>
