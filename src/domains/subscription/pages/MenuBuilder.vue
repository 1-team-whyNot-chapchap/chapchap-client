<script setup>
import { computed, ref } from 'vue'
import { AlertTriangle, ChevronLeft, Minus, Plus } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'

const appStore = useAppStore()
const emit = defineEmits(['navigate'])

const props = defineProps({
  mode: {
    type: String,
    default: 'application',
  },
})

const menus = [
  { id: 1, name: '바질 닭가슴살 도시락', type: 'BALANCED' },
  { id: 2, name: '단호박 소불고기 도시락', type: 'BALANCED' },
  { id: 3, name: '두부 채소 비빔밥', type: 'VEGETARIAN' },
  { id: 4, name: '연어 포케', type: '준비 중', disabled: true },
]

// 회차 변경 화면에서는 저장 전 값을 보호하기 위해 현재 수량을 새 객체로 복사해 사용합니다.
const draftMenuQuantities = ref({
  ...(props.mode === 'delivery'
    ? appStore.currentSubscription.menuQuantities
    : appStore.subscriptionApplication.menuQuantities),
})

const activeMenuQuantities = computed(() =>
  props.mode === 'delivery'
    ? draftMenuQuantities.value
    : appStore.subscriptionApplication.menuQuantities,
)

const selectedMenuCount = computed(() =>
  props.mode === 'delivery'
    ? Object.values(activeMenuQuantities.value).reduce((total, quantity) => total + quantity, 0)
    : appStore.selectedMenuCount,
)
const weeks = [
  { id: 'week1', label: '1주차', description: '첫 번째 배송 주차' },
  { id: 'week2', label: '2주차', description: '두 번째 배송 주차' },
]
const weeklyMenuCounts = computed(() => appStore.weeklySelectedMenuCounts)
const hasRequiredWeeklyMenuSelections = computed(() => appStore.hasRequiredWeeklyMenuSelections)
const displayedPlanName = computed(() => {
  const planId =
    props.mode === 'delivery' ? appStore.currentSubscription.planId : appStore.selectedPlan
  return planLabels[planId]
})
const requiredMenuCount = computed(() =>
  props.mode === 'delivery' ? appStore.currentMinimumMenuCount : appStore.minimumMenuCount,
)
const hasEnoughMenus = computed(() =>
  props.mode === 'delivery'
    ? selectedMenuCount.value >= requiredMenuCount.value
    : hasRequiredWeeklyMenuSelections.value,
)

function getWeekMenuCount(weekId) {
  return weeklyMenuCounts.value[weekId]
}

function hasEnoughMenusForWeek(weekId) {
  return getWeekMenuCount(weekId) >= 3
}

function changeQuantity(menuId, change, weekId) {
  if (props.mode === 'delivery') {
    const currentQuantity = draftMenuQuantities.value[menuId]
    draftMenuQuantities.value[menuId] = Math.max(0, currentQuantity + change)
    return
  }

  appStore.changeMenuQuantity(menuId, change, weekId)
}

function moveToConfirmation() {
  if (!hasEnoughMenus.value) {
    return
  }

  if (props.mode === 'delivery') {
    appStore.replaceMenuQuantities(draftMenuQuantities.value)
    emit('navigate', 'subscription')
    return
  }

  emit('navigate', 'wf-016')
}
</script>

