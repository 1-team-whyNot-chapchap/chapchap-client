<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Dialog from 'primevue/dialog'
import { MapPin, Plus } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import ContentState from '../../../common/components/feedback/ContentState.vue'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import {
  addressErrorMessage,
  createAddressForm,
  formatAddress,
  toAddressRequest,
} from '../../subscription/addressForm.js'
import { useAddressStore } from '../../subscription/stores/useAddressStore.js'

const emit = defineEmits(['navigate'])
const addressStore = useAddressStore()
const editing = ref(null)
const removing = ref(null)
const form = reactive(createAddressForm())
const notice = ref(null)

const addresses = computed(() =>
  [...addressStore.addresses].sort(
    (left, right) => Number(right.isDefault) - Number(left.isDefault),
  ),
)
const isEditing = computed(() => Boolean(editing.value))
const mutationMessage = computed(() =>
  addressStore.mutationError ? addressErrorMessage(addressStore.mutationError) : '',
)

onMounted(() => addressStore.fetchAddresses())

function openEdit(address) {
  editing.value = address
  Object.assign(form, createAddressForm(address))
  notice.value = null
}

function closeEdit() {
  editing.value = null
  Object.assign(form, createAddressForm())
}

async function saveEdit() {
  if (!editing.value) return
  const saved = await addressStore.updateAddress(editing.value.addressId, toAddressRequest(form))
  if (!saved) return
  closeEdit()
  notice.value = {
    tone: 'success',
    title: '배송지를 수정했어요.',
    message: '서버에 저장된 목록을 다시 불러왔어요.',
  }
}

async function setDefault(address) {
  notice.value = null
  const saved = await addressStore.setDefaultAddress(address.addressId)
  if (saved) {
    notice.value = {
      tone: 'success',
      title: '기본 배송지를 변경했어요.',
      message: '서버의 최신 배송지 목록을 반영했어요.',
    }
  }
}

