<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http, { authSession } from '../../../common/api/http.js'
import { createAdminAccountApi } from '../api/adminAccountApi.js'
const api = createAdminAccountApi(http)
const allowed = computed(() => authSession.state.user?.role === 'SUPER_ADMIN')
const rows = ref([]),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
const search = ref(''),
  page = ref(0),
  total = ref(0),
  pages = ref(0),
  modal = ref(false),
  mode = ref('create'),
  target = ref(null),
  actionError = ref('')
const form = reactive({ name: '', username: '', temporaryPassword: '' })
const titles = {
  create: '관리자 계정 발급',
  disable: '계정 비활성화',
  unlock: '계정 잠금 해제',
  'password-reset': '임시 비밀번호 재설정',
}
let generation = 0
async function load(reset = false) {
  if (!allowed.value) return
  if (reset) page.value = 0
  const request = ++generation
  loading.value = true
  error.value = ''
  rows.value = []
  try {
    const result = await api.list({ search: search.value.trim(), page: page.value, size: 20 })
    if (request !== generation) return
    rows.value = result.content
    total.value = result.totalElements
    pages.value = result.totalPages
  } catch {
    if (request === generation) error.value = '계정 목록을 불러오지 못했습니다. 다시 조회해 주세요.'
  } finally {
    if (request === generation) loading.value = false
  }
}
function start(action, row = null) {
  mode.value = action
  target.value = row
  actionError.value = ''
  notice.value = ''
  Object.assign(form, { name: '', username: '', temporaryPassword: '' })
  modal.value = true
}
function operable(row) {
  return (
    row.role === 'ADMIN' &&
    row.status === 'ACTIVE' &&
    String(row.userId) !== String(authSession.state.user?.userId)
  )
}
async function submit() {
  if (busy.value || !allowed.value) return
  if (
    ['create', 'password-reset'].includes(mode.value) &&
    !/^(?=.*[A-Za-z])(?=.*[0-9])\S{10,64}$/.test(form.temporaryPassword)
  ) {
    actionError.value = '비밀번호는 문자·숫자를 포함한 10~64자이며 공백을 사용할 수 없습니다.'
    return
  }
  busy.value = true
  actionError.value = ''
  try {
    if (mode.value === 'create')
      await api.create({ ...form, name: form.name.trim(), username: form.username.trim() })
    else
      await api.action(
        target.value.userId,
        mode.value,
        mode.value === 'password-reset' ? { temporaryPassword: form.temporaryPassword } : {},
      )
    notice.value = `${titles[mode.value]}이 완료되었습니다.`
    modal.value = false
    form.temporaryPassword = ''
    await load(mode.value === 'create')
  } catch {
    actionError.value =
      '처리하지 못했습니다. 입력과 계정 상태를 확인해 주세요. 응답이 끊겼다면 목록과 감사 이력을 먼저 확인해 주세요.'
  } finally {
    busy.value = false
  }
}
watch(modal, (value) => {
  if (!value) form.temporaryPassword = ''
})
watch(
  () => authSession.state.user?.userId,
  () => {
    generation++
    rows.value = []
    modal.value = false
    load(true)
  },
)
onMounted(load)
onBeforeUnmount(() => {
  generation++
  form.temporaryPassword = ''
})
function time(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '기록 없음'
}
function changePage(delta) {
  page.value += delta
  load()
}
</script>
<template>
  <header class="ui-heading">
    <div>
      <h1>관리자 계정 관리</h1>
      <p>관리자 계정을 발급하고 로그인 상태와 보안 설정을 관리합니다.</p>
    </div>
    <button v-if="allowed" class="button button-primary" @click="start('create')">
      관리자 계정 발급
    </button>
  </header>
  <p v-if="!allowed" class="ui-note">최고 관리자만 계정을 조회하고 관리할 수 있습니다.</p>
  <template v-else>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <section class="ui-surface ui-stack">
      <form class="account-search" @submit.prevent="load(true)">
        <label class="ui-field"
          >이름·아이디 검색<input
            v-model="search"
            maxlength="50"
            type="search"
            placeholder="이름 또는 아이디" /></label
        ><button class="button button-secondary" :disabled="loading">조회</button>
      </form>
      <p v-if="error" class="ui-error" role="alert">
        {{ error }} <button class="button button-secondary" @click="load()">다시 조회</button>
      </p>
      <p v-else-if="loading" role="status">계정을 불러오고 있습니다.</p>
      <template v-else>
        <div class="ui-table-scroll" tabindex="0" aria-label="관리자 계정 목록">
          <table class="ui-table">
            <thead>
              <tr>
                <th>이름 · 아이디</th>
                <th>역할</th>
                <th>계정 상태</th>
                <th>최근 로그인</th>
                <th>계정 관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.userId">
                <td>
                  <strong>{{ row.name }}</strong
                  ><br /><span class="ui-muted">{{ row.username }}</span>
                </td>
                <td>{{ row.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자' }}</td>
                <td>
                  {{ row.status === 'ACTIVE' ? '활성' : '비활성' }}<br /><small v-if="row.locked"
                    >잠금 · {{ time(row.lockedUntil) }}까지</small
                  ><small v-else-if="row.mustChangePassword">첫 로그인 시 비밀번호 변경 필요</small>
                </td>
                <td>{{ time(row.lastLoginAt) }}</td>
                <td>
                  <div v-if="operable(row)" class="ui-actions">
                    <button class="button button-secondary" @click="start('password-reset', row)">
                      비밀번호 초기화</button
                    ><button
                      class="button button-secondary"
                      :disabled="!row.locked"
                      @click="start('unlock', row)"
                    >
                      잠금 해제</button
                    ><button class="button button-secondary" @click="start('disable', row)">
                      비활성화
                    </button>
                  </div>
                  <span v-else class="ui-muted">관리 대상 제외</span>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="5" class="ui-empty">조건에 맞는 계정이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ui-row">
          <span>총 {{ total }}개 · {{ pages ? page + 1 : 0 }} / {{ pages }}페이지</span>
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
  </template>
  <Dialog
    v-model:visible="modal"
    modal
    :header="titles[mode]"
    :pt="dialogPt"
    :closable="!busy"
    :close-on-escape="!busy"
    :draggable="false"
  >
    <form class="ui-stack" @submit.prevent="submit">
      <template v-if="mode === 'create'"
        ><label class="ui-field"
          >이름<input v-model="form.name" maxlength="50" required :disabled="busy" /></label
        ><label class="ui-field"
          >관리자 아이디<input
            v-model="form.username"
            maxlength="50"
            required
            autocomplete="off"
            :disabled="busy" /></label
      ></template>
      <p v-else>
        <strong>{{ target?.name }} ({{ target?.username }})</strong> 계정을 대상으로
        {{ titles[mode] }}를 진행합니다.
      </p>
      <p v-if="mode === 'disable'" class="ui-note">
        이 계정의 로그인이 차단되고 기존 로그인 세션도 종료됩니다.
      </p>
      <p v-if="mode === 'password-reset'" class="ui-note">
        기존 로그인 세션이 종료되며 다음 로그인 시 비밀번호를 변경해야 합니다.
      </p>
      <label v-if="['create', 'password-reset'].includes(mode)" class="ui-field"
        >임시 비밀번호<input
          v-model="form.temporaryPassword"
          type="password"
          autocomplete="new-password"
          minlength="10"
          maxlength="64"
          required
          :disabled="busy"
        /><small>문자·숫자 포함 10~64자. 발급 대상자에게 안전하게 전달해 주세요.</small></label
      >
      <p v-if="actionError" class="ui-error" role="alert">{{ actionError }}</p>
      <div class="ui-actions">
        <button
          type="button"
          class="button button-secondary"
          :disabled="busy"
          @click="modal = false"
        >
          취소</button
        ><button class="button button-primary" :disabled="busy">
          {{ busy ? '처리 중…' : titles[mode] }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
<style scoped>
.account-search {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.account-search .ui-field {
  width: min(100%, 320px);
}
th,
td {
  text-align: left;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}
td .button {
  white-space: nowrap;
}
</style>
