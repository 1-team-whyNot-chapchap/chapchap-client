<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import { roleHome } from '../authSession.js'
import {
  createSignupFlow,
  createIdentityVerificationId,
  restoreConsent,
  signupError,
} from '../signupFlow.js'
import { loadPortOne } from '../portOne.js'

const route = useRoute()
const router = useRouter()
const flow = createSignupFlow({
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
  removeItem: (key) => window.sessionStorage.removeItem(key),
})
const session = ref(null)
const policies = ref([])
const accepted = ref([])
const busy = ref(false)
const loading = ref(false)
const message = ref('')
const policyError = ref('')
const completed = ref(false)
const heading = ref(null)
const uncertain = ref(false)
const user = ref(null)
const storeId = import.meta.env.VITE_PORTONE_STORE_ID
const channelKey = import.meta.env.VITE_PORTONE_IDENTITY_CHANNEL_KEY
const configured = Boolean(storeId && channelKey)
const returned = computed(() => session.value?.returned === true)
const allAccepted = computed({
  get: () =>
    policies.value.length > 0 && policies.value.every((p) => accepted.value.includes(p.policyId)),
  set: (value) => {
    accepted.value = value ? policies.value.map((p) => p.policyId) : []
  },
})
const canComplete = computed(
  () =>
    !busy.value &&
    !loading.value &&
    !uncertain.value &&
    policies.value.length > 0 &&
    policies.value.filter((p) => p.required).every((p) => accepted.value.includes(p.policyId)),
)

