<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'navigate'])
const appStore = useAppStore()
const selectedPlan = ref('nutrition')
const sheet = ref(null)
let returnFocus = null
let previousOverflow = ''
watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      sheet.value?.querySelector('button')?.focus()
    } else {
      document.body.style.overflow = previousOverflow
      returnFocus?.focus()
    }
  },
)
onBeforeUnmount(() => {
  if (props.isOpen) document.body.style.overflow = previousOverflow
})
function handleSheetKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSheet()
    return
  }
  if (event.key !== 'Tab') return
  const controls = [
    ...sheet.value.querySelectorAll('button:not(:disabled), [href], input, select, textarea'),
  ]
  const first = controls[0],
    last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

const plans = [
  {
    id: 'healthy',
    name: '건강식',
    description: '가볍고 부담 없이 즐기는 식사',
    minimum: '회차별 메뉴 3개 이상',
  },
  {
    id: 'nutrition',
    name: '영양식',
    description: '균형 잡힌 한 끼를 위한 기본 추천 플랜',
    minimum: '회차별 메뉴 3개 이상',
    recommended: true,
  },
  {
    id: 'hearty',
    name: '든든식',
    description: '든든한 한 끼가 필요한 날을 위한 식사',
    minimum: '회차별 메뉴 6개 이상',
  },
]

function closeSheet() {
  appStore.closePlanSheet()
  emit('close')
}

function startSubscription() {
  appStore.startPlanSelection(selectedPlan.value)
  emit('navigate', 'wf-013')
}
</script>

<template>
  <div v-if="isOpen" class="bottom-sheet-layer" role="presentation" @click.self="closeSheet">
    <section
      ref="sheet"
      class="plan-selection-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-selection-sheet-title"
      @keydown="handleSheetKey"
    >
      <div class="sheet-handle"></div>
      <button class="sheet-close" type="button" aria-label="닫기" @click="closeSheet">
        <X :size="21" aria-hidden="true" />
      </button>

      <h2 id="plan-selection-sheet-title">나에게 맞는 플랜을<br />선택해주세요.</h2>
      <p>선택한 플랜으로 구독 신청을 이어갑니다. 실제 가격은 결제 전에 안내됩니다.</p>

      <div class="plan-selection-options" role="radiogroup" aria-label="구독 플랜 선택">
        <button
          v-for="plan in plans"
          :key="plan.id"
          class="plan-selection-option"
          :class="{
            'is-selected': selectedPlan === plan.id,
            'is-recommended': plan.recommended,
          }"
          type="button"
          role="radio"
          :aria-checked="selectedPlan === plan.id"
          @click="selectedPlan = plan.id"
        >
          <span class="plan-selection-option__top">
            <small>{{ plan.recommended ? '추천 플랜' : '선택 가능' }}</small>
            <Check v-if="selectedPlan === plan.id" :size="18" aria-hidden="true" />
          </span>
          <strong>{{ plan.name }}</strong>
          <span>{{ plan.description }}</span>
          <span>{{ plan.minimum }}</span>
          <b>가격 미정</b>
        </button>
      </div>

      <div class="sheet-actions">
        <button class="button button-secondary" type="button" @click="closeSheet">
          나중에 결정
        </button>
        <button class="button button-primary" type="button" @click="startSubscription">
          {{ plans.find((plan) => plan.id === selectedPlan)?.name }} 선택하기
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.bottom-sheet-layer {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  align-items: end;
  background: rgba(37, 40, 31, 0.36);
}

.plan-selection-sheet {
  max-height: calc(100dvh - 20px);
  overflow-y: auto;
  position: relative;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 14px 24px 32px;
  border-radius: 26px 26px 0 0;
  background: var(--color-surface);
}

.sheet-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto 25px;
  border-radius: 99px;
  background: var(--color-disabled);
}

.sheet-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-subtle);
}

.plan-selection-sheet h2 {
  margin-top: 9px;
  font-size: var(--font-page-title);
  line-height: var(--line-height-title);
}

.plan-selection-sheet > p:last-of-type {
  margin-top: 12px;
  font-size: var(--font-body);
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 9px;
  margin-top: 25px;
}

.sheet-actions .button {
  width: 100%;
}

.plan-selection-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 24px;
}

.plan-selection-option {
  display: grid;
  gap: 5px;
  min-height: 176px;
  padding: 17px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}

.plan-selection-option__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-primary-pressed);
}

.plan-selection-option.is-recommended .plan-selection-option__top {
  color: #a35d13;
}

.plan-selection-option small,
.plan-selection-option > span:not(.plan-selection-option__top) {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.plan-selection-option strong {
  margin-top: 8px;
  font-size: var(--font-section-title);
}

.plan-selection-option b {
  align-self: end;
  margin-top: 7px;
  font-size: var(--font-caption);
}

@media (min-width: 761px) {
  .plan-selection-sheet {
    max-width: 760px;
  }
}

@media (max-width: 560px) {
  .plan-selection-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .plan-selection-option {
    min-height: 150px;
  }
}

@media (max-width: 430px) {
  .sheet-actions {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 761px) {
  .bottom-sheet-layer {
    align-items: center;
  }
}

@media (min-width: 761px) {
  .plan-selection-sheet {
    border-radius: 24px;
  }
}

@media (min-width: 761px) {
  .sheet-handle {
    display: none;
  }
}

@media (min-width: 761px) {
  .plan-selection-sheet {
    padding-top: 30px;
  }
}
</style>

<style scoped>
.plan-selection-option.is-selected {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-soft);
}

.plan-selection-option.is-recommended.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
</style>
