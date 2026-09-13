<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import AdminFrame from '../components/AdminFrame.vue'
import { auditWord, auditDetails } from '../auditLabels.js'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http, { authSession } from '../../../common/api/http.js'
const route = useRoute(),
  router = useRouter()
const tabs = computed(() =>
  authSession.state.user?.role === 'SUPER_ADMIN'
    ? ['인증·권한', '고객지원']
    : ['인증·권한', '고객지원', '배송'],
)
const tab = computed(() =>
  tabs.value.includes(String(route.query.tab)) ? String(route.query.tab) : tabs.value[0],
)
const rows = ref([]),
  loading = ref(false),
  error = ref(''),
  page = ref(0),
  total = ref(0),
  pages = ref(0),
  selected = ref(null)
const open = computed({
  get: () => !!selected.value,
  set: (v) => {
    if (!v) selected.value = null
  },
})
let generation = 0
const target = ref(''),
  from = ref(''),
  to = ref('')
function applyFilters() {
  page.value = 0
  load()
}
const labels = {
  FAQ_CREATED: 'FAQ 등록',
  FAQ_UPDATED: 'FAQ 수정',
  FAQ_DEACTIVATED: 'FAQ 비활성화',
  CONSULTATION_ESCALATED: '상담사 연결 요청',
  CONSULTATION_ACCEPTED: '상담 수락',
  CONSULTATION_CLOSED: '상담 종료',
  AI_SUMMARY_GENERATED: 'AI 요약 생성',
  AI_SUMMARY_FAILED: 'AI 요약 실패',
  QUALITY_INQUIRY_PROCESSED: '품질 문의 처리',
  KNOWLEDGE_VERSION_REGISTERED: '지식 문서 등록',
  KNOWLEDGE_VERSION_ACTIVATED: '지식 문서 활성화',
  KNOWLEDGE_PROCESSING_FAILED: '지식 처리 실패',
  USER: '사용자',
  AUTH_SESSION: '로그인 세션',
  FAQ: 'FAQ',
  CONSULTATION: '상담',
  QUALITY_INQUIRY: '품질 문의',
  KNOWLEDGE_VERSION: '지식 문서',
  DELIVERY: '배송',
  DELIVERY_ASSIGNMENT: '배송 배정',
  DELIVERY_TARGET: '배송 대상',

  ADMIN_CREATED: '관리자 발급',
  ADMIN_DISABLED: '관리자 비활성화',
  ADMIN_UNLOCKED: '잠금 해제',
  ADMIN_LOCKED: '계정 잠금',
  ADMIN_PASSWORD_RESET: '비밀번호 초기화',
  ADMIN_PASSWORD_CHANGED: '비밀번호 변경',
  ADMIN_LOGIN_SUCCEEDED: '관리자 로그인',
  ADMIN_LOGIN_FAILED: '로그인 실패',
  RIDER_ROLE_GRANTED: '기사 권한 부여',
  RIDER_ROLE_REVOKED: '기사 권한 해제',
  USER_WITHDRAWN: '회원 탈퇴',
  TOKEN_REUSE_DETECTED: '토큰 재사용 차단',
  SUCCESS: '성공',
  FAILURE: '실패',
  BLOCKED: '차단',
}
function label(value) {
  return labels[value] || auditWord(value) || '기록 없음'
}
function time(value) {
  return String(value || '')
    .replace('T', ' ')
    .slice(0, 19)
}
async function load() {
  const request = ++generation
  rows.value = []
  loading.value = true
  error.value = ''
  selected.value = null
  const path =
    tab.value === '인증·권한'
      ? '/api/auth/audit-logs'
      : tab.value === '고객지원'
        ? '/api/customer/admin/audit-logs'
        : '/api/delivery/admin/audit-histories'
  try {
    const params = { page: page.value, size: 20 }
    if (tab.value === '고객지원') {
      if (target.value.trim()) params.targetId = target.value.trim()
      if (from.value) params.from = from.value + 'T00:00:00'
      if (to.value) params.to = to.value + 'T23:59:59'
    } else if (tab.value === '배송' && target.value.trim()) {
      const value = target.value.trim()
      if (/^\d+$/.test(value)) params.entityId = value
      else params.entityType = value.toUpperCase()
    }
    const response = await http.get(path, { params })
    if (request !== generation) return
    if (response.data?.code !== '00') throw new Error('invalid response')
    const data = response.data.data
    rows.value = (data.content || data.items || []).map((r, i) => ({
      id: r.auditLogId || r.auditHistoryId || `${page.value}-${i}`,
      at: r.createdAt || r.occurredAt,
      action: r.actionType || r.action,
      target: `${label(r.targetType || r.entityType)} #${r.targetId ?? r.entityId}`,
      actor: r.actorUserId ?? r.actorId ?? '시스템',
      result: r.result || r.reasonCode || '기록됨',
      detail: r.detail || r.reasonDetail || null,
      traceId: r.traceId,
    }))
    total.value = data.totalElements
    pages.value = data.totalPages
  } catch {
    if (request === generation)
      error.value =
        '감사 이력을 불러오지 못했습니다. 권한과 연결 상태를 확인한 후 다시 조회해 주세요.'
  } finally {
    if (request === generation) loading.value = false
  }
}
watch(
  () => [tab.value, authSession.state.user?.userId],
  () => {
    page.value = 0
    target.value = ''
    from.value = ''
    to.value = ''
    load()
  },
)
onMounted(load)
onBeforeUnmount(() => {
  generation++
})
function changePage(delta) {
  page.value += delta
  load()
}
</script>
<template>
  <AdminFrame
    title="감사 이력"
    description="실제 운영 기록에서 작업 대상과 수행자, 처리 결과를 확인합니다."
  >
    <div class="audit-toolbar">
      <div class="ui-actions" role="group" aria-label="감사 서비스">
        <button
          v-for="item in tabs"
          :key="item"
          class="button"
          :class="tab === item ? 'button-primary' : 'button-secondary'"
          :aria-pressed="tab === item"
          @click="router.replace({ query: { ...route.query, tab: item } })"
        >
          {{ item }}
        </button>
      </div>
      <button class="button button-secondary" :disabled="loading" @click="load">새로고침</button>
    </div>
    <p class="ui-note">
      {{
        tab === '인증·권한'
          ? authSession.state.user?.role === 'SUPER_ADMIN'
            ? '최고 관리자 권한으로 인증·계정 운영 이력을 조회합니다.'
            : '관리자에게 허용된 기사 역할 변경 이력을 조회합니다.'
          : '해당 서비스에서 권한에 따라 허용한 감사 기록을 최신순으로 표시합니다.'
      }}
    </p>
    <form v-if="tab !== '인증·권한'" class="audit-filters" @submit.prevent="applyFilters">
      <label class="ui-field"
        >{{ tab === '배송' ? '대상 유형 또는 ID' : '대상 ID'
        }}<input v-model="target" maxlength="64" type="search" /></label
      ><template v-if="tab === '고객지원'"
        ><label class="ui-field"
          >시작일<input v-model="from" type="date" :max="to || undefined" /></label
        ><label class="ui-field"
          >종료일<input v-model="to" type="date" :min="from || undefined" /></label></template
      ><button class="button button-secondary" :disabled="loading">조회</button>
    </form>
    <section class="ui-surface ui-stack">
      <p v-if="loading" role="status">감사 이력을 불러오고 있습니다.</p>
      <div v-else-if="error" role="alert">
        <p>{{ error }}</p>
        <button class="button button-secondary" @click="load">다시 조회</button>
      </div>
      <template v-else>
        <div class="ui-row">
          <h2>{{ tab }} 기록</h2>
          <span>총 {{ total }}건</span>
        </div>
        <div class="ui-table-scroll" tabindex="0" aria-label="감사 기록 표">
          <table class="ui-table">
            <thead>
              <tr>
                <th>일시</th>
                <th>작업</th>
                <th>대상</th>
                <th>수행자 ID</th>
                <th>결과</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ time(row.at) }}</td>
                <td>{{ label(row.action) }}</td>
                <td>{{ row.target }}</td>
                <td>{{ row.actor }}</td>
                <td>{{ label(row.result) }}</td>
                <td>
                  <button class="button button-secondary" @click="selected = row">상세보기</button>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="6" class="ui-empty">조회된 감사 이력이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="audit-toolbar">
          <span>{{ pages ? page + 1 : 0 }} / {{ pages }}페이지</span>
          <div class="ui-actions">
            <button class="button button-secondary" :disabled="page === 0" @click="changePage(-1)">
              이전</button
            ><button
              class="button button-secondary"
              :disabled="page + 1 >= pages"
              @click="changePage(1)"
            >
              다음
            </button>
          </div>
        </div>
      </template>
    </section>
    <Dialog v-model:visible="open" modal header="감사 기록 상세" :pt="dialogPt" :draggable="false"
      ><div v-if="selected" class="ui-stack">
        <p>{{ time(selected.at) }} · {{ label(selected.action) }}</p>
        <p>대상: {{ selected.target }} · 수행자: {{ selected.actor }}</p>
        <p>결과: {{ label(selected.result) }}</p>
        <p v-if="selected.traceId">추적 ID: {{ selected.traceId }}</p>
        <dl class="audit-detail-list">
          <template v-for="(item, index) in auditDetails(selected.detail)" :key="index"
            ><dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd></template
          >
        </dl>
        <p v-if="!selected.detail">추가 상세 기록이 없습니다.</p>
        <details>
          <summary>원본 기록 보기</summary>
          <pre>{{
            JSON.stringify({ action: selected.action, detail: selected.detail }, null, 2)
          }}</pre>
        </details>
      </div></Dialog
    >
  </AdminFrame>
</template>
<style scoped>
.audit-detail-list {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 2fr;
  gap: 12px;
}
.audit-detail-list dt {
  font-weight: 700;
}
.audit-detail-list dd {
  margin: 0;
  overflow-wrap: anywhere;
}
summary {
  cursor: pointer;
  padding-block: 12px;
}
.audit-filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.audit-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
  line-height: 1.7;
}
</style>