async function remove() {
  if (!removing.value) return
  const deleted = await addressStore.deleteAddress(removing.value.addressId)
  if (!deleted) return
  removing.value = null
  notice.value = {
    tone: 'success',
    title: '배송지를 삭제했어요.',
    message: '서버의 최신 배송지 목록을 반영했어요.',
  }
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
      <button class="button button-primary" type="button" @click="emit('navigate', 'wf-029')">
        <Plus :size="18" aria-hidden="true" />배송지 등록
      </button>
    </header>

    <StateNotice
      v-if="notice"
      :tone="notice.tone"
      :title="notice.title"
      :message="notice.message"
    />
    <StateNotice
      v-if="mutationMessage"
      tone="danger"
      title="요청을 처리하지 못했어요."
      :message="mutationMessage"
    />

    <ContentState
      :state="
        addressStore.listStatus === 'success'
          ? 'ready'
          : addressStore.listStatus === 'idle'
            ? 'loading'
            : addressStore.listStatus
      "
      empty-title="등록된 배송지가 없어요."
      @retry="addressStore.fetchAddresses(true)"
    >
      <section class="ui-surface" aria-label="등록된 배송지">
        <article v-for="address in addresses" :key="address.addressId" class="ui-list-item">
          <span class="ui-icon"><MapPin :size="22" aria-hidden="true" /></span>
          <div>
            <div class="ui-actions">
              <h2>{{ address.name }}</h2>
              <span v-if="address.isDefault" class="mini-badge">기본 배송지</span>
            </div>
            <p>{{ address.recipientName }} · {{ address.recipientPhone }}</p>
            <p>{{ formatAddress(address) }}</p>
            <p
              v-if="address.deliveryMethod === 'OTHER' && address.otherDeliveryRequest"
              class="ui-muted"
            >
              배송 요청: {{ address.otherDeliveryRequest }}
            </p>
          </div>
          <div class="ui-actions">
            <button
              v-if="!address.isDefault"
              class="text-button"
              type="button"
              :disabled="addressStore.isMutating"
              @click="setDefault(address)"
            >
              기본 지정
            </button>
            <button
              class="text-button"
              type="button"
              :disabled="addressStore.isMutating"
              :aria-label="`${address.name} 수정`"
              @click="openEdit(address)"
            >
              수정
            </button>
            <button
              class="text-button"
              type="button"
              :disabled="address.isDefault || addressStore.isMutating"
              :aria-label="`${address.name} 삭제`"
              @click="removing = address"
            >
              삭제
            </button>
          </div>
        </article>
      </section>
    </ContentState>

    <p class="ui-muted" style="margin-top: 16px">
      기본 배송지는 다른 주소를 기본으로 지정한 뒤 삭제할 수 있어요. 사용 중인 배송지는 먼저 구독
      설정을 변경해 주세요.
    </p>

    <Dialog
      :visible="isEditing"
      modal
      :draggable="false"
      header="배송지 수정"
      :pt="dialogPt"
      @update:visible="closeEdit"
    >
      <form class="ui-stack" @submit.prevent="saveEdit">
        <div class="ui-grid">
          <label class="ui-field"
            >배송지 이름<input v-model.trim="form.name" required maxlength="50"
          /></label>
          <label class="ui-field"
            >받는 분<input v-model.trim="form.recipientName" required maxlength="50"
          /></label>
        </div>
        <label class="ui-field"
          >연락처<input v-model.trim="form.recipientPhone" type="tel" required maxlength="20"
        /></label>
        <label class="ui-field"
          >우편번호<input v-model.trim="form.postalCode" required maxlength="10"
        /></label>
        <label class="ui-field"
          >도로명 주소<textarea
            v-model.trim="form.addressLine1"
            required
            maxlength="255"
            rows="3"
          />
        </label>
        <label class="ui-field"
          >상세 주소 (선택)<input v-model.trim="form.addressLine2" maxlength="255"
        /></label>
        <label class="ui-field"
          >수령 방식<select v-model="form.deliveryMethod">
            <option value="DOORSTEP">문 앞 비대면 배송</option>
            <option value="DIRECT">직접 전달</option>
            <option value="OTHER">기타 요청</option>
          </select></label
        >
        <label v-if="form.deliveryMethod === 'OTHER'" class="ui-field"
          >기타 배송 요청<textarea
            v-model.trim="form.otherDeliveryRequest"
            required
            maxlength="255"
            rows="2"
          />
        </label>
        <label class="ui-field"
          >공동현관 비밀번호 변경 (선택)<input
            v-model.trim="form.entrancePassword"
            :disabled="form.clearEntrancePassword"
            maxlength="100"
            type="password"
            autocomplete="new-password"
          />
        </label>
        <label class="ui-check"
          ><input v-model="form.clearEntrancePassword" type="checkbox" />기존 공동현관 비밀번호
          삭제</label
        >
        <div class="ui-actions">
          <button
            class="button button-secondary"
            type="button"
            :disabled="addressStore.isMutating"
            @click="closeEdit"
          >
            취소
          </button>
          <button class="button button-primary" type="submit" :disabled="addressStore.isMutating">
            {{ addressStore.isMutating ? '저장 중...' : '저장' }}
          </button>
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
      <p>{{ removing?.name }} · {{ formatAddress(removing || {}) }}</p>
      <p class="ui-muted">현재 구독이나 배송 예정 주문에서 사용 중인 배송지는 삭제할 수 없어요.</p>
      <template #footer>
        <button
          class="button button-secondary"
          type="button"
          :disabled="addressStore.isMutating"
          @click="removing = null"
        >
          취소
        </button>
        <button
          class="button button-primary"
          type="button"
          :disabled="addressStore.isMutating"
          @click="remove"
        >
          {{ addressStore.isMutating ? '삭제 중...' : '삭제' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>