<template>
  <div class="page page-menu-builder">
    <button
      v-if="mode === 'delivery'"
      class="back-button"
      type="button"
      @click="emit('navigate', 'subscription')"
    >
      <ChevronLeft :size="18" aria-hidden="true" />
      내 구독으로
    </button>

    <ol v-if="mode !== 'delivery'" class="subscription-stepper" aria-label="구독 신청 단계">
      <li class="is-done"><span>1</span>배송</li>
      <li class="is-done"><span>2</span>배송지</li>
      <li class="is-done"><span>3</span>인원·시간</li>
      <li class="is-current"><span>메뉴</span>구성</li>
      <li><span>4</span>확인</li>
      <li><span>5</span>결제</li>
    </ol>

    <section class="page-intro">
      <p class="section-kicker">
        {{ mode === 'delivery' ? '회차 메뉴 변경' : '구독 신청 · 메뉴 구성' }}
      </p>
      <h1>
        {{ mode === 'delivery' ? '이번 회차 메뉴를' : '2주 동안 받을 메뉴를' }}<br />
        {{ mode === 'delivery' ? '변경해주세요.' : '골라주세요.' }}
      </h1>
      <p>
        <strong>{{ displayedPlanName }} 플랜</strong>에 포함된 메뉴를 골라주세요. 메뉴 선택으로 플랜
        가격은 변하지 않습니다.
        <template v-if="mode !== 'delivery'"
          >각 주차마다 최소 3개, 총 6개 이상 선택해주세요.</template
        >
      </p>
    </section>

    <div class="selection-progress" aria-label="메뉴 선택 수량">
      <div v-if="mode === 'delivery'">
        <span>이번 회차 메뉴</span>
        <strong>{{ selectedMenuCount }} / {{ requiredMenuCount }}개 이상</strong>
      </div>
      <div v-else class="selection-progress__weeks" aria-live="polite">
        <div v-for="week in weeks" :key="week.id">
          <span>{{ week.label }}</span>
          <strong :class="{ 'is-complete': hasEnoughMenusForWeek(week.id) }">
            {{ getWeekMenuCount(week.id) }} / 3개 이상
          </strong>
        </div>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span
          :style="{
            width: `${Math.min(
              (selectedMenuCount / (mode === 'delivery' ? requiredMenuCount : 6)) * 100,
              100,
            )}%`,
          }"
        ></span>
      </div>
      <p v-if="hasEnoughMenus">최소 수량을 충족했어요. 더 담아도 메뉴별 추가금은 없어요.</p>
      <p v-else-if="mode === 'delivery'">
        최소 {{ requiredMenuCount - selectedMenuCount }}개를 더 선택해주세요.
      </p>
      <p v-else>각 주차의 메뉴를 3개 이상 선택해야 다음 단계로 진행할 수 있어요.</p>
    </div>

    <aside class="notice-box notice-box--warning">
      <AlertTriangle :size="20" aria-hidden="true" />
      <div>
        <strong>수량 제한 안내</strong>
        <p>준비 중인 메뉴는 선택할 수 없어요. 재고와 수량 제한은 최종 신청 전 다시 확인됩니다.</p>
      </div>
    </aside>

    <section v-if="mode === 'delivery'" class="menu-grid" aria-label="메뉴 선택">
      <article
        v-for="menu in menus"
        :key="menu.id"
        class="menu-card"
        :class="{ 'is-disabled': menu.disabled }"
      >
        <div class="menu-card__image">[사진이 필요한 곳입니다.]</div>
        <div class="menu-card__body">
          <span class="menu-type">{{ menu.type }}</span>
          <h2>{{ menu.name }}</h2>
          <p>{{ menu.disabled ? '현재 준비 중인 메뉴예요.' : '플랜 포함 메뉴' }}</p>
          <div class="quantity-control" :aria-label="`${menu.name} 수량`">
            <button
              type="button"
              :disabled="activeMenuQuantities[menu.id] === 0 || menu.disabled"
              aria-label="수량 줄이기"
              @click="changeQuantity(menu.id, -1)"
            >
              <Minus :size="16" aria-hidden="true" />
            </button>
            <strong>{{ activeMenuQuantities[menu.id] }}</strong>
            <button
              type="button"
              :disabled="menu.disabled"
              aria-label="수량 늘리기"
              @click="changeQuantity(menu.id, 1)"
            >
              <Plus :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="menu-week-list" aria-label="주차별 메뉴 선택">
      <section
        v-for="week in weeks"
        :key="week.id"
        class="menu-week-section"
        :aria-labelledby="`${week.id}-title`"
      >
        <header class="menu-week-section__header">
          <div>
            <p class="section-kicker">{{ week.description }}</p>
            <h2 :id="`${week.id}-title`">{{ week.label }} 메뉴</h2>
          </div>
          <strong :class="{ 'is-complete': hasEnoughMenusForWeek(week.id) }">
            {{ getWeekMenuCount(week.id) }} / 3개 이상
          </strong>
        </header>

        <div class="menu-grid">
          <article
            v-for="menu in menus"
            :key="`${week.id}-${menu.id}`"
            class="menu-card"
            :class="{ 'is-disabled': menu.disabled }"
          >
            <div class="menu-card__image">[사진이 필요한 곳입니다.]</div>
            <div class="menu-card__body">
              <span class="menu-type">{{ menu.type }}</span>
              <h2>{{ menu.name }}</h2>
              <p>{{ menu.disabled ? '현재 준비 중인 메뉴예요.' : '플랜 포함 메뉴' }}</p>
              <div class="quantity-control" :aria-label="`${week.label} ${menu.name} 수량`">
                <button
                  type="button"
                  :disabled="
                    appStore.subscriptionApplication.weeklyMenuQuantities[week.id][menu.id] === 0 ||
                    menu.disabled
                  "
                  aria-label="수량 줄이기"
                  @click="changeQuantity(menu.id, -1, week.id)"
                >
                  <Minus :size="16" aria-hidden="true" />
                </button>
                <strong>{{
                  appStore.subscriptionApplication.weeklyMenuQuantities[week.id][menu.id]
                }}</strong>
                <button
                  type="button"
                  :disabled="menu.disabled"
                  aria-label="수량 늘리기"
                  @click="changeQuantity(menu.id, 1, week.id)"
                >
                  <Plus :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>

    <div class="mobile-action-bar">
      <div>
        <span>{{ mode === 'delivery' ? '이번 회차' : '2주 전체' }}</span>
        <strong>{{ selectedMenuCount }}개 선택</strong>
      </div>
      <button
        class="button button-primary"
        type="button"
        :disabled="!hasEnoughMenus"
        @click="moveToConfirmation"
      >
        {{ mode === 'delivery' ? '변경 저장하기' : '다음 단계' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-menu-builder .page-intro {
  max-width: 600px;
}

/* subscription-stepper: SubscriptionFlowPage.vue의 scoped 스타일과 동일하게 유지합니다. */
.subscription-stepper {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
  margin: 0 0 42px;
  list-style: none;
}

.subscription-stepper li {
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 700;
}

.subscription-stepper span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
}

.selection-progress {
  margin-top: 38px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
}

.selection-progress > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.selection-progress__weeks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.selection-progress__weeks > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}

