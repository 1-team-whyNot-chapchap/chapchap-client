<script setup>
import { computed, ref } from 'vue'
import { Check, Clipboard, Clock3, Plus, ShieldAlert, UsersRound, X } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import EmptyState from '../../../common/components/feedback/EmptyState.vue'

const emit = defineEmits(['navigate'])

const monthlyLimit = 15
const invitationCodes = ref([
  {
    id: 'invite-01',
    code: 'CHAP-RD-8K3M',
    createdAt: '오늘 09:20',
    expiresAt: '오늘 09:20까지',
    status: '사용 가능',
  },
  {
    id: 'invite-02',
    code: 'CHAP-RD-2P7Q',
    createdAt: '어제 14:05',
    expiresAt: '만료됨',
    status: '만료됨',
  },
  {
    id: 'invite-03',
    code: 'CHAP-RD-9V4L',
    createdAt: '8월 8일 11:40',
    expiresAt: '사용 완료',
    status: '사용 완료',
  },
])
const pendingDisableId = ref('')
const copiedCode = ref('')
const feedback = ref('')

const issuedCount = computed(() => invitationCodes.value.length)
const remainingCount = computed(() => monthlyLimit - issuedCount.value)
const activeCodes = computed(() =>
  invitationCodes.value.filter((code) => code.status === '사용 가능'),
)

function getStatusClass(status) {
  return {
    '사용 가능': 'available',
    만료됨: 'expired',
    '사용 완료': 'used',
    비활성화됨: 'disabled',
  }[status]
}

function createInvitationCode() {
  if (remainingCount.value <= 0) {
    feedback.value = '이번 달 초대 코드 한도를 모두 사용했어요.'
    return
  }

  const sequence = String(issuedCount.value + 1).padStart(2, '0')
  const code = {
    id: `invite-${sequence}`,
    code: `CHAP-RD-${String(issuedCount.value + 1).padStart(4, '0')}`,
    createdAt: '방금 전',
    expiresAt: '24시간 뒤 만료',
    status: '사용 가능',
  }

  invitationCodes.value.unshift(code)
  feedback.value = `${code.code} 초대 코드를 만들었어요. 라이더 한 명에게만 전달해 주세요.`
}

async function copyCode(code) {
  copiedCode.value = code.id
  feedback.value = `${code.code} 코드를 복사했어요.`

  try {
    await navigator.clipboard?.writeText(code.code)
  } catch {
    feedback.value = `${code.code} 코드를 선택해 복사해 주세요.`
  }
}

function requestDisable(code) {
  pendingDisableId.value = code.id
  feedback.value = `${code.code} 코드는 비활성화하면 다시 사용할 수 없어요.`
}

function cancelDisable() {
  pendingDisableId.value = ''
  feedback.value = ''
}

function disableCode(code) {
  code.status = '비활성화됨'
  code.expiresAt = '점주가 비활성화함'
  pendingDisableId.value = ''
  feedback.value = `${code.code} 코드를 비활성화했어요.`
}
</script>

