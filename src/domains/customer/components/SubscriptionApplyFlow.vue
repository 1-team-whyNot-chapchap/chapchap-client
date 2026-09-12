<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PageShell from '../../../common/layouts/PageShell.vue'

const weekdays = [
  { id: 'mon', label: '월요일' },
  { id: 'tue', label: '화요일' },
  { id: 'wed', label: '수요일' },
  { id: 'thu', label: '목요일' },
  { id: 'fri', label: '금요일' },
  { id: 'sat', label: '토요일' },
]

const steps = ['일정', '배송지', '인원·시간', '확인', '결제']
const step = ref(1)
const selectedDays = ref([])
const selectedPaymentMethod = ref('')
const showValidation = ref(false)
const conditions = reactive({})

const selectedDayModels = computed(() =>
  weekdays.filter((weekday) => selectedDays.value.includes(weekday.id)),
)
const stepTitle = computed(() => steps[step.value - 1])
const addressIsComplete = (dayId) => Boolean(conditions[dayId]?.addressId)
const conditionIsComplete = (dayId) => {
  const condition = conditions[dayId]
  return Boolean(condition?.people && condition?.addressId && condition?.slot)
}
const incompleteDays = computed(() =>
  selectedDayModels.value.filter((weekday) => !conditionIsComplete(weekday.id)),
)
const validationMessage = computed(() => {
  if (step.value === 1 && selectedDays.value.length === 0)
    return '배송 요일을 1일 이상 선택해 주세요.'
  if (step.value === 2 && selectedDayModels.value.some((day) => !addressIsComplete(day.id)))
    return '선택한 요일마다 배송지를 지정해 주세요.'
  if (step.value === 3 && incompleteDays.value.length > 0)
    return `${incompleteDays.value.map((day) => day.label).join(', ')} 인원과 시간대를 모두 입력해 주세요.`
  return ''
})
const canProceed = computed(() => step.value < 5 && !validationMessage.value)

function toggleDay(dayId) {
  if (selectedDays.value.includes(dayId)) {
    selectedDays.value = selectedDays.value.filter((id) => id !== dayId)
    delete conditions[dayId]
    return
  }

  selectedDays.value = [...selectedDays.value, dayId]
  conditions[dayId] = { people: '', addressId: '', slot: '' }
}

function updateCondition(dayId, field, value) {
  conditions[dayId][field] = value
}

function moveToNextStep() {
  showValidation.value = true
  if (!canProceed.value) return
  step.value += 1
  showValidation.value = false
}

function moveToPreviousStep() {
  if (step.value === 1) return
  step.value -= 1
  showValidation.value = false
}
</script>

