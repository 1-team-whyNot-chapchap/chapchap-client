<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search, UserRound, ShieldCheck } from 'lucide-vue-next'
import ConfirmDialog from '../../../common/components/feedback/ConfirmDialog.vue'
import {
  isValidPhone,
  promotionBlockReason,
  promotionExamples,
  searchPreviewUsers,
} from '../riderPromotion.js'

const phone = ref('')
const results = ref([])
const selectedId = ref('')
const identityConfirmed = ref(false)
const dialogOpen = ref(false)
const state = ref('idle')
const error = ref('')
const completedName = ref('')
let requestId = 0
const selected = computed(() => results.value.find((user) => user.id === selectedId.value))
const blocked = computed(() => promotionBlockReason(selected.value))
const canPreview = computed(
  () => state.value === 'ready' && !blocked.value && identityConfirmed.value,
)
const roleLabel = (role) => ({ CUSTOMER: '고객', RIDER: '라이더' })[role] || '변경 대상 아님'
const progressLabel = (value) => (value === true ? '있음' : value === false ? '없음' : '확인 불가')

function resetSelection() {
  selectedId.value = ''
  identityConfirmed.value = false
  dialogOpen.value = false
  completedName.value = ''
}
watch(
  phone,
  () => {
    requestId++
    results.value = []
    state.value = 'idle'
    error.value = ''
    resetSelection()
  },
  { flush: 'sync' },
)
watch(selectedId, () => {
  identityConfirmed.value = false
  dialogOpen.value = false
})
onBeforeUnmount(() => requestId++)

async function search() {
  resetSelection()
  results.value = []
  if (!isValidPhone(phone.value)) {
    error.value = '휴대폰 번호 전체를 숫자와 하이픈으로 입력해 주세요.'
    state.value = 'idle'
    return
  }
  const current = ++requestId
  state.value = 'loading'
  error.value = ''
  try {
    // 조회 대기 화면을 검수하기 위한 로컬 지연. 네트워크 요청은 하지 않습니다.
    await new Promise((resolve) => setTimeout(resolve, 250))
    if (current !== requestId) return
    results.value = searchPreviewUsers(phone.value)
    state.value = 'ready'
  } catch {
    if (current !== requestId) return
    error.value = '검색하지 못했습니다. 다시 시도해 주세요.'
    state.value = 'error'
  }
}

function useExample(value) {
  phone.value = value
  search()
}

function confirmPreview() {
  if (!canPreview.value) return
  completedName.value = selected.value.name
  dialogOpen.value = false
  identityConfirmed.value = false
  state.value = 'complete'
  // 실제 역할, 인증 정보, 서버 데이터는 변경하지 않습니다.
}
</script>

