<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Plus, ShieldCheck } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
const props = defineProps({ rider: { type: Boolean, default: false } })
const label = computed(() => (props.rider ? '라이더' : '관리자'))
const search = ref('')
const isOpen = ref(false)
const notice = ref('')
const error = ref('')
const form = reactive({ name: '', username: '', password: '' })
const accounts = ref([
  {
    id: 'sample-account',
    name: props.rider ? '라이더' : '운영자',
    username: props.rider ? 'sample.rider' : 'sample.admin',
    role: props.rider ? 'RIDER' : 'ADMIN',
    status: '발급 미실행',
  },
])
const visible = computed(() =>
  accounts.value.filter((a) =>
    `${a.name} ${a.username}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
const columnPt = {
  headerCell: 'ui-table-cell ui-table-heading',
  bodyCell: 'ui-table-cell',
  columnHeaderContent: 'ui-actions',
}
watch(isOpen, () => {
  form.password = ''
  error.value = ''
})
function openForm() {
  Object.assign(form, { name: '', username: '', password: '' })
  isOpen.value = true
}
function review() {
  if (!form.name.trim() || !form.username.trim()) return
  if (accounts.value.some((a) => a.username === form.username.trim())) {
    error.value = '예시 목록에 같은 아이디가 있어요.'
    return
  }
  if (
    !props.rider &&
    (form.password.length < 10 ||
      form.password.length > 64 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password) ||
      /\s/.test(form.password))
  ) {
    error.value = '임시 비밀번호는 문자·숫자를 포함한 10~64자, 공백 없이 입력해 주세요.'
    return
  }
  accounts.value.push({
    id: crypto.randomUUID(),
    name: form.name.trim(),
    username: form.username.trim(),
    role: props.rider ? 'RIDER' : 'ADMIN',
    status: '발급 미실행',
  })
  form.password = ''
  isOpen.value = false
  notice.value = '예시 목록에 추가했습니다. 계정은 발급되지 않았으며 로그인할 수 없습니다.'
}
</script>
<template>
  <header class="ui-heading">
    <div>
      <h1>{{ label }} 계정 관리</h1>
      <p>
        {{
          rider
            ? '관리자가 라이더 아이디를 발급하고 관리합니다.'
            : 'SUPER_ADMIN 전용 관리자 계정 발급 화면입니다.'
        }}
      </p>
    </div>
    <button class="button button-primary" @click="openForm">
      <Plus :size="18" aria-hidden="true" />{{ label }} 계정 발급
    </button>
  </header>
  <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
  <DesignPreview :title="`${label} 계정`" empty="등록된 계정이 없어요."
    ><section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>계정 목록</h2>
        <label class="ui-field"
          >이름·아이디 검색<input v-model="search" type="search" placeholder="검색어 입력"
        /></label>
      </div>
      <div
        class="ui-table-scroll"
        tabindex="0"
        :aria-label="`${label} 계정 표. 작은 화면에서 좌우 스크롤`"
      >
        <DataTable :value="visible" data-key="id" :pt="{ table: 'ui-table' }">
          <Column field="name" header="이름" sortable :pt="columnPt" />
          <Column field="username" header="아이디" sortable :pt="columnPt" />
          <Column field="role" header="역할" :pt="columnPt" />
          <Column field="status" header="상태" :pt="columnPt" />
          <template #empty
            ><p class="ui-empty">검색 결과가 없습니다. 검색어를 확인해 주세요.</p></template
          >
        </DataTable>
      </div>
      <p class="ui-muted">{{ visible.length }}개 실제 계정 상태는 서버 조회 후 표시합니다.</p>
    </section></DesignPreview
  >
  <aside class="ui-note ui-stack" style="margin-top: 24px">
    <div class="ui-actions">
      <ShieldCheck :size="20" aria-hidden="true" />
      <h2>계정 운영 안내</h2>
    </div>
    <p>
      {{
        rider
          ? '라이더 회원가입은 제공하지 않습니다. 발급된 ID로 별도 라이더 로그인 화면을 사용합니다.'
          : 'SUPER_ADMIN 생성이나 일반 사용자의 ADMIN 승격은 제공하지 않습니다.'
      }}
    </p>
    <div class="ui-actions">
      <button class="button button-secondary" disabled>비활성화</button
      ><button class="button button-secondary" disabled>잠금 해제</button
      ><button class="button button-secondary" disabled>비밀번호 초기화</button>
    </div>
    <p class="ui-muted">대상 계정 조회와 보안 API 연결 후 사용할 수 있습니다.</p>
  </aside>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    :header="`${label} 계정 발급 준비`"
    :pt="dialogPt"
    ><form class="ui-stack" @submit.prevent="review">
      <label class="ui-field"
        >이름<input v-model.trim="form.name" maxlength="50" required autocomplete="off"
      /></label>
      <label class="ui-field"
        >{{ label }} 아이디<input
          v-model.trim="form.username"
          maxlength="50"
          required
          autocomplete="off"
      /></label>
      <label v-if="!rider" class="ui-field"
        >임시 비밀번호<input
          v-model="form.password"
          type="password"
          minlength="10"
          maxlength="64"
          required
          autocomplete="new-password"
        /><small>문자·숫자 포함 10~64자, 공백 불가</small></label
      >
      <p v-else class="ui-note">
        라이더 초기 비밀번호 발급·전달 방식은 백엔드 연결 시 확정합니다. 현재는 이름과 ID 배치만
        확인합니다.
      </p>
      <p v-if="error" class="ui-error" role="alert">{{ error }}</p>
      <p class="ui-muted">실제 발급 요청은 전송하지 않습니다. 비밀번호는 보관하지 않습니다.</p>
      <div class="ui-actions">
        <button class="button button-secondary" type="button" @click="isOpen = false">취소</button
        ><button class="button button-primary" type="submit">예시 목록에 추가</button>
      </div>
    </form></Dialog
  >
</template>
