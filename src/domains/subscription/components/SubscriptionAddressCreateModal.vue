<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { dialogPt } from '../../../common/constants/primeUiPt.js'
import { loadKakaoPostcode, toRoadAddressSelection } from '../../customer/kakaoPostcode.js'
import { addressErrorMessage, createAddressForm, toAddressRequest } from '../addressForm.js'
import { useAddressStore } from '../stores/useAddressStore.js'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible', 'saved'])
const addressStore = useAddressStore()
const form = reactive(createAddressForm())
const errorMessage = ref('')
const addressSearchError = ref('')
const isLoadingAddressSearch = ref(false)
const nameInput = ref(null)
const detailAddressInput = ref(null)

function resetForm() {
  Object.assign(form, createAddressForm())
  errorMessage.value = ''
  addressSearchError.value = ''
}

function close() {
  if (addressStore.isMutating) return
  emit('update:visible', false)
}

function updateVisible(value) {
  if (!value) close()
}

async function focusName() {
  await nextTick()
  nameInput.value?.focus()
}

watch(
  () => props.visible,
  (visible, wasVisible) => {
    if (visible) {
      errorMessage.value = ''
      addressSearchError.value = ''
      focusName()
    } else if (wasVisible) {
      resetForm()
    }
  },
)

async function searchAddress() {
  addressSearchError.value = ''
  isLoadingAddressSearch.value = true

  try {
    const Postcode = await loadKakaoPostcode()
    new Postcode({
      oncomplete: async (data) => {
        if (!props.visible) return
        try {
          const selection = toRoadAddressSelection(data)
          form.postalCode = selection.postalCode
          form.addressLine1 = selection.addressLine1
          await nextTick()
          detailAddressInput.value?.focus()
        } catch (error) {
          addressSearchError.value = error.message
        }
      },
    }).open()
  } catch (error) {
    addressSearchError.value = error.message
  } finally {
    isLoadingAddressSearch.value = false
  }
}

async function saveAddress() {
  errorMessage.value = ''
  const saved = await addressStore.createAddress(toAddressRequest(form))
  if (!saved) {
    errorMessage.value = addressErrorMessage(addressStore.mutationError)
    return
  }
  emit('saved')
  close()
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :closable="!addressStore.isMutating"
    :close-on-escape="!addressStore.isMutating"
    header="배송지 추가"
    :pt="dialogPt"
    @update:visible="updateVisible"
  >
    <form class="address-create-form" @submit.prevent="saveAddress">
      <p class="address-create-form__intro">
        새 배송지를 등록한 뒤 바로 배송 요일에 선택할 수 있어요.
      </p>
      <p v-if="errorMessage" role="alert" class="address-create-form__error">{{ errorMessage }}</p>
      <fieldset :disabled="addressStore.isMutating" class="address-create-form__fields">
        <div class="address-create-form__grid">
          <label
            >배송지 이름<input ref="nameInput" v-model.trim="form.name" required maxlength="50"
          /></label>
          <label>받는 분<input v-model.trim="form.recipientName" required maxlength="50" /></label>
        </div>
        <label
          >연락처<input v-model.trim="form.recipientPhone" type="tel" required maxlength="20"
        /></label>
        <p v-if="addressSearchError" role="alert" class="address-create-form__error">
          {{ addressSearchError }}
        </p>
        <label
          >우편번호<input
            v-model.trim="form.postalCode"
            inputmode="numeric"
            readonly
            required
            maxlength="10"
        /></label>
        <label
          >도로명 주소<span class="address-create-form__address-search">
            <textarea
              v-model.trim="form.addressLine1"
              readonly
              required
              maxlength="255"
              rows="3"
            /><button
              type="button"
              class="button button-secondary"
              :disabled="isLoadingAddressSearch"
              @click="searchAddress"
            >
              {{ isLoadingAddressSearch ? '주소 검색 준비 중...' : '주소 검색' }}
            </button></span
          ></label
        >
        <label
          >상세 주소 (선택)<input
            ref="detailAddressInput"
            v-model.trim="form.addressLine2"
            maxlength="255"
        /></label>
        <label
          >수령 방식<select v-model="form.deliveryMethod">
            <option value="DOORSTEP">문 앞 비대면 배송</option>
            <option value="DIRECT">직접 전달</option>
            <option value="OTHER">기타 요청</option>
          </select></label
        >
        <label v-if="form.deliveryMethod === 'OTHER'"
          >기타 배송 요청<textarea
            v-model.trim="form.otherDeliveryRequest"
            required
            maxlength="255"
            rows="2"
          />
        </label>
        <label
          >공동현관 비밀번호 (선택)<input
            v-model.trim="form.entrancePassword"
            autocomplete="new-password"
            maxlength="100"
            type="password"
        /></label>
      </fieldset>
      <div class="address-create-form__actions">
        <button
          type="button"
          class="button button-secondary"
          :disabled="addressStore.isMutating"
          @click="close"
        >
          취소
        </button>
        <button type="submit" class="button button-primary" :disabled="addressStore.isMutating">
          {{ addressStore.isMutating ? '추가 중...' : '추가하기' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.address-create-form,
.address-create-form__fields {
  display: grid;
  gap: 16px;
}
.address-create-form__fields {
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}
.address-create-form__intro {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.address-create-form__error {
  margin: 0;
  color: #9e3825;
  font-size: var(--font-caption);
}
.address-create-form label {
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 800;
}
.address-create-form input,
.address-create-form textarea,
.address-create-form select {
  width: 100%;
  box-sizing: border-box;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
}
.address-create-form textarea {
  resize: vertical;
}
.address-create-form__grid,
.address-create-form__address-search {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.address-create-form__address-search {
  grid-template-columns: minmax(0, 1fr) auto;
}
.address-create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
@media (max-width: 560px) {
  .address-create-form__grid,
  .address-create-form__address-search {
    grid-template-columns: 1fr;
  }
  .address-create-form__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
