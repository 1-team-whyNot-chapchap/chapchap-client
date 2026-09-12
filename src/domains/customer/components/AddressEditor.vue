<script setup>
import { reactive, ref } from 'vue'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../../subscription/api/accountDataApi.js'
const props = defineProps({ address: { default: null } })
const emit = defineEmits(['saved', 'cancel', 'busy'])
const api = createAccountDataApi(http)
const form = reactive({
  name: '',
  recipient: '',
  phone: '',
  postalCode: '',
  address: '',
  addressLine2: '',
  deliveryMethod: 'DOORSTEP',
  deliveryRequest: '',
  isDefault: false,
  ...props.address,
})
const saving = ref(false),
  error = ref(''),
  persistedId = ref(props.address?.id || '')
async function save() {
  if (saving.value) return
  saving.value = true
  emit('busy', true)
  error.value = ''
  try {
    const result = await api.saveAddress(
      {
        name: form.name.trim(),
        recipientName: form.recipient.trim(),
        recipientPhone: form.phone.trim(),
        postalCode: form.postalCode.trim(),
        addressLine1: form.address.trim(),
        addressLine2: form.addressLine2?.trim() || null,
        deliveryMethod: form.deliveryMethod,
        otherDeliveryRequest: form.deliveryMethod === 'OTHER' ? form.deliveryRequest.trim() : null,
      },
      persistedId.value,
    )
    persistedId.value = result.addressId
    if (form.isDefault && !props.address?.isDefault && !result.isDefault) {
      try {
        await api.defaultAddress(persistedId.value)
      } catch {
        error.value =
          '배송지는 저장됐지만 기본 지정에 실패했습니다. 다시 저장하면 기본 지정을 재시도합니다.'
        return
      }
    }
    emit('saved')
  } catch (failure) {
    error.value = failure.message
  } finally {
    saving.value = false
    emit('busy', false)
  }
}
</script>
<template>
  <form class="ui-stack" @submit.prevent="save">
    <fieldset class="ui-stack address-fields" :disabled="saving">
      <div class="ui-grid">
        <label class="ui-field"
          >배송지 이름<input v-model.trim="form.name" required maxlength="50" placeholder="예: 집"
        /></label>
        <label class="ui-field"
          >받는 분<input v-model.trim="form.recipient" required maxlength="50" autocomplete="name"
        /></label>
      </div>
      <label class="ui-field"
        >연락처<input
          v-model.trim="form.phone"
          type="tel"
          required
          maxlength="20"
          autocomplete="tel"
      /></label>
      <label class="ui-field"
        >우편번호<input
          v-model.trim="form.postalCode"
          required
          maxlength="10"
          inputmode="numeric"
          autocomplete="postal-code"
      /></label>
      <label class="ui-field"
        >도로명 주소<input
          v-model.trim="form.address"
          required
          maxlength="255"
          autocomplete="address-line1"
      /></label>
      <label class="ui-field"
        >상세 주소 (선택)<input
          v-model.trim="form.addressLine2"
          maxlength="255"
          autocomplete="address-line2"
      /></label>
      <p class="ui-note">
        배송 가능 지역은 저장할 때 확인합니다. 배송 일정과 수용 가능 여부는 구독 신청 시 별도로
        확인됩니다.
      </p>
      <label class="ui-field"
        >수령 방식<select v-model="form.deliveryMethod">
          <option value="DOORSTEP">문 앞 비대면 배송</option>
          <option value="DIRECT">직접 전달</option>
          <option value="OTHER">기타 보관</option>
        </select></label
      >
      <label v-if="form.deliveryMethod === 'OTHER'" class="ui-field"
        >보관 요청사항<textarea
          v-model.trim="form.deliveryRequest"
          required
          maxlength="255"
          rows="2"
          placeholder="보관 장소를 알려주세요. 출입 비밀번호는 입력하지 마세요."
        />
      </label>
      <label class="ui-check"
        ><input v-model="form.isDefault" type="checkbox" :disabled="address?.isDefault" />기본
        배송지로 사용</label
      >
      <p v-if="error" role="alert" class="ui-note">{{ error }}</p>
      <div class="ui-actions ui-actions--end">
        <button class="button button-secondary" type="button" @click="emit('cancel')">취소</button
        ><button class="button button-primary" type="submit">
          {{ saving ? '저장 중…' : '배송지 저장' }}
        </button>
      </div>
    </fieldset>
  </form>
</template>
<style scoped>
.address-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
</style>
