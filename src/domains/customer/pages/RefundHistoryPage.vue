<script setup>
import { useAppStore } from '../../../stores/useAppStore'
import EmptyState from '../../../common/components/feedback/EmptyState.vue'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()
</script>

<template>
  <div class="page management-page profile-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />

    <section class="page-intro">
      <h1>환불 내역을 확인해요.</h1>
      <p>환불 정책이 확정되기 전까지 상담 채팅을 통해 요청을 접수합니다.</p>
    </section>

    <section v-if="appStore.refundHistory.length" class="history-list">
      <div
        v-for="refund in appStore.refundHistory"
        :key="refund.id"
        class="history-list-item history-list-item--static"
      >
        <span class="history-list-item__main">
          <span>
            <strong>{{ refund.title }}</strong>
            <small>{{ refund.date }}</small>
          </span>
          <StatusBadge :status="refund.status" />
        </span>
      </div>
    </section>

    <EmptyState
      v-else
      title="아직 환불 내역이 없어요."
      description="환불이 필요하다면 상담 채팅에서 주문 정보를 확인한 뒤 안내받을 수 있어요."
      action-label="환불 상담 시작"
      @action="emit('navigate', 'wf-036')"
    />
  </div>
</template>

<style scoped>
/* 고객 마이페이지·결제·주소 화면에서만 재사용하는 화면 구조입니다. */
.profile-page {
  min-height: 620px;
}
.page-intro--with-action {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.page-intro--with-action .button {
  flex: 0 0 auto;
}
.profile-form,
.detail-card,
.empty-state {
  margin-top: 36px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}
.profile-form {
  display: grid;
  gap: 20px;
}
.profile-form > .button {
  justify-self: end;
  min-width: 160px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.form-field {
  display: grid;
  gap: 9px;
}
.form-field > span {
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 800;
}
.form-field input,
.form-field textarea {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  line-height: var(--line-height-body);
}
.form-field textarea {
  resize: vertical;
}
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--color-primary-pressed);
  outline: 3px solid var(--color-primary-soft);
}
.form-field input:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.check-field {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
}
.check-field input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary-pressed);
}
.form-help {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.form-success {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: var(--font-caption);
  font-weight: 800;
}
.profile-data-list,
.history-list {
  display: grid;
  gap: 12px;
  margin-top: 36px;
}
.profile-data-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.profile-data-card__icon,
.history-list-item__icon,
.empty-state__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.profile-data-card__content {
  display: grid;
  gap: 5px;
}
.profile-data-card__heading {
  display: flex;
  align-items: center;
  gap: 8px;
}
.profile-data-card__content p {
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.profile-data-card__actions {
  display: flex;
  gap: 14px;
}
.mini-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.mini-badge {
  padding: 4px 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.status-badge {
  padding: 5px 9px;
}
.status-badge--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.status-badge--warning {
  background: #fff3dc;
  color: #9b6118;
}
.status-badge--info {
  background: #edf1f3;
  color: var(--color-text-muted);
}
.history-list-item {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
button.history-list-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}
.history-list-item__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.history-list-item__main > span {
  display: grid;
  gap: 6px;
}
.history-list-item__main small {
  color: var(--color-text-muted);
}
.history-list-item__aside {
  justify-items: end;
}
.detail-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}
.detail-card__heading strong {
  font-size: var(--font-section-title);
}
.detail-list {
  margin: 0;
}
.detail-list > div {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-list > div:last-child {
  border-bottom: 0;
}
.detail-list dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.detail-list dd {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
  text-align: right;
}
.detail-list .detail-list__total {
  padding-top: 20px;
}
.detail-list__total dt,
.detail-list__total dd {
  color: var(--color-text);
  font-size: var(--font-item-title);
  font-weight: 900;
}
.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding-block: 54px;
  text-align: center;
}
.empty-state p {
  max-width: 430px;
}
.empty-state .button {
  margin-top: 8px;
}
@media (max-width: 760px) {
  .page-intro--with-action {
    align-items: stretch;
    flex-direction: column;
  }
  .page-intro--with-action .button,
  .profile-form > .button {
    width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .profile-form,
  .detail-card,
  .empty-state {
    padding: 20px;
  }
  .profile-data-card {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .profile-data-card__actions,
  .payment-method-card > .text-button {
    grid-column: 2;
    justify-self: start;
  }
  .history-list-item {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .history-list-item > svg {
    display: none;
  }
  .history-list-item__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
  .history-list-item__aside {
    justify-items: start;
  }
  .detail-list > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }
  .detail-list dd {
    text-align: left;
  }
}
</style>