<template>
  <PageShell area="customer">
    <main class="apply-page" aria-labelledby="apply-title">
      <header class="apply-page__header">
        <h1 id="apply-title">내 식사 일정 만들기</h1>
        <p>요일별 배송 조건을 확인하세요. 실제 배송일과 결제 금액은 서버 확인 뒤에만 표시됩니다.</p>
      </header>

      <ol class="progress" aria-label="구독 신청 단계">
        <li
          v-for="(label, index) in steps"
          :key="label"
          :class="{
            'progress__step--current': index + 1 === step,
            'progress__step--done': index + 1 < step,
          }"
        >
          <span>{{ index + 1 }}</span>
          <strong>{{ label }}</strong>
        </li>
      </ol>

      <form class="apply-form" @submit.prevent="moveToNextStep">
        <section v-if="step === 1" class="form-section" aria-labelledby="weekday-title">
          <div class="section-heading">
            <h2 id="weekday-title">배송받을 요일을 선택해 주세요</h2>
            <p>일요일과 배송 제외일은 선택할 수 없습니다. 실제 제외일은 서버가 확인합니다.</p>
          </div>
          <div class="weekday-options" role="group" aria-labelledby="weekday-title">
            <label v-for="day in weekdays" :key="day.id" class="weekday-option">
              <input
                :checked="selectedDays.includes(day.id)"
                type="checkbox"
                @change="toggleDay(day.id)"
              />
              <span>{{ day.label }}</span>
            </label>
          </div>
          <p class="selection-summary" aria-live="polite">
            {{
              selectedDays.length ? `${selectedDays.length}일 선택됨` : '아직 선택한 요일이 없어요.'
            }}
          </p>
        </section>

        <section v-else-if="step === 2" class="form-section" aria-labelledby="address-title">
          <div class="section-heading">
            <h2 id="address-title">요일별 배송지를 지정해 주세요</h2>
            <p>수령 방식은 배송지 정보와 함께 서버에서 확인합니다.</p>
          </div>
          <article v-for="day in selectedDayModels" :key="day.id" class="day-condition">
            <header>
              <h3>{{ day.label }}</h3>
              <span
                :class="[
                  'status',
                  addressIsComplete(day.id) ? 'status--success' : 'status--warning',
                ]"
                >{{ addressIsComplete(day.id) ? '선택 완료' : '선택 필요' }}</span
              >
            </header>
            <label class="field-grid__wide"
              >배송지
              <select
                :value="conditions[day.id].addressId"
                :aria-describedby="`address-help-${day.id}`"
                @change="updateCondition(day.id, 'addressId', $event.target.value)"
              >
                <option value="">등록된 배송지를 선택해 주세요</option>
              </select>
              <span :id="`address-help-${day.id}`"
                >배송지 목록은 서버 연동 후 표시됩니다.
                <RouterLink :to="{ name: 'app-addresses' }">배송지 관리로 이동</RouterLink></span
              >
            </label>
          </article>
        </section>

        <section v-else-if="step === 3" class="form-section" aria-labelledby="condition-title">
          <div class="section-heading">
            <h2 id="condition-title">요일별 배송 조건을 입력해 주세요</h2>
            <p>선택한 모든 요일에 인원과 시간대를 지정해야 합니다.</p>
          </div>
          <article v-for="day in selectedDayModels" :key="day.id" class="day-condition">
            <header>
              <h3>{{ day.label }}</h3>
              <span
                :class="[
                  'status',
                  conditionIsComplete(day.id) ? 'status--success' : 'status--warning',
                ]"
              >
                {{ conditionIsComplete(day.id) ? '입력 완료' : '입력 필요' }}
              </span>
            </header>
            <div class="field-grid">
              <label>
                인원
                <select
                  :value="conditions[day.id].people"
                  @change="updateCondition(day.id, 'people', $event.target.value)"
                >
                  <option value="">선택</option>
                  <option value="1">1명</option>
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명 이상</option>
                </select>
              </label>
              <label>
                시간대
                <select
                  :value="conditions[day.id].slot"
                  @change="updateCondition(day.id, 'slot', $event.target.value)"
                >
                  <option value="">선택</option>
                  <option value="lunch">점심</option>
                  <option value="dinner">저녁</option>
                </select>
              </label>
            </div>
          </article>
        </section>

        <section v-else-if="step === 4" class="form-section" aria-labelledby="preview-title">
          <div class="section-heading">
            <h2 id="preview-title">신청 내용을 확인해 주세요</h2>
            <p>서버 Preview 응답에서 배송 가능일, 수령 방식, 최종 금액과 필수 동의를 확인합니다.</p>
          </div>
          <div class="preview-waiting" role="status">
            <h3>서버 확인이 필요해요</h3>
            <p>
              현재 화면은 입력 흐름만 제공하며, 최종 금액과 적용 가능 여부를 임의 계산하지 않습니다.
            </p>
            <span class="status status--warning">확인 대기</span>
          </div>
        </section>

        <section v-else class="form-section" aria-labelledby="payment-title">
          <div class="section-heading">
            <h2 id="payment-title">결제수단을 선택해 주세요</h2>
            <p>카드번호와 CVC는 이 화면에 저장하거나 표시하지 않습니다.</p>
          </div>
          <div class="empty-payment" role="status">
            <h3>등록된 결제수단을 불러오는 중이에요</h3>
            <p>실제 목록은 결제수단 서비스와 연결된 뒤 표시됩니다.</p>
            <RouterLink class="button button--secondary" :to="{ name: 'app-payment-methods' }"
              >결제수단 관리로 이동</RouterLink
            >
          </div>
          <label class="sr-only" for="payment-method">결제수단</label>
          <select id="payment-method" v-model="selectedPaymentMethod" class="sr-only">
            <option value="">등록된 결제수단 없음</option>
          </select>
        </section>

        <p v-if="showValidation && validationMessage" class="validation-summary" role="alert">
          {{ validationMessage }}
        </p>
        <StateNotice
          tone="info"
          title="현재 구현 범위"
          message="입력과 검증 UI만 제공합니다. 결제 승인과 금액 계산은 서버 연동 전까지 시작하지 않습니다."
        />

        <footer class="form-actions">
          <button
            v-if="step > 1"
            type="button"
            class="button button--secondary"
            @click="moveToPreviousStep"
          >
            이전
          </button>
          <button
            v-if="step < 5"
            type="submit"
            class="button"
            :disabled="showValidation && !canProceed"
          >
            {{ stepTitle === '확인' ? '결제로 이동' : '다음 단계' }}
          </button>
          <button v-else type="button" class="button" disabled aria-describedby="preview-title">
            서버 확인 후 결제 진행
          </button>
        </footer>
      </form>
    </main>
  </PageShell>
