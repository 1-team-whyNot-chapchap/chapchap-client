<script setup>
import { CalendarDays, ChevronRight, Plus } from 'lucide-vue-next'
import { planLabels } from '../../../common/constants/prototypeData'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
</script>

<template>
  <div class="page management-page profile-page">
    <PageBackButton label="내 구독으로" @back="emit('navigate', 'subscription')" />

    <section class="page-intro page-intro--with-action">
      <div>
        <h1>내 구독 목록</h1>
        <p>현재 이용 중인 구독과 예약된 변경 상태를 확인합니다.</p>
      </div>
      <button class="button button-primary" type="button" @click="emit('navigate', 'plans')">
        <Plus :size="18" aria-hidden="true" />
        새 플랜 보기
      </button>
    </section>

    <section class="subscription-list-card">
      <span class="subscription-list-card__icon">
        <CalendarDays :size="23" aria-hidden="true" />
      </span>
      <span>
        <small>현재 구독</small>
        <strong>
          {{ planLabels[appStore.currentSubscription.planId] }}
        </strong>
        <p>다음 배송 2026-08-03 · 다음 결제 가격 미정</p>
      </span>
      <StatusBadge :status="appStore.isCancellationScheduled ? '해지 예정' : '이용 중'" />
      <button type="button" aria-label="구독 상세 보기" @click="emit('navigate', 'subscription')">
        <ChevronRight :size="20" aria-hidden="true" />
      </button>
    </section>
  </div>
</template>

<style scoped>
.subscription-quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.subscription-quick-links button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 17px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}
.subscription-quick-links span {
  display: grid;
  gap: 3px;
}
.subscription-quick-links small {
  color: var(--color-text-muted);
}
.subscription-list-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
  margin-top: 36px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.subscription-list-card__icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.subscription-list-card > span:nth-child(2) {
  display: grid;
  gap: 5px;
}
.subscription-list-card small,
.subscription-list-card p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.view-switcher {
  display: flex;
  padding: 4px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}
.view-switcher button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.view-switcher button.is-active {
  background: var(--color-surface);
  color: var(--color-primary-pressed);
  box-shadow: var(--shadow-soft);
}
.round-detail-actions,
.postpone-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
@media (max-width: 640px) {
  .subscription-quick-links {
    grid-template-columns: 1fr;
  }
  .subscription-list-card {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .subscription-list-card > button {
    grid-column: 2;
    justify-self: start;
  }
}
</style>

<style scoped>
.subscription-list-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
  margin-top: 36px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.subscription-list-card__icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

.subscription-list-card > span:nth-child(2) {
  display: grid;
  gap: 5px;
}

.subscription-list-card small,
.subscription-list-card p {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.subscription-list-card > button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: var(--color-surface-subtle);
}

@media (max-width: 760px) {
  .subscription-list-card {
    grid-template-columns: auto minmax(0, 1fr);
  }
}
</style>
