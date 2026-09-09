<script setup>
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, ShieldCheck, ChevronRight } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'

const step = ref(1)
const verified = ref(false)
function verifySample() {
  verified.value = true
  feedback.value = ''
}
function restart() {
  verified.value = false
  accepted.value = []
  goToStep(1)
}
const feedback = ref('')
const heading = ref(null)
const accepted = ref([])
const policies = [
  {
    id: 'terms',
    title: '서비스 이용약관',
    required: true,
    text: '서비스 이용에 관한 약관을 확인하는 자리입니다. 이 화면의 동의는 저장되지 않습니다.',
  },
  {
    id: 'privacy',
    title: '개인정보 수집 및 이용',
    required: true,
    text: '가입과 서비스 이용에 필요한 개인정보 안내를 확인하는 자리입니다. 실제 개인정보는 수집하지 않습니다.',
  },
  {
    id: 'marketing',
    title: '혜택 및 소식 받기',
    required: false,
    text: '새로운 소식과 혜택 안내를 선택하는 항목입니다. 동의하지 않아도 다음 단계로 이동할 수 있습니다.',
  },
]
const allAccepted = computed({
  get: () => accepted.value.length === policies.length,
  set: (value) => {
    accepted.value = value ? policies.map((p) => p.id) : []
  },
})
const canComplete = computed(
  () =>
    verified.value &&
    policies.filter((p) => p.required).every((p) => accepted.value.includes(p.id)),
)
async function goToStep(value) {
  step.value = value
  feedback.value = ''
  await nextTick()
  heading.value?.focus()
}
</script>

<template>
  <div class="page account-design signup-design design-review-page">
    <DesignPreview title="회원가입" empty="가입 약관을 불러오지 못했어요.">
      <RouterLink to="/login" class="text-action back-link">로그인으로 돌아가기</RouterLink>
      <header class="intro">
        <h1 ref="heading" tabindex="-1">
          {{ step === 3 ? '가입 준비가 끝났어요.' : '챱챱을 시작해요.' }}
        </h1>
        <p>
          {{
            step === 3 ? '이제 나에게 맞는 식사를 둘러보세요.' : '본인 확인과 약관 동의만 남았어요.'
          }}
        </p>
      </header>
      <ol class="steps" aria-label="가입 단계">
        <li
          v-for="(label, i) in ['본인 확인', '약관 동의', '완료']"
          :key="label"
          :aria-current="step === i + 1 ? 'step' : undefined"
          :class="{ reached: step >= i + 1 }"
        >
          <span class="step-number"
            ><Check v-if="step > i + 1" :size="16" aria-hidden="true" /><template v-else>{{
              i + 1
            }}</template></span
          ><span>{{ label }}</span>
        </li>
      </ol>
      <section v-if="step === 1" class="surface stack">
        <div class="row">
          <span class="identity-icon"><ShieldCheck :size="28" aria-hidden="true" /></span>
          <h2>본인 확인</h2>
        </div>
        <p class="muted">안전한 서비스 이용을 위해 본인 확인을 진행해 주세요.</p>
        <div v-if="verified" class="notice row" role="status">
          <Check :size="20" aria-hidden="true" /><span>본인 확인 예시를 확인했어요.</span>
        </div>
        <div v-else class="actions">
          <button class="button button-primary" type="button" @click="verifySample">
            본인 확인 예시 보기</button
          ><button
            class="button button-secondary"
            type="button"
            @click="feedback = '본인 확인을 취소했어요. 다시 진행할 수 있어요.'"
          >
            취소 상태 보기
          </button>
        </div>
        <p v-if="feedback" class="notice" role="status">{{ feedback }}</p>
        <button
          class="button button-primary"
          type="button"
          :disabled="!verified"
          @click="goToStep(2)"
        >
          약관 확인하기<ChevronRight :size="18" aria-hidden="true" />
        </button>
      </section>
      <section v-else-if="step === 2" class="surface stack">
        <h2>이용 약관을 확인해 주세요.</h2>
        <label class="check-row all-check"
          ><input v-model="allAccepted" type="checkbox" /><strong>전체 동의</strong></label
        >
        <div class="policy-list">
          <div v-for="policy in policies" :key="policy.id" class="policy">
            <label class="check-row"
              ><input v-model="accepted" :value="policy.id" type="checkbox" /><span
                >{{ policy.required ? '[필수]' : '[선택]' }} {{ policy.title }}</span
              ></label
            >
            <details>
              <summary>{{ policy.title }} 내용 보기</summary>
              <p>{{ policy.text }}</p>
            </details>
          </div>
        </div>
        <p class="muted">선택 항목에 동의하지 않아도 가입할 수 있어요.</p>
        <div class="actions">
          <button class="button button-secondary" type="button" @click="goToStep(1)">이전</button
          ><button
            class="button button-primary"
            type="button"
            :disabled="!canComplete"
            @click="goToStep(3)"
          >
            가입 완료 예시 보기
          </button>
        </div>
      </section>
      <section v-else class="surface stack" aria-label="가입 완료 예시">
        <div class="notice row">
          <Check :size="24" aria-hidden="true" /><strong>가입 완료 화면이에요.</strong>
        </div>
        <p>실제 계정은 생성되지 않았어요.</p>
        <RouterLink to="/" class="button button-primary">챱챱 둘러보기</RouterLink
        ><button class="text-action" type="button" @click="restart">처음부터 다시 보기</button>
      </section>
      <p class="sample-note">
        예시 화면입니다. 실제 본인인증과 회원가입은 진행되지 않으며, 약관은 예시입니다.
      </p>
    </DesignPreview>
  </div>
</template>

<style scoped src="../../../common/styles/account-design.css"></style>
<style scoped>
.signup-design {
  max-width: 620px;
  padding-top: var(--space-6);
}
.back-link {
  display: inline-flex;
  align-items: center;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-6);
  gap: var(--space-2);
}
.steps li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.step-number {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: var(--color-border);
  border-radius: 50%;
  flex-shrink: 0;
}
.reached .step-number {
  background: var(--color-primary-pressed);
  color: var(--color-surface);
}
.steps [aria-current] {
  font-weight: var(--font-weight-heavy);
  color: var(--color-text);
}
.identity-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: var(--color-primary-soft);
  border-radius: var(--radius-lg);
  color: var(--color-primary-pressed);
}
.all-check {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.policy + .policy {
  margin-top: var(--space-3);
}
.policy details {
  margin-left: var(--space-6);
}
.policy summary {
  cursor: pointer;
  color: var(--color-text-muted);
  min-height: 44px;
  align-content: center;
}
.policy details p {
  background: var(--color-background);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
@media (max-width: 360px) {
  .steps li {
    gap: var(--space-1);
  }
}
@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