.selection-progress .is-complete,
.menu-week-section__header .is-complete {
  color: var(--color-primary-pressed);
}

.selection-progress span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.selection-progress strong {
  font-size: var(--font-item-title);
}

.progress-track {
  height: 8px;
  margin-top: 13px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--color-disabled);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.selection-progress p {
  margin-top: 9px;
  font-size: var(--font-caption);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 25px;
}

.menu-week-list {
  display: grid;
  gap: 44px;
  margin-top: 32px;
}

.menu-week-section {
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
}

.menu-week-section__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.menu-week-section__header .section-kicker {
  margin-bottom: 6px;
}

.menu-week-section__header h2 {
  font-size: var(--font-section-title);
}

.menu-week-section__header > strong {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}

.menu-week-section .menu-grid {
  margin-top: 20px;
}

.menu-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}

.menu-card.is-disabled {
  opacity: 0.58;
}

.menu-card__image {
  height: 142px;
  display: grid;
  place-items: center;
  padding: 20px;
  border-bottom: 1px dashed var(--color-border);
  background: var(--color-surface-subtle);
  color: rgba(51, 53, 47, 0.66);
  font-size: var(--font-caption);
  font-weight: 700;
  text-align: center;
}

.menu-card__body {
  padding: 17px;
}

.menu-type {
  color: var(--color-info);
  font-size: var(--font-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.menu-card h2 {
  min-height: 47px;
  margin-top: 7px;
  font-size: var(--font-body);
  line-height: var(--line-height-compact);
}

.menu-card p {
  margin-top: 5px;
  font-size: var(--font-caption);
}

.quantity-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 5px;
  border-radius: 10px;
  background: var(--color-surface-subtle);
}

.quantity-control button {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-text);
}

.quantity-control button:disabled {
  cursor: not-allowed;
  color: var(--color-text-muted);
  background: transparent;
}

.quantity-control strong {
  font-size: var(--font-body);
}

.subscription-stepper .is-current,
.subscription-stepper .is-done {
  color: var(--color-primary-pressed);
}

.subscription-stepper .is-current span,
.subscription-stepper .is-done span {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

@media (max-width: 760px) {
  .menu-card {
    display: grid;
    grid-template-columns: 109px 1fr;
  }
}

@media (max-width: 760px) {
  .menu-card__image {
    height: auto;
    min-height: 150px;
  }
}

@media (max-width: 760px) {
  .menu-card h2 {
    min-height: 0;
  }
}

@media (max-width: 760px) {
  .selection-progress__weeks {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .menu-week-list {
    gap: 32px;
  }
}

@media (max-width: 760px) {
  .menu-week-section {
    padding-top: 26px;
  }
}

@media (max-width: 760px) {
  .menu-week-section__header h2 {
    font-size: var(--font-section-title);
  }
}

@media (min-width: 761px) {
  .page-menu-builder .mobile-action-bar {
    max-width: 760px;
  }
}
</style>
