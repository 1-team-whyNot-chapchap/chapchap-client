<script setup>
import { reactive, ref } from 'vue'
import { CircleAlert } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import {
  addressErrorMessage,
  createAddressForm,
  toAddressRequest,
} from '../../subscription/addressForm.js'
import { useAddressStore } from '../../subscription/stores/useAddressStore.js'

const emit = defineEmits(['navigate'])
const addressStore = useAddressStore()
const form = reactive(createAddressForm())
const errorMessage = ref('')

async function saveAddress() {
  errorMessage.value = ''
  const saved = await addressStore.createAddress(toAddressRequest(form))
  if (!saved) {
    errorMessage.value = addressErrorMessage(addressStore.mutationError)
    return
  }
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

    <StateNotice
      v-if="errorMessage"
      tone="danger"
      title="배송지를 등록하지 못했어요."
      :message="errorMessage"
    />

    <form class="profile-form" @submit.prevent="saveAddress">
      <fieldset class="address-fields" :disabled="addressStore.isMutating">
        <div class="form-grid">
          <label class="form-field">
            <span>배송지 이름</span>
            <input
              v-model.trim="form.name"
              type="text"
              placeholder="예: 우리 집"
              required
              maxlength="50"
            />
          </label>
          <label class="form-field">
            <span>받는 분</span>
            <input
              v-model.trim="form.recipientName"
              type="text"
              autocomplete="name"
              required
              maxlength="50"
            />
          </label>
        </div>

        <label class="form-field">
          <span>휴대폰 번호</span>
          <input
            v-model.trim="form.recipientPhone"
            type="tel"
            autocomplete="tel"
            required
            maxlength="20"
          />
        </label>
        <label class="form-field">
          <span>우편번호</span>
          <input
            v-model.trim="form.postalCode"
            autocomplete="postal-code"
            inputmode="numeric"
            required
            maxlength="10"
          />
        </label>
        <label class="form-field">
          <span>도로명 주소</span>
          <textarea
            v-model.trim="form.addressLine1"
            rows="3"
            autocomplete="street-address"
            required
            maxlength="255"
          />
        </label>
        <label class="form-field">
          <span>상세 주소 (선택)</span>
          <input v-model.trim="form.addressLine2" autocomplete="address-line2" maxlength="255" />
        </label>
        <label class="form-field">
          <span>수령 방식</span>
          <select v-model="form.deliveryMethod">
            <option value="DOORSTEP">문 앞 비대면 배송</option>
            <option value="DIRECT">직접 전달</option>
            <option value="OTHER">기타 요청</option>
          </select>
        </label>
        <label v-if="form.deliveryMethod === 'OTHER'" class="form-field">
          <span>기타 배송 요청</span>
          <textarea v-model.trim="form.otherDeliveryRequest" rows="2" required maxlength="255" />
        </label>
        <label class="form-field">
          <span>공동현관 비밀번호 (선택)</span>
          <input
            v-model.trim="form.entrancePassword"
            type="password"
            autocomplete="new-password"
            maxlength="100"
          />
        </label>

        <p class="form-help">
          배송 가능 지역은 저장할 때 서버에서 확인합니다. 첫 배송지는 서버에서 기본 배송지로
          지정됩니다.
        </p>
        <button class="button button-primary" type="submit" :disabled="addressStore.isMutating">
          {{ addressStore.isMutating ? '저장 중...' : '배송지 저장' }}
        </button>
      </fieldset>
    </form>

    <p class="security-note">
      <CircleAlert :size="16" aria-hidden="true" />공동현관 비밀번호는 목록에 표시되지 않습니다.
    </p>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 620px;
}

.profile-form {
  display: grid;
  gap: 20px;
  margin-top: 36px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
}

.address-fields {
  display: grid;
  gap: 20px;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.address-fields > .button {
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
.form-field textarea,
.form-field select {
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
.form-field textarea:focus,
.form-field select:focus {
  border-color: var(--color-primary-pressed);
  outline: 3px solid var(--color-primary-soft);
}

.form-help,
.security-note {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.security-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-form {
    padding: 20px;
  }

  .address-fields {
    display: grid;
    gap: 20px;
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
  }
  .address-fields > .button {
    width: 100%;
  }
}
</style>
