<script setup>
import { reactive, ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import { MapPin, Plus } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const isOpen = ref(false)
const removing = ref(null)
const editingId = ref(null)
const notice = ref('')
const emptyForm = () => ({
  name: '',
  recipient: '',
  phone: '',
  postalCode: '',
  address: '',
  addressLine2: '',
  deliveryMethod: '문 앞 비대면 배송',
  deliveryRequest: '',
  isDefault: false,
})
const form = reactive(emptyForm())
const addresses = computed(() =>
  [...appStore.addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
)
function openForm(address) {
  editingId.value = address?.id || null
  Object.assign(form, emptyForm(), address || {})
  isOpen.value = true
}
function save() {
  if (
    ![form.name, form.recipient, form.phone, form.postalCode, form.address].every((v) => v.trim())
  )
    return
  const previous = appStore.addresses.find((a) => a.id === editingId.value)
  if (previous) Object.assign(previous, form)
  else
    appStore.addresses.push({
      ...form,
      id: `sample-${crypto.randomUUID()}`,
      isDefault: form.isDefault || !appStore.addresses.length,
    })
  const id = previous?.id || appStore.addresses.at(-1).id
  if (form.isDefault) appStore.setDefaultAddress(id)
  isOpen.value = false
  notice.value = '예시 목록에 반영했어요. 실제 계정에는 저장되지 않습니다.'
}
function remove() {
  if (!removing.value || removing.value.isDefault) return
  appStore.addresses = appStore.addresses.filter((a) => a.id !== removing.value.id)
  removing.value = null
  notice.value = '예시 목록에서 삭제했어요.'
}
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <header class="ui-heading">
      <div>
        <h1>배송지 관리</h1>
        <p>자주 받는 곳을 등록하고 기본 배송지를 선택하세요.</p>
      </div>
      <button class="button button-primary" @click="openForm()">
        <Plus :size="18" aria-hidden="true" />배송지 등록
      </button>
    </header>
    <p v-if="notice" class="ui-note" role="status">{{ notice }}</p>
    <DesignPreview title="배송지" empty="등록된 배송지가 없어요.">
      <section v-if="addresses.length" class="ui-surface" aria-label="등록된 배송지">
        <article v-for="address in addresses" :key="address.id" class="ui-list-item">
          <span class="ui-icon"><MapPin :size="22" aria-hidden="true" /></span>
          <div>
            <div class="ui-actions">
              <h2>{{ address.name }}</h2>
              <span v-if="address.isDefault" class="mini-badge">기본 배송지</span>
            </div>
            <p>{{ address.recipient }} · {{ address.phone }}</p>
            <p>{{ address.address }}</p>
          </div>
          <div class="ui-actions">
            <button
              v-if="!address.isDefault"
              class="text-button"
              @click="appStore.setDefaultAddress(address.id)"
            >
              기본 지정
            </button>
            <button
              class="text-button"
              :aria-label="`${address.name} 수정`"
              @click="openForm(address)"
            >
              수정
            </button>
            <button
              class="text-button"
              :disabled="address.isDefault"
              :aria-label="`${address.name} 삭제`"
              @click="removing = address"
            >
              삭제
            </button>
          </div>
        </article>
      </section>
      <div v-else class="ui-empty">
        <MapPin :size="32" aria-hidden="true" />
        <h2>등록된 배송지가 없어요.</h2>
        <button class="button button-primary" @click="openForm()">첫 배송지 등록</button>
      </div>
    </DesignPreview>
    <p class="ui-muted" style="margin-top: 16px">
      기본 배송지는 다른 주소를 기본으로 지정한 뒤 삭제할 수 있어요.
    </p>
    <Dialog
      v-model:visible="isOpen"
      modal
      :draggable="false"
      :header="editingId ? '배송지 수정' : '배송지 등록'"
      :pt="dialogPt"
    >
      <form class="ui-stack" @submit.prevent="save">
        <div class="ui-grid">
          <label class="ui-field"
            >배송지 이름<input
              v-model.trim="form.name"
              required
              maxlength="50"
              placeholder="예: 집"
          /></label>
          <label class="ui-field"
            >받는 분<input
              v-model.trim="form.recipient"
              required
              maxlength="50"
              autocomplete="name"
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
            autocomplete="postal-code"
            inputmode="numeric"
          />
        </label>
        <label class="ui-field"
          >도로명 주소<textarea
            v-model.trim="form.address"
            required
            maxlength="255"
            rows="3"
            autocomplete="street-address"
          />
        </label>
        <label class="ui-field"
          >상세 주소 (선택)<input
            v-model.trim="form.addressLine2"
            maxlength="255"
            autocomplete="address-line2"
        /></label>
        <label class="ui-field"
          >수령 방식<select v-model="form.deliveryMethod">
            <option>문 앞 비대면 배송</option>
            <option>직접 전달</option>
          </select></label
        >
        <label class="ui-field"
          >배송 요청사항 (선택)<textarea
            v-model.trim="form.deliveryRequest"
            maxlength="255"
            rows="2"
            placeholder="민감한 출입 비밀번호는 입력하지 마세요."
          />
        </label>
        <label class="ui-check"
          ><input
            v-model="form.isDefault"
            type="checkbox"
            :disabled="
              Boolean(editingId && appStore.addresses.find((a) => a.id === editingId)?.isDefault)
            "
          />기본 배송지로 사용</label
        >
        <p class="ui-muted">
          선택 표시가 없는 입력란은 필수예요. 배송 가능 지역과 사용 중인 주소의 변경 제한은 서비스
          연결 후 확인됩니다.
        </p>
        <div class="ui-actions">
          <button class="button button-secondary" type="button" @click="isOpen = false">취소</button
          ><button class="button button-primary" type="submit">화면에 반영</button>
        </div>
      </form>
    </Dialog>
    <Dialog
      :visible="Boolean(removing)"
      modal
      :draggable="false"
      header="배송지를 삭제할까요?"
      :pt="dialogPt"
      @update:visible="removing = null"
    >
      <p>{{ removing?.name }} · {{ removing?.address }}</p>
      <p class="ui-muted">현재 예시 목록에서만 삭제됩니다.</p>
      <template #footer
        ><button class="button button-secondary" @click="removing = null">취소</button
        ><button class="button button-primary" @click="remove">삭제</button></template
      >
    </Dialog>
  </div>
</template>
