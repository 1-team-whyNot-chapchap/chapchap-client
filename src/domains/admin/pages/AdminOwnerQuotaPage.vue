<script setup>
import { computed, ref } from 'vue'
import { Building2, Check, Info, ShieldCheck, UsersRound } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])

const owners = ref([
  { id: 'owner-1', store: '챱챱 성수점', owner: '김도윤', quota: 12, issued: 9, status: '정상' },
  {
    id: 'owner-2',
    store: '챱챱 마포점',
    owner: '박서연',
    quota: 15,
    issued: 15,
    status: '한도 소진',
  },
  { id: 'owner-3', store: '챱챱 수성점', owner: '이현우', quota: 8, issued: 3, status: '정상' },
])
const selectedOwnerId = ref('owner-1')
const requestedQuota = ref(12)
const saveState = ref('idle')

const selectedOwner = computed(() =>
  owners.value.find((owner) => owner.id === selectedOwnerId.value),
)
const totalQuota = computed(() => owners.value.reduce((sum, owner) => sum + owner.quota, 0))
const totalIssued = computed(() => owners.value.reduce((sum, owner) => sum + owner.issued, 0))
const canSave = computed(
  () =>
    Number.isInteger(Number(requestedQuota.value)) &&
    requestedQuota.value >= 0 &&
    requestedQuota.value <= 15,
)

function selectOwner() {
  requestedQuota.value = selectedOwner.value?.quota ?? 0
  saveState.value = 'idle'
}

function editOwner(ownerId) {
  selectedOwnerId.value = ownerId
  selectOwner()
}

