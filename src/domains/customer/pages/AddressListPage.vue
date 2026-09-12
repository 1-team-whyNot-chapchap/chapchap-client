<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Dialog from 'primevue/dialog'
import { MapPin, Plus } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import AddressEditor from '../components/AddressEditor.vue'
import { dialogPt } from '../../../common/constants/primeUiPt'
import http from '../../../common/api/http.js'
import { createAccountDataApi } from '../../subscription/api/accountDataApi.js'
const props = defineProps({ create: Boolean })
const emit = defineEmits(['navigate'])
const appStore = useAppStore(),
  api = createAccountDataApi(http)
const editorBusy = ref(false)
let version = 0
onUnmounted(() => {
  version++
})
const isOpen = ref(props.create),
  editing = ref(null),
  removing = ref(null)
const addresses = ref([]),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  addresses.value = []
  appStore.addresses = []
  try {
    const result = await api.addresses()
    if (current === version) {
      addresses.value = result
      appStore.addresses = result
    }
  } catch {
    if (current === version) error.value = '배송지를 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (current === version) loading.value = false
  }
}
function openForm(address = null) {
  editing.value = address
  isOpen.value = true
}
async function saved() {
  isOpen.value = false
  notice.value = '배송지가 저장되었습니다.'
  await load()
}
async function makeDefault(id) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await api.defaultAddress(id)
    notice.value = '기본 배송지가 변경되었습니다.'
    await load()
  } catch {
    error.value = '기본 배송지를 변경하지 못했습니다. 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
async function remove() {
  if (busy.value || !removing.value) return
  busy.value = true
  error.value = ''
  try {
    await api.deleteAddress(removing.value.id)
    removing.value = null
    notice.value = '배송지가 삭제되었습니다.'
    await load()
  } catch {
    error.value = '배송지를 삭제하지 못했습니다. 사용 중인 배송지인지 확인하고 다시 시도해 주세요.'
  } finally {
    busy.value = false
  }
}
onMounted(load)
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
    <p v-if="loading" role="status">배송지를 불러오고 있어요.</p>
    <div v-else-if="error" role="alert" class="ui-note">
      <p>{{ error }}</p>
      <button class="button button-secondary" @click="load">다시 시도</button>
    </div>
    <div v-else>
      <section v-if="addresses.length" class="ui-surface" aria-label="등록된 배송지">
        <article v-for="address in addresses" :key="address.id" class="ui-list-item">
          <span class="ui-icon"><MapPin :size="22" aria-hidden="true" /></span>
          <div>
            <div class="ui-actions">
              <h2>{{ address.name }}</h2>
              <span v-if="address.isDefault" class="mini-badge">기본 배송지</span>
            </div>
            <p>{{ address.recipient }} · {{ address.phone }}</p>
            <p>{{ address.address }} {{ address.addressLine2 }}</p>
          </div>
          <div class="ui-actions ui-actions--end">
            <button
              v-if="!address.isDefault"
              class="text-button"
              @click="makeDefault(address.id)"
              :disabled="busy"
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
    </div>
    <p class="ui-muted" style="margin-top: 16px">
      기본 배송지는 다른 주소를 기본으로 지정한 뒤 삭제할 수 있어요.
    </p>
    <Dialog
      v-model:visible="isOpen"
      :closable="!editorBusy"
      :close-on-escape="!editorBusy"
      modal
      :draggable="false"
      :header="editing ? '배송지 수정' : '배송지 등록'"
      :pt="dialogPt"
    >
      <AddressEditor
        v-if="isOpen"
        :address="editing"
        @busy="editorBusy = $event"
        @saved="saved"
        @cancel="isOpen = false"
      />
    </Dialog>
    <Dialog
      :visible="Boolean(removing)"
      modal
      :draggable="false"
      header="배송지를 삭제할까요?"
      :closable="!busy"
      :close-on-escape="!busy"
      :pt="dialogPt"
      @update:visible="removing = null"
    >
      <p v-if="error" role="alert">{{ error }}</p>
      <p>{{ removing?.name }} · {{ removing?.address }}</p>
      <p class="ui-muted">삭제한 배송지는 이후 구독 신청에서 선택할 수 없습니다.</p>
      <template #footer
        ><button class="button button-secondary" :disabled="busy" @click="removing = null">
          취소</button
        ><button class="button button-primary" @click="remove" :disabled="busy">
          {{ busy ? '삭제 중…' : '삭제' }}
        </button></template
      >
    </Dialog>
  </div>
</template>