</template>

<style scoped>
.apply-page {
  width: min(100%, 720px);
  margin: 0 auto;
  padding: 44px var(--page-padding-desktop) 112px;
}
.apply-page__header {
  margin-bottom: 30px;
}
.apply-page__eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.apply-page__header h1,
.section-heading h2 {
  margin: 0;
  letter-spacing: -0.04em;
}
.apply-page__header h1 {
  font-size: var(--font-page-title);
}
.apply-page__header p:not(.apply-page__eyebrow),
.section-heading p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.progress {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0 0 28px;
  list-style: none;
}
.progress li {
  display: grid;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-compact);
}
.progress span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  font-weight: 800;
}
.progress strong {
  overflow-wrap: anywhere;
}
.progress__step--current,
.progress__step--done {
  color: var(--color-text);
}
.progress__step--current span {
  border-color: var(--color-primary);
  background: var(--color-primary);
}
.progress__step--done span {
  border-color: var(--color-primary-soft);
  background: var(--color-primary-soft);
}
.apply-form {
  display: grid;
  gap: 18px;
}
.form-section {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-floating);
}
.section-heading {
  margin-bottom: 22px;
}
.section-heading h2 {
  font-size: var(--font-section-title);
}
.plan-options {
  display: grid;
  gap: 10px;
}
.plan-option {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-height: 88px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.plan-option:has(input:focus-visible) {
  outline: 3px solid rgba(150, 167, 94, 0.45);
  outline-offset: -3px;
}
.plan-option--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
.plan-option input,
.weekday-option input {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin: 1px 0 0;
  accent-color: var(--color-primary);
}
.plan-option__content {
  display: grid;
  gap: 5px;
}
.plan-option__content strong {
  font-size: var(--font-section-title);
}
.plan-option__content span,
.field-grid label > span {
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.weekday-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.weekday-option {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.selection-summary {
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}
.day-condition {
  padding: 18px 0;
  border-top: 1px solid var(--color-border);
}
.day-condition:first-of-type {
  border-top: 0;
  padding-top: 0;
}
.day-condition header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.day-condition h3,
.empty-payment h3,
.preview-waiting h3 {
  margin: 0;
  font-size: var(--font-section-title);
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.field-grid label {
  display: grid;
  gap: 7px;
  min-width: 0;
  font-size: var(--font-body);
  font-weight: 800;
}
.field-grid select {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.field-grid__wide {
  grid-column: 1 / -1;
}
.field-grid a {
  margin-left: 4px;
  color: var(--color-text);
  font-weight: 800;
}
.empty-payment,
.preview-waiting {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}
.empty-payment p,
.preview-waiting p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.validation-summary {
  margin: 0;
  padding: 12px 14px;
  border-left: 4px solid var(--color-danger);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-weight: 700;
}
.form-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 10px;
  padding: 14px 0 calc(14px + env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, transparent, var(--color-background) 28%);
}
.form-actions .button:last-child {
  flex: 1;
}
@media (max-width: 768px) {
  .apply-page {
    padding: 28px var(--page-padding-mobile) 96px;
  }
  .progress {
    gap: 2px;
  }
  .progress strong {
    font-size: var(--font-caption);
  }
  .form-section {
    padding: 20px;
  }
}
@media (max-width: 420px) {
  .weekday-options,
  .field-grid {
    grid-template-columns: 1fr;
  }
  .field-grid__wide {
    grid-column: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .plan-option,
  .weekday-option {
    scroll-behavior: auto;
  }
}
</style>
