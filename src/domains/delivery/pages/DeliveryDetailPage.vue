<script setup>
import { computed } from 'vue'
import { PackageCheck, MapPin } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/useAppStore'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import StatusBadge from '../../../common/components/feedback/StatusBadge.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
const emit = defineEmits(['navigate'])
const appStore = useAppStore()
const delivery = computed(() => appStore.selectedDelivery)
const address = computed(() =>
  appStore.addresses.find((a) => a.name === delivery.value?.addressName),
)
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton label="배송 내역으로" @back="emit('navigate', 'wf-033')" />
    <header class="ui-heading">
      <div>
        <h1>배송 상세</h1>
        <p>{{ delivery?.id || '배송 정보를 확인해 주세요.' }}</p>
      </div>
    </header>
    <DesignPreview title="배송 상세" :allow-empty="false">
      <div v-if="delivery" class="ui-grid">
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2><PackageCheck :size="22" aria-hidden="true" /> 배송 정보</h2>
            <StatusBadge :status="delivery.status" />
          </div>
          <dl class="ui-details">
            <div>
              <dt>배송 예정일</dt>
              <dd>{{ delivery.deliveryDate }}</dd>
            </div>
            <div>
              <dt>메뉴 수량</dt>
              <dd>{{ delivery.menuCount }}개</dd>
            </div>
            <div>
              <dt>완료 사진</dt>
              <dd>등록된 사진 없음</dd>
            </div>
          </dl>
          <p class="ui-note">완료 사진이 등록되면 이곳에서 확인할 수 있어요.</p>
        </section>
        <section class="ui-surface ui-stack">
          <h2><MapPin :size="22" aria-hidden="true" /> 수령 정보</h2>
          <dl class="ui-details">
            <div>
              <dt>배송지</dt>
              <dd>{{ delivery.addressName }}</dd>
            </div>
            <div>
              <dt>받는 분</dt>
              <dd>{{ address?.recipient || '정보 없음' }}</dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{{ address?.phone || '정보 없음' }}</dd>
            </div>
            <div>
              <dt>주소</dt>
              <dd>{{ address?.address || '배송지 정보를 불러올 수 없어요.' }}</dd>
            </div>
          </dl>
        </section>
      </div>
      <div v-else class="ui-empty">
        <h2>배송을 찾을 수 없어요.</h2>
        <button class="button button-secondary" @click="emit('navigate', 'wf-033')">
          배송 내역으로
        </button>
      </div>
    </DesignPreview>
  </div>
</template>
