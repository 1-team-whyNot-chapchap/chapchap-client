<script setup>
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
} from 'lucide-vue-next'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { adminPages } from '../../../common/constants/prototypeData'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import AdminSidebar from '../components/AdminSidebar.vue'

const props = defineProps({
  pageId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const isSaved = ref(false)
const isConfirming = ref(false)
const isFilterOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const contentState = ref('ready')
const page = computed(() => adminPages[props.pageId])
const filteredRows = computed(() => {
  if (!page.value.rows) {
    return []
  }

  return page.value.rows.filter((row) => {
    const matchesSearch = Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function saveForm() {
  isSaved.value = true
}

function retryLoading() {
  contentState.value = 'loading'
  window.setTimeout(() => {
    contentState.value = 'ready'
  }, 500)
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :current-route="`wf-${pageId}`" @navigate="emit('navigate', $event)" />

    <main class="admin-main admin-workspace">
      <header class="admin-header">
        <div>
          <h1>{{ page.title }}</h1>
          <p>{{ page.description }}</p>
        </div>
        <button
          class="admin-notification"
          type="button"
          aria-label="운영 알림"
          @click="emit('navigate', 'admin-notifications')"
        >
          <BellRing :size="20" aria-hidden="true" />
          <span>3</span>
        </button>
      </header>

      <aside class="admin-security-notice">
        <AlertTriangle :size="18" aria-hidden="true" />
        <p>관리자 권한 확인과 모든 변경 기록은 실제 서버에서 처리해야 합니다.</p>
      </aside>

      <template v-if="page.kind === 'list'">
        <section class="admin-toolbar">
          <label>
            <Search :size="18" aria-hidden="true" />
            <span class="sr-only">목록 검색</span>
            <input v-model.trim="searchQuery" type="search" placeholder="이름 또는 번호 검색" />
          </label>
          <button
            class="admin-outline-button"
            type="button"
            :aria-expanded="isFilterOpen"
            @click="isFilterOpen = !isFilterOpen"
          >
            <Filter :size="17" aria-hidden="true" />
            필터
          </button>
          <button
            class="admin-outline-button"
            type="button"
            title="내보내기 API 연결 후 사용할 수 있습니다."
            disabled
          >
            <Download :size="17" aria-hidden="true" />
            내보내기
          </button>
          <button
            v-if="page.primaryAction"
            class="button button-primary"
            type="button"
            @click="page.target ? emit('navigate', page.target) : (isConfirming = true)"
          >
            <Plus :size="17" aria-hidden="true" />
            {{ page.primaryAction }}
          </button>
        </section>

        <div v-if="isFilterOpen" class="admin-filter-row">
          <label class="form-field">
            <span>상태</span>
            <select v-model="statusFilter">
              <option value="">전체 상태</option>
              <option value="이용 중">이용 중</option>
              <option value="배송 준비">배송 준비</option>
              <option value="결제 완료">결제 완료</option>
              <option value="환불 검토">환불 검토</option>
              <option value="운영 중지">운영 중지</option>
            </select>
          </label>
        </div>

        <ContentState
          :state="contentState === 'ready' && !filteredRows.length ? 'empty' : contentState"
          empty-title="조건에 맞는 운영 데이터가 없어요."
          @retry="retryLoading"
        >
          <section class="admin-panel admin-table-panel">
            <div class="admin-panel__heading">
              <div>
                <h2>{{ page.title }}</h2>
                <p>검색 결과 {{ filteredRows.length }}건</p>
              </div>
              <span class="admin-result-count">총 {{ filteredRows.length }}건</span>
            </div>

            <DataTable :value="filteredRows" class="admin-data-table" paginator :rows="10">
              <Column
                v-for="column in page.columns"
                :key="column.field"
                :field="column.field"
                :header="column.header"
              >
                <template v-if="column.field === 'status'" #body="{ data }">
                  <StatusBadge :status="data.status" />
                </template>
              </Column>
              <Column v-if="page.rowTarget" header="상세">
                <template #body>
                  <button
                    class="admin-row-action"
                    type="button"
                    aria-label="상세 보기"
                    @click="emit('navigate', page.rowTarget)"
                  >
                    <ChevronRight :size="18" aria-hidden="true" />
                  </button>
                </template>
              </Column>
            </DataTable>
          </section>
        </ContentState>
      </template>

      <template v-else-if="page.kind === 'form'">
        <form class="admin-editor-card" @submit.prevent="saveForm">
          <div class="admin-form-grid">
            <label v-for="field in page.fields" :key="field" class="form-field">
              <span>{{ field }}</span>
              <textarea
                v-if="field.includes('문구') || field.includes('정보')"
                rows="3"
                :placeholder="`${field}을 입력해 주세요.`"
                required
              />
              <input v-else type="text" :placeholder="`${field}을 입력해 주세요.`" required />
            </label>
          </div>

          <aside class="notice-box notice-box--info">
            <div>
              <strong>저장 전 확인</strong>
              <p>{{ page.notice }}</p>
            </div>
          </aside>

          <p v-if="isSaved" class="form-success" role="status">
            예시 입력값을 확인했습니다. 실제 저장은 권한과 입력값을 서버에서 검증한 뒤 처리합니다.
          </p>

          <div class="admin-form-actions">
            <button
              class="button button-secondary"
              type="button"
              @click="emit('navigate', 'admin')"
            >
              취소
            </button>
            <button class="button button-primary" type="submit">변경 내용 확인</button>
          </div>
        </form>
      </template>

      <template v-else>
        <section class="admin-detail-layout">
          <article class="admin-detail-card">
            <div class="admin-detail-card__heading">
              <h2>상세 정보</h2>
              <StatusBadge status="확인 필요" />
            </div>
            <dl>
              <div v-for="[label, value] in page.details" :key="label">
                <dt>{{ label }}</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl>
          </article>

          <aside class="admin-detail-aside">
            <strong>처리 안내</strong>
            <p>
              {{ page.notice || '조회 데이터와 변경 이력은 실제 관리자 API 연결 후 표시합니다.' }}
            </p>

            <button
              v-if="page.primaryAction"
              class="button button-primary"
              type="button"
              @click="isConfirming = true"
            >
              {{ page.primaryAction }}
            </button>
            <button
              v-if="page.dangerAction"
              class="button button-danger-outline"
              type="button"
              @click="isConfirming = true"
            >
              {{ page.dangerAction }}
            </button>
          </aside>
        </section>
      </template>

      <section v-if="isConfirming" class="admin-confirm-panel" role="alert">
        <AlertTriangle :size="22" aria-hidden="true" />
        <div>
          <strong>실제 처리는 아직 실행할 수 없습니다.</strong>
          <p>권한, 대상 소유자, 상태 전이와 중복 요청을 서버에서 검증하는 API가 필요합니다.</p>
        </div>
        <button class="button button-secondary" type="button" @click="isConfirming = false">
          확인
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.admin-sidebar {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 26px 16px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
.admin-brand {
  width: fit-content;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
}
.admin-brand span {
  margin-left: 5px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.admin-sidebar nav {
  display: grid;
  gap: 4px;
  margin-top: 30px;
}
.admin-sidebar nav button,
.admin-back-link {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-muted);
  text-align: left;
  font-size: var(--font-caption);
  font-weight: 700;
}
.admin-sidebar nav button.is-active {
  background: var(--color-primary-soft);
  color: var(--color-text);
}
.admin-back-link {
  margin-top: auto;
}
.admin-nav-group {
  display: grid;
  gap: 4px;
  margin-top: 18px;
}
.admin-nav-group:first-child {
  margin-top: 0;
}
.admin-nav-group small {
  padding: 0 13px 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 900;
}
.admin-main {
  min-width: 0;
  padding: clamp(26px, 4vw, 52px);
}
.admin-header h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.admin-header p:last-child {
  color: var(--color-text-muted);
}
.admin-notification,
.admin-security-notice {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 25px;
  padding: 12px 14px;
  border-radius: 11px;
  background: var(--color-warning-soft);
  color: #8b6415;
}
.admin-notification p,
.admin-security-notice p {
  color: inherit;
  font-size: var(--font-caption);
}
.admin-kpi-grid,
.admin-chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}
.admin-kpi-card,
.admin-panel {
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.admin-kpi-card {
  display: grid;
  gap: 7px;
}
.admin-kpi-card__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.admin-kpi-card p,
.admin-kpi-card small {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.admin-kpi-card strong {
  font-size: var(--font-section-title);
}
.admin-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.admin-panel__heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
}
.admin-toolbar {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 22px;
}
.admin-toolbar label {
  min-width: 220px;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}
.admin-toolbar input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}
.admin-toolbar input:focus-visible {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: 3px;
}
.admin-data-table {
  overflow-x: auto;
  margin-top: 18px;
}
.admin-data-table table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}
.admin-data-table th,
.admin-data-table td {
  padding: 14px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  font-size: var(--font-caption);
}
.admin-data-table th {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.admin-alert-list {
  display: grid;
  gap: 12px;
  margin-top: 26px;
}
.admin-alert-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface);
}
.admin-alert-list__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.admin-alert-list h2,
.admin-alert-list p {
  margin: 0;
}
.admin-alert-list p,
.admin-alert-list small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    min-height: auto;
    padding: 14px 20px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .admin-sidebar nav {
    display: flex;
    overflow-x: auto;
    margin-top: 12px;
  }
  .admin-sidebar nav button {
    flex: none;
  }
  .admin-back-link {
    display: none;
  }
  .admin-kpi-grid,
  .admin-chart-grid {
    grid-template-columns: 1fr;
  }
  .admin-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .admin-toolbar label {
    min-width: 0;
  }
}
</style>

<style scoped>
.admin-toolbar {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 22px;
}

.admin-toolbar label {
  min-width: 220px;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.admin-toolbar input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}

.admin-toolbar .admin-outline-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
}

.admin-toolbar .admin-outline-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.admin-toolbar .button-primary {
  min-height: 42px;
  margin-left: auto;
}

.admin-filter-row {
  display: flex;
  margin-top: 10px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.admin-filter-row .form-field {
  min-width: 220px;
}

.admin-filter-row select {
  min-height: 42px;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.admin-result-count {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

@media (max-width: 760px) {
  .admin-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .admin-toolbar label {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .admin-toolbar .button-primary {
    width: 100%;
    margin-left: 0;
  }
}
</style>