<template>
  <section class="page invitation-page">
    <PageBackButton label="점주 운영으로" @back="emit('navigate', 'owner-dashboard')" />

    <header class="invitation-page__header">
      <h1>라이더 초대 코드를 관리하세요.</h1>
      <p>코드는 발급 후 24시간 동안 한 번만 사용할 수 있어요. 연결할 라이더에게만 전달해 주세요.</p>
    </header>

    <section class="quota-summary" aria-label="이달 초대 코드 현황">
      <div>
        <span>이번 달 남은 발급 수</span>
        <strong
          >{{ remainingCount }}<small> / {{ monthlyLimit }}개</small></strong
        >
        <p>관리자가 부여한 월별 한도 안에서 발급할 수 있어요.</p>
      </div>
      <button
        class="button button-primary"
        type="button"
        :disabled="remainingCount === 0"
        @click="createInvitationCode"
      >
        <Plus :size="18" aria-hidden="true" />초대 코드 만들기
      </button>
    </section>

    <p v-if="remainingCount === 0" class="form-help" role="status">
      이번 달 발급 한도를 모두 사용했어요. 다음 달 한도 또는 관리자 설정을 확인해 주세요.
    </p>
    <p v-if="feedback" class="invitation-feedback" role="status">{{ feedback }}</p>

    <section class="invitation-section" aria-labelledby="active-code-title">
      <div class="section-heading">
        <div>
          <h2 id="active-code-title">사용 가능한 코드</h2>
        </div>
        <span>{{ activeCodes.length }}개</span>
      </div>

      <EmptyState
        v-if="!activeCodes.length"
        title="사용 가능한 코드가 없어요."
        description="새 라이더를 연결할 때 초대 코드를 만들어 전달해 주세요."
        action-label="초대 코드 만들기"
        @action="createInvitationCode"
      />

      <ul v-else class="invitation-list">
        <li v-for="code in activeCodes" :key="code.id" class="invitation-card">
          <div class="invitation-card__main">
            <span class="code-mark"><UsersRound :size="19" aria-hidden="true" /></span>
            <div>
              <strong>{{ code.code }}</strong>
              <p><Clock3 :size="15" aria-hidden="true" />{{ code.expiresAt }}</p>
            </div>
          </div>
          <div class="invitation-card__actions">
            <button class="button button-secondary" type="button" @click="copyCode(code)">
              <Check v-if="copiedCode === code.id" :size="16" aria-hidden="true" />
              <Clipboard v-else :size="16" aria-hidden="true" />
              {{ copiedCode === code.id ? '복사됨' : '코드 복사' }}
            </button>
            <button
              class="text-button text-button--danger"
              type="button"
              @click="requestDisable(code)"
            >
              <X :size="16" aria-hidden="true" />비활성화
            </button>
          </div>

          <div v-if="pendingDisableId === code.id" class="disable-confirm" role="alert">
            <ShieldAlert :size="18" aria-hidden="true" />
            <p>이 코드는 즉시 사용할 수 없게 됩니다.</p>
            <button class="button button-secondary" type="button" @click="cancelDisable">
              취소
            </button>
            <button class="button button-danger" type="button" @click="disableCode(code)">
              비활성화
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section class="invitation-section invitation-section--history" aria-labelledby="history-title">
      <div class="section-heading">
        <div>
          <h2 id="history-title">이번 달 발급 이력</h2>
        </div>
        <span>{{ issuedCount }}개 발급</span>
      </div>
      <ul class="history-list">
        <li v-for="code in invitationCodes" :key="`${code.id}-history`">
          <div>
            <strong>{{ code.code }}</strong>
            <span>{{ code.createdAt }} · {{ code.expiresAt }}</span>
          </div>
          <b :class="`status status--${getStatusClass(code.status)}`">{{ code.status }}</b>
        </li>
      </ul>
    </section>

    <aside class="policy-note">
      <ShieldAlert :size="20" aria-hidden="true" />
      <div>
        <strong>운영 정책</strong>
        <p>
          실제 발급·사용·비활성화 처리는 서버에서 점주 매장 소유권과 코드 상태를 다시 확인해야
          합니다.
        </p>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.invitation-page {
  max-width: 960px;
}
.back-button {
  margin-bottom: 28px;
}
.invitation-page__header {
  max-width: 680px;
}
.eyebrow,
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.04em;
}
.invitation-page h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.invitation-page__header > p:last-child {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.quota-summary {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-top: 32px;
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-primary-soft);
}
.quota-summary span,
.quota-summary p {
  display: block;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.quota-summary strong {
  display: block;
  margin-top: 6px;
  font-size: var(--font-page-title);
  letter-spacing: -0.06em;
}
.quota-summary strong small {
  color: var(--color-text-muted);
  font-size: var(--font-item-title);
  font-weight: 700;
}
.quota-summary p {
  margin-top: 8px;
  line-height: var(--line-height-body);
}
.quota-summary .button {
  flex: none;
  min-height: 48px;
}
.form-help,
.invitation-feedback {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.invitation-feedback {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
}
.invitation-section {
  margin-top: 42px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}
.section-heading h2 {
  margin: 0;
  font-size: var(--font-section-title);
  letter-spacing: -0.03em;
}
.section-heading > span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}
.invitation-list,
.history-list {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}
.invitation-card {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.invitation-card,
.invitation-card__main,
.invitation-card__actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.invitation-card {
  justify-content: space-between;
  flex-wrap: wrap;
}
.invitation-card__main {
  min-width: 0;
}
.code-mark {
  width: 40px;
  height: 40px;
  display: grid;
  flex: none;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.invitation-card strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: var(--font-item-title);
  letter-spacing: 0.04em;
}
.invitation-card p {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 5px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.invitation-card__actions {
  flex: none;
}
.text-button--danger {
  color: var(--color-danger);
}
.disable-confirm {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  color: var(--color-danger);
}
.disable-confirm p {
  flex: 1;
  margin: 0;
  color: var(--color-text);
}
.disable-confirm .button {
  min-height: 38px;
  padding-inline: 11px;
}
.invitation-section--history {
  padding-top: 34px;
  border-top: 1px solid var(--color-border);
}
.history-list {
  gap: 0;
  border-top: 1px solid var(--color-border);
}
.history-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.history-list div {
  min-width: 0;
}
.history-list strong,
.history-list span {
  display: block;
  overflow-wrap: anywhere;
}
.history-list span {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.status {
  flex: none;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: var(--font-caption);
}
.status--available {
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.status--expired,
.status--disabled {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.status--used {
  background: var(--color-info-soft);
  color: var(--color-info);
}
.policy-note {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 11px;
  margin-top: 34px;
  padding: 16px;
  border-radius: 14px;
  background: var(--color-warning-soft);
  color: #78601c;
}
.policy-note strong,
.policy-note p {
  margin: 0;
}
.policy-note p {
  margin-top: 4px;
  color: inherit;
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
@media (max-width: 620px) {
  .quota-summary {
    align-items: stretch;
    flex-direction: column;
  }
  .quota-summary .button {
    width: 100%;
  }
  .invitation-card__actions {
    width: 100%;
  }
  .invitation-card__actions .button {
    flex: 1;
  }
  .disable-confirm {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .disable-confirm p {
    flex-basis: calc(100% - 30px);
  }
}
</style>