<template>
  <header class="ui-heading">
    <div>
      <h1>라이더 등록</h1>
      <p>가입한 사용자를 찾아 확인한 뒤 라이더로 변경합니다.</p>
    </div>
  </header>
  <p class="ui-sample">화면 미리보기 · 가상 사용자만 검색되며 실제 권한은 변경되지 않습니다.</p>
  <div class="promotion-layout">
    <section class="ui-surface ui-stack" aria-labelledby="rider-search-heading">
      <h2 id="rider-search-heading">1. 사용자 찾기</h2>
      <form class="ui-stack" @submit.prevent="search">
        <div class="ui-stack promotion-field">
          <label for="rider-search-phone">가입한 휴대폰 번호</label>
          <div class="promotion-search">
            <input
              id="rider-search-phone"
              v-model="phone"
              class="ui-input"
              type="tel"
              inputmode="tel"
              autocomplete="off"
              maxlength="20"
              placeholder="010-0000-0000"
              :aria-invalid="Boolean(error)"
              aria-describedby="phone-help phone-error"
            />
            <button class="button button-primary" :disabled="state === 'loading'" type="submit">
              <Search :size="18" aria-hidden="true" />{{ state === 'loading' ? '검색 중' : '검색' }}
            </button>
          </div>
          <p id="phone-help" class="ui-muted">
            전체 번호가 일치하는 계정을 찾습니다. 번호만으로 본인 여부를 판단하지 마세요.
          </p>
          <p id="phone-error" class="promotion-error" role="alert">{{ error }}</p>
        </div>
      </form>
      <details class="promotion-examples">
        <summary>가상 사용자로 흐름 확인하기</summary>
        <div class="ui-stack">
          <button
            v-for="example in promotionExamples"
            :key="example.phone"
            type="button"
            class="promotion-example"
            @click="useExample(example.phone)"
          >
            <span>{{ example.label }}</span
            ><span>{{ example.phone }}</span>
          </button>
        </div>
      </details>
      <div aria-live="polite" :aria-busy="state === 'loading'">
        <div v-if="state === 'loading'" class="ui-empty"><p>사용자를 찾고 있습니다.</p></div>
        <div v-else-if="state === 'idle'" class="ui-empty">
          <UserRound :size="28" aria-hidden="true" />
          <p>번호를 입력하면 검색 결과가 표시됩니다.</p>
        </div>
        <div v-else-if="state === 'ready' && !results.length" class="ui-empty">
          <p>일치하는 사용자가 없습니다.</p>
          <p class="ui-muted">
            가입한 번호를 확인해 주세요. 번호가 등록되지 않았다면 먼저 등록해야 합니다.
          </p>
        </div>
        <div v-else-if="results.length" class="ui-stack">
          <p>{{ results.length }}명 검색됨 · 가상 데이터</p>
          <p v-if="results.length > 1" class="ui-note">
            같은 번호의 계정이 여러 개입니다. 이름과 가입 정보를 대조하고 대상을 직접 선택해 주세요.
          </p>
          <fieldset class="promotion-results" :disabled="state === 'complete'">
            <legend class="promotion-legend">라이더로 변경할 사용자 선택</legend>
            <label
              v-for="user in results"
              :key="user.id"
              class="promotion-result"
              :class="{ 'is-selected': selectedId === user.id }"
            >
              <input v-model="selectedId" type="radio" name="rider-target" :value="user.id" />
              <span class="promotion-person"
                ><strong>{{ user.name }}</strong
                ><span>{{ user.provider }} · 가입 {{ user.joinedAt }}</span
                ><small>{{ user.id }}</small></span
              >
              <span
                >{{ roleLabel(user.role) }} · {{ user.status === 'ACTIVE' ? '활성' : '정지' }}</span
              >
            </label>
          </fieldset>
        </div>
      </div>
    </section>
    <section class="ui-surface ui-stack" aria-labelledby="rider-confirm-heading">
      <h2 id="rider-confirm-heading">2. 확인 후 변경</h2>
      <div v-if="!selected" class="ui-empty">
        <ShieldCheck :size="28" aria-hidden="true" />
        <p>검색 결과에서 사용자를 선택해 주세요.</p>
      </div>
      <template v-else>
        <dl class="ui-details">
          <div>
            <dt>선택한 사용자</dt>
            <dd>{{ selected.name }} · {{ selected.id }}</dd>
          </div>
          <div>
            <dt>현재 역할</dt>
            <dd>{{ roleLabel(selected.role) }}</dd>
          </div>
          <div>
            <dt>변경할 역할</dt>
            <dd>라이더</dd>
          </div>
          <div>
            <dt>진행 중인 구독</dt>
            <dd>{{ progressLabel(selected.hasActiveSubscription) }}</dd>
          </div>
          <div>
            <dt>처리 중인 주문</dt>
            <dd>{{ progressLabel(selected.hasPendingOrders) }}</dd>
          </div>
        </dl>
        <p v-if="blocked" class="ui-note" role="status">{{ blocked }}</p>
        <template v-else>
          <p class="ui-note">
            변경 후 같은 소셜 계정으로 다시 로그인하도록 안내해 주세요. 라이더 계정은 배송
            업무용으로 사용합니다.
          </p>
          <label class="promotion-consent"
            ><input
              v-model="identityConfirmed"
              type="checkbox"
              :disabled="state === 'complete'"
            /><span
              >요청한 본인과 선택한 계정이 일치하며, 라이더 전환 내용을 안내했습니다.</span
            ></label
          >
        </template>
      </template>
      <button class="button button-primary" :disabled="!canPreview" @click="dialogOpen = true">
        라이더 변경 미리보기
      </button>
      <div v-if="state === 'complete'" class="ui-note" role="status">
        <strong>{{ completedName }}님의 변경 흐름을 확인했습니다.</strong>
        <p>
          실제 역할은 변경되지 않았습니다. 서버 연결 후 승격이 완료되면 재로그인 → 근무 일정·권역
          설정 → 배송 배정 순서로 안내합니다.
        </p>
        <button class="button button-secondary" @click="search">다시 확인하기</button>
      </div>
    </section>
  </div>
  <ConfirmDialog
    v-model:open="dialogOpen"
    title="라이더 변경을 미리 볼까요?"
    :description="`${selected?.name || ''} · ${selected?.id || ''} 계정의 CUSTOMER → RIDER 전환 흐름입니다. 실제 권한은 변경되지 않습니다.`"
    confirm-label="미리보기 확인"
    :confirm-disabled="!canPreview"
    @confirm="confirmPreview"
  >
    <p>실제 승격 후에는 기존 로그인 세션을 종료하고 같은 소셜 계정으로 다시 로그인해야 합니다.</p>
  </ConfirmDialog>
</template>

<style scoped>
.promotion-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}
.promotion-field {
  gap: var(--space-2);
}
.promotion-search {
  display: flex;
  gap: var(--space-2);
}
.promotion-search input {
  min-width: 0;
  flex: 1;
}
.promotion-search button {
  flex-shrink: 0;
}
.promotion-error {
  color: var(--color-danger, #a12b2b);
}
.promotion-error:empty {
  display: none;
}
.promotion-examples summary {
  cursor: pointer;
  padding-block: var(--space-3);
}
.promotion-example {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  text-align: left;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  min-height: 44px;
}
.promotion-results {
  display: grid;
  gap: var(--space-3);
  border: 0;
  padding: 0;
  min-width: 0;
}
.promotion-legend {
  margin-bottom: var(--space-3);
}
.promotion-result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.promotion-result.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
.promotion-person {
  display: grid;
  gap: var(--space-1);
  flex: 1;
  min-width: 120px;
}
.promotion-person span,
.promotion-person small {
  color: var(--color-text-muted);
}
.promotion-consent {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-height: 44px;
}
.promotion-consent input {
  margin-top: 4px;
  flex-shrink: 0;
}
@media (max-width: 1000px) {
  .promotion-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 375px) {
  .promotion-search {
    flex-direction: column;
  }
  .promotion-example {
    flex-wrap: wrap;
  }
}
</style>
