<script setup>
import { ref } from 'vue'
import { CheckCircle2, CircleAlert, MapPinned } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const emit = defineEmits(['navigate'])
const appStore = useAppStore()

const form = ref({
  name: '',
  recipient: '',
  phone: '',
  address: '',
  isDefault: false,
})
const availability = ref('idle')

function checkAvailability() {
  if (form.value.address.trim().length < 8) {
    availability.value = 'unavailable'
    return
  }

  availability.value = form.value.address.includes('제외') ? 'unavailable' : 'available'
}

function saveAddress() {
  checkAvailability()
  if (availability.value !== 'available') return
  appStore.addAddress(form.value)
  emit('navigate', 'wf-028')
}
</script>

<template>
  <div class="page management-page profile-page">
    <PageBackButton label="배송지 목록으로" @back="emit('navigate', 'wf-028')" />

    <section class="page-intro">
      <h1>새 배송지를 등록해요.</h1>
      <p>배달 기사님이 쉽게 찾을 수 있도록 정확한 주소를 입력해 주세요.</p>
    </section>

    <form class="profile-form" @submit.prevent="saveAddress">
      <div class="form-grid">
        <label class="form-field">
          <span>배송지 이름</span>
          <input v-model.trim="form.name" type="text" placeholder="예: 우리 집" required />
        </label>
        <label class="form-field">
          <span>받는 분</span>
          <input v-model.trim="form.recipient" type="text" autocomplete="name" required />
        </label>
      </div>

      <label class="form-field">
        <span>휴대폰 번호</span>
        <input
          v-model.trim="form.phone"
          type="tel"
          autocomplete="tel"
          placeholder="010-0000-0000"
          required
        />
      </label>

      <div class="availability-check" aria-live="polite">
        <button class="button button-secondary" type="button" @click="checkAvailability">
          <MapPinned :size="17" aria-hidden="true" />배송 가능 여부 확인
        </button>
        <p v-if="availability === 'idle'">주소를 입력한 뒤 배송 가능 여부를 확인해 주세요.</p>
        <p
          v-else-if="availability === 'available'"
          class="availability-result is-available"
          role="status"
        >
          <CheckCircle2 :size="17" aria-hidden="true" />이 주소는 현재 배송 가능 지역입니다.
          배송일과 시간대는 다음 단계에서 선택합니다.
        </p>
        <p v-else class="availability-result is-unavailable" role="alert">
          <CircleAlert :size="17" aria-hidden="true" />이 주소는 현재 배송 가능 여부를 확인할 수
          없거나 서비스 제외 지역입니다. 주소를 다시 확인해 주세요.
        </p>
      </div>

      <label class="form-field">
        <span>주소</span>
        <textarea
          v-model.trim="form.address"
          rows="3"
          placeholder="도로명 주소와 상세 주소를 입력해 주세요."
          required
        />
      </label>

      <label class="check-field">
        <input v-model="form.isDefault" type="checkbox" />
        <span>기본 배송지로 설정</span>
      </label>

      <p class="form-help">
        데모에서는 입력 주소를 기준으로 표시합니다. 실제 서비스에서는 주소·권역·휴무일·수용량을
        서버에서 함께 검증해야 합니다.
      </p>
      <button class="button button-primary" type="submit">배송지 저장</button>
    </form>
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
.availability-check {
  display: grid;
  gap: 9px;
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-background);
}
.availability-check .button {
  justify-self: start;
}
.availability-check p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.availability-result {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-weight: 700;
}
.availability-result.is-available {
  color: var(--color-success);
}
.availability-result.is-unavailable {
  color: var(--color-danger);
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
  .availability-check .button {
    width: 100%;
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

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
