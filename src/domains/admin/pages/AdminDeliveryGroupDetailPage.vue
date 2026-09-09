<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { groups, deliveries, useAdminDeliveryPreviewStore } from '../adminDeliveryPreview'
import { selectButtonPt } from '../../../common/constants/primeUiPt'
const route = useRoute()
const store = useAdminDeliveryPreviewStore()
const group = computed(() => groups.find((g) => g.id === route.params.deliveryGroupId))
const items = computed(() => deliveries.filter((d) => d.groupId === group.value?.id))
const tab = ref('배송 대상')
const action = ref('')
const candidate = ref('')
const reason = ref('')
const isOpen = computed({
  get: () => Boolean(action.value),
  set: (v) => {
    if (!v) action.value = ''
  },
})
function open(value) {
  candidate.value = ''
  reason.value = ''
  action.value = value
}
</script>
<template>
  <AdminFrame
    title="배송 그룹 상세"
    description="배송 대상과 배정 확인 상태를 검토합니다."
    current="admin-delivery-groups"
  >
    <RouterLink class="ops-link" :to="{ name: 'admin-delivery-groups', query: route.query }"
      >← 배송 그룹 목록</RouterLink
    >
    <div v-if="!group" class="ui-empty">
      <h2>배송 그룹을 찾을 수 없습니다.</h2>
      <p>목록에서 대상을 다시 선택해 주세요.</p>
    </div>
    <template v-else>
      <section class="ui-surface ui-stack">
        <div class="ui-row">
          <div>
            <h2>{{ group.area }}</h2>
            <p>{{ group.date }} · {{ group.slot }}</p>
          </div>
          <span class="ops-status">{{ group.status }}</span>
        </div>
        <p class="ui-muted">{{ group.id }}</p>
      </section>
      <div class="ops-split">
        <section class="ui-surface">
          <SelectButton
            v-model="tab"
            :options="['배송 대상', '배정', '후보']"
            :allow-empty="false"
            :pt="selectButtonPt"
            aria-label="배송 그룹 정보"
          />
          <ul v-if="tab === '배송 대상'" class="ui-list">
            <li v-for="d in items" :key="d.id" class="ui-list-item">
              <div>
                <h3>{{ d.recipient }}</h3>
                <p>{{ d.address }}</p>
                <span class="ops-status">{{ d.status }}</span>
              </div>
              <RouterLink
                class="ops-link"
                :to="{ name: 'admin-delivery-detail', params: { deliveryId: d.id } }"
                >배송 상세</RouterLink
              >
            </li>
            <li v-if="!items.length" class="ui-empty">이 예시 그룹에는 배송 대상이 없습니다.</li>
          </ul>
          <div v-else-if="tab === '배정'" class="ui-stack">
            <h3>{{ group.rider }}</h3>
            <p>
              {{
                group.riderId ? '예시 배정 · 라이더 확인 정보 검토' : '아직 배정되지 않았습니다.'
              }}
            </p>
            <RouterLink
              v-if="group.riderId"
              class="ops-link"
              :to="{ name: 'admin-rider-operation', params: { riderId: group.riderId } }"
              @click="store.selectRider(group)"
              >라이더 운영 보기</RouterLink
            ><button
              v-if="group.riderId"
              class="button button-secondary"
              @click="open('배정 이슈 검토')"
            >
              배정 이슈 검토
            </button>
          </div>
          <div v-else class="ui-stack">
            <h3>후보 라이더</h3>
            <p>라이더 1 · 서초 1권역</p>
            <p class="ui-note">실제 후보 가능 여부와 수용량은 서버 조회 후 판단합니다.</p>
          </div>
        </section>
        <aside class="ui-surface ui-stack">
          <h2>배정 작업</h2>
          <p>라이더 확인과 이슈 해결 후 최종 확정할 수 있습니다.</p>
          <button class="button button-secondary" @click="open('수동 배정 검토')">
            수동 배정 검토</button
          ><button class="button button-secondary" disabled>자동 배정 · 연결 전</button
          ><button class="button button-primary" disabled>최종 확정 · 연결 전</button
          ><button
            v-if="group.status === '최종 확정'"
            class="button button-secondary"
            @click="open('긴급 라이더 교체 검토')"
          >
            긴급 교체 검토
          </button>
          <p class="ui-muted">
            현재는 표시 내용을 확인하는 단계이며 배정·확정·교체 요청은 전송하지 않습니다.
          </p>
        </aside>
      </div>
      <OperationReviewDialog
        v-model:visible="isOpen"
        :title="action"
        :target="group.area + ' · ' + group.date + ' ' + group.slot"
        :dirty="Boolean(candidate || reason)"
      >
        <label class="ui-field"
          >검토할 후보<select v-model="candidate" required>
            <option value="">선택해 주세요</option>
            <option>라이더 1</option>
          </select></label
        >
        <p>
          배송 대상 {{ items.length }}건의 전체 구성을 확인합니다. 선택만으로 배정이 바뀌지
          않습니다.
        </p>
        <label class="ui-field"
          >검토 사유<textarea v-model.trim="reason" required rows="3" />
        </label>
      </OperationReviewDialog>
    </template>
  </AdminFrame>
</template>