function syncSession() {
  session.value = flow.read()
  if (!session.value && !completed.value)
    message.value =
      '가입 시간이 만료되었거나 가입 세션이 없습니다. 소셜 로그인부터 다시 진행해 주세요.'
}
async function fetchPolicies() {
  loading.value = true
  policyError.value = ''
  policies.value = []
  accepted.value = []
  try {
    policies.value = await authSession.getSignupPolicies()
  } catch {
    policyError.value = '현재 가입 약관을 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
}
async function verify() {
  if (!canComplete.value || !configured) return
  syncSession()
  if (!session.value) return
  busy.value = true
  message.value = ''
  let stage = '본인인증 모듈 로딩'
  let success = false
  try {
    const sdk = await loadPortOne()
    stage = '인증 요청 준비'
    const id = createIdentityVerificationId()
    session.value = flow.beginVerification(id, policies.value, accepted.value)
    stage = 'PortOne 인증창 호출'
    const result = await sdk.requestIdentityVerification({
      storeId,
      channelKey,
      identityVerificationId: id,
      redirectUrl: `${window.location.origin}/signup/identity-callback`,
    })
    success = flow.acceptResult(result)
    if (!success) message.value = '본인인증이 취소되었거나 완료되지 않았습니다. 다시 진행해 주세요.'
    syncSession()
  } catch (error) {
    // Exclude provider message/PII. Only a short identifier is safe to show.
    const code =
      typeof error?.code === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(error.code)
        ? error.code
        : error instanceof TypeError
          ? 'TYPE_ERROR'
          : 'UNKNOWN'
    message.value = `${stage} 단계에서 실패했습니다. 오류 코드: ${code}.`
  } finally {
    busy.value = false
  }
  if (success && !disposed) await submit()
}
async function submit() {
  syncSession()
  if (!session.value || !canComplete.value || !returned.value || disposed) return
  busy.value = true
  message.value = ''
  try {
    if (!flow.claimSubmission()) {
      uncertain.value = true
      message.value = '이미 가입 요청을 보냈습니다. 로그인하여 가입 결과를 확인해 주세요.'
      return
    }
    user.value = await authSession.completeSignup({
      signupSessionId: session.value.signupSessionId,
      identityVerificationId: session.value.identityVerificationId,
      policies: policies.value.map((p) => ({
        policyId: p.policyId,
        agreed: accepted.value.includes(p.policyId),
      })),
    })
    completed.value = true
    flow.clear()
    await nextTick()
    heading.value?.focus()
  } catch (error) {
    message.value = signupError(error)
    // A lost response may mean the account already exists. Never automatically replay.
    uncertain.value = true
  } finally {
    busy.value = false
  }
}
function cancel() {
  flow.clear()
}
let timer
let disposed = false
onMounted(async () => {
  try {
    syncSession()
    let resume = false
    if ('identityVerificationId' in route.query || 'code' in route.query) {
      resume = flow.acceptResult(route.query)
      if (!resume) message.value = '본인인증 결과를 확인하지 못했습니다. 다시 인증해 주세요.'
      session.value = flow.read()
      await router.replace('/signup')
    }
    if (session.value) {
      // Preload before the click so popup-based providers retain the user gesture.
      if (configured) void loadPortOne().catch(() => {})
      await fetchPolicies()
      if (session.value.submitted) {
        uncertain.value = true
        message.value = '이미 가입 요청을 보냈습니다. 로그인하여 가입 결과를 확인해 주세요.'
      } else if (resume && !disposed) {
        const restored = restoreConsent(session.value.consentDraft, policies.value)
        if (restored) {
          accepted.value = restored
          await submit()
        } else
          message.value =
            '약관이 변경되었거나 이전 동의를 확인하지 못했습니다. 약관을 다시 확인해 주세요.'
      }
    }
    if (!disposed)
      timer = window.setInterval(() => {
        try {
          syncSession()
        } catch {
          session.value = null
          window.clearInterval(timer)
        }
      }, 1000)
  } catch {
    message.value =
      '브라우저 저장소를 사용할 수 없습니다. 저장소 설정을 확인한 뒤 다시 로그인해 주세요.'
  }
})
onUnmounted(() => {
  disposed = true
  window.clearInterval(timer)
})
</script>

<template>
  <main class="page account-design signup-design">
    <header class="intro">
      <h1 ref="heading" tabindex="-1">
        {{ completed ? '가입이 완료되었어요.' : '챱챱을 시작해요.' }}
      </h1>
      <p>
        {{
          completed
            ? '이제 나에게 맞는 식사를 둘러보세요.'
            : '약관에 동의하고 본인인증을 진행해 주세요.'
        }}
      </p>
    </header>
    <p v-if="message" class="notice" role="alert">{{ message }}</p>
    <section v-if="completed" class="surface stack">
      <h2>챱챱에 오신 것을 환영해요.</h2>
      <RouterLink class="button button-primary" :to="roleHome(user.role)">시작하기</RouterLink>
    </section>
    <template v-else-if="session">
      <section class="surface stack" :aria-busy="loading || busy">
        <h2>약관 동의</h2>
        <p v-if="loading" role="status">가입 약관을 불러오고 있어요.</p>
        <div v-else-if="policyError" class="stack">
          <p role="alert">{{ policyError }}</p>
          <button class="button button-secondary" @click="fetchPolicies">약관 다시 불러오기</button>
        </div>
        <fieldset v-else :disabled="busy || uncertain">
          <legend>가입 약관 동의</legend>
          <label class="check-row all-check"
            ><input v-model="allAccepted" type="checkbox" /><strong>전체 동의</strong></label
          >
          <div v-for="policy in policies" :key="policy.policyId" class="policy">
            <label class="check-row"
              ><input v-model="accepted" :value="policy.policyId" type="checkbox" />
              <span>{{ policy.required ? '[필수]' : '[선택]' }} {{ policy.title }}</span>
            </label>
            <details>
              <summary>{{ policy.title }} 내용 보기</summary>
              <p>{{ policy.content }}</p>
            </details>
          </div>
          <p class="muted">선택 항목에 동의하지 않아도 가입할 수 있어요.</p>
        </fieldset>
        <p class="muted">
          만 14세 이상 가입할 수 있어요. 아래 버튼을 누르면 본인인증 후 회원가입이 완료됩니다.
        </p>
        <p v-if="!configured" role="alert">
          본인인증 서비스 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.
        </p>
        <button
          class="button button-primary"
          type="button"
          :disabled="!canComplete || !configured"
          @click="verify"
        >
          {{ busy ? '본인인증 및 가입 처리 중…' : '동의하고 본인인증하기' }}
        </button>
      </section>
    </template>
    <RouterLink v-if="!completed && !busy" class="text-action back-link" to="/login" @click="cancel"
      >로그인으로 돌아가기</RouterLink
    >
  </main>
</template>

<style scoped src="../../../common/styles/account-design.css"></style>
<style scoped>
.signup-design {
  max-width: 620px;
  padding-top: var(--space-6);
}
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
legend {
  margin-bottom: var(--space-3);
}
.all-check {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.policy {
  margin-block: var(--space-3);
}
.policy summary {
  cursor: pointer;
  min-height: 44px;
  align-content: center;
}
.policy details p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 320px;
  overflow-y: auto;
  padding: var(--space-4);
  background: var(--color-background);
}
.back-link {
  display: inline-flex;
  margin-top: var(--space-4);
  min-height: 44px;
  align-items: center;
}
</style>