function saveQuota() {
  if (!canSave.value || !selectedOwner.value) {
    saveState.value = 'error'
    return
  }

  selectedOwner.value.quota = Number(requestedQuota.value)
  selectedOwner.value.status =
    selectedOwner.value.issued >= selectedOwner.value.quota ? '한도 소진' : '정상'
  saveState.value = 'success'
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-owner-quotas" @navigate="emit('navigate', $event)" />

    <main class="admin-main quota-page">
      <header class="admin-header">
        <h1>점주별 라이더 초대 한도를 관리합니다.</h1>
        <p>점주에게 월별 코드 수량을 부여하며, 라이더에게 직접 초대 코드를 발급하지 않습니다.</p>
      </header>

      <section class="quota-kpis" aria-label="이번 달 초대 코드 현황">
        <article>
          <span><Building2 :size="20" aria-hidden="true" /></span>
          <p>관리 매장</p>
          <strong>{{ owners.length }}곳</strong>
        </article>
        <article>
          <span><UsersRound :size="20" aria-hidden="true" /></span>
          <p>부여한 발급 한도</p>
          <strong>{{ totalQuota }}개</strong>
        </article>
        <article>
          <span><ShieldCheck :size="20" aria-hidden="true" /></span>
          <p>점주가 발급한 코드</p>
          <strong>{{ totalIssued }}개</strong>
        </article>
      </section>

      <section class="quota-workspace" aria-labelledby="quota-table-title">
        <div class="quota-workspace__heading">
          <div>
            <h2 id="quota-table-title">점주별 월간 한도</h2>
            <p>점주가 발급한 코드 수와 남은 한도를 함께 확인합니다.</p>
          </div>
        </div>

        <div class="quota-table-wrap" tabindex="0" aria-label="점주별 라이더 초대 한도 표">
          <table class="quota-table">
            <thead>
              <tr>
                <th>가맹점</th>
                <th>점주</th>
                <th>월간 한도</th>
                <th>발급</th>
                <th>남은 수</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="owner in owners"
                :key="owner.id"
                :class="{ 'is-selected': owner.id === selectedOwnerId }"
              >
                <td>{{ owner.store }}</td>
                <td>{{ owner.owner }}</td>
                <td>{{ owner.quota }}개</td>
                <td>{{ owner.issued }}개</td>
                <td>{{ Math.max(owner.quota - owner.issued, 0) }}개</td>
                <td>
                  <span
                    class="quota-status"
                    :class="{ 'quota-status--warning': owner.status === '한도 소진' }"
                    >{{ owner.status }}</span
                  >
                </td>
                <td>
                  <button class="admin-outline-button" type="button" @click="editOwner(owner.id)">
                    한도 조정
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="quota-editor" aria-labelledby="quota-editor-title">
        <div>
          <h2 id="quota-editor-title">월간 한도 조정</h2>
          <p>
            한도는 0~15개로 설정할 수 있습니다. 이미 발급한 코드는 설정값을 낮춰도 자동으로 취소되지
            않습니다.
          </p>
        </div>
        <form @submit.prevent="saveQuota">
          <label>
            <span>가맹점 선택</span>
            <select v-model="selectedOwnerId" @change="selectOwner">
              <option v-for="owner in owners" :key="owner.id" :value="owner.id">
                {{ owner.store }} · {{ owner.owner }}
              </option>
            </select>
          </label>
          <label>
            <span>이달 발급 한도</span>
            <input
              v-model.number="requestedQuota"
              type="number"
              min="0"
              max="15"
              inputmode="numeric"
            />
          </label>
          <p v-if="!canSave" class="field-error" role="alert">
            월간 한도는 0개 이상 15개 이하로 입력해 주세요.
          </p>
          <p v-else-if="saveState === 'success'" class="save-success" role="status">
            <Check :size="17" aria-hidden="true" />{{ selectedOwner?.store }}의 월간 한도를
            {{ selectedOwner?.quota }}개로 반영했어요.
          </p>
          <button class="button button-primary" type="submit" :disabled="!canSave">
            월간 한도 저장
          </button>
        </form>
      </section>

      <aside class="admin-policy-note">
        <Info :size="20" aria-hidden="true" />
        <p>
          실제 저장은 ADMIN 또는 SUPER_ADMIN의 권한과 대상 가맹점 정보를 서버에서 검증한 뒤 감사
          이력에 기록해야 합니다.
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
.quota-page {
  min-width: 0;
  padding: clamp(26px, 4vw, 52px);
}
.admin-header {
  max-width: 800px;
}
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.05em;
}
.admin-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.quota-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 32px;
}
.quota-kpis article {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.quota-kpis span {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.quota-kpis p,
.quota-kpis strong {
  display: block;
  margin: 0;
}
.quota-kpis p {
  margin-top: 15px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.quota-kpis strong {
  margin-top: 5px;
  font-size: var(--font-page-title);
  letter-spacing: -0.04em;
}
.quota-workspace {
  margin-top: 22px;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.quota-workspace__heading h2,
.quota-editor h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.quota-workspace__heading p,
.quota-editor > div > p:last-child {
  margin: 7px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.quota-table-wrap {
  overflow-x: auto;
  margin-top: 22px;
  border-top: 1px solid var(--color-border);
}
.quota-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}
.quota-table th,
.quota-table td {
  padding: 14px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  font-size: var(--font-caption);
  white-space: nowrap;
}
.quota-table th {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.quota-table tr.is-selected td {
  background: var(--color-primary-soft);
}
.quota-status {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.quota-status--warning {
  background: var(--color-warning-soft);
  color: #78601c;
}
.quota-editor {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr);
  gap: clamp(24px, 5vw, 66px);
  align-items: start;
  margin-top: 22px;
  padding: clamp(22px, 4vw, 34px);
  border-radius: 18px;
  background: var(--color-primary-soft);
}
.quota-editor form {
  display: grid;
  gap: 16px;
}
.quota-editor label {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 800;
}
.quota-editor select,
.quota-editor input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  box-sizing: border-box;
}
.quota-editor select:focus-visible,
.quota-editor input:focus-visible,
.quota-table-wrap:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.field-error,
.save-success {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -5px 0 0;
  color: var(--color-danger);
  font-size: var(--font-caption);
}
.save-success {
  color: var(--color-success);
}
.quota-editor .button {
  min-height: 48px;
}
.admin-policy-note {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-info);
}
.admin-policy-note p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .quota-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .quota-page {
    padding: 26px 20px;
  }
  .quota-kpis,
  .quota-editor {
    grid-template-columns: 1fr;
  }
  .quota-editor {
    gap: 25px;
  }
}
</style>
