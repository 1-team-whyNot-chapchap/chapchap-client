<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminFrame from '../components/AdminFrame.vue'
import OperationReviewDialog from '../components/OperationReviewDialog.vue'
import { deliveries } from '../adminDeliveryPreview'
const route = useRoute()
const delivery = computed(() => deliveries.find((d) => d.id === route.params.deliveryId))
const action = ref('')
const reason = ref('')
const isOpen = computed({
  get: () => Boolean(action.value),
  set: (v) => {
    if (!v) action.value = ''
  },
})
function open(value) {
  reason.value = ''
  action.value = value
}
</script>
<template>
  <AdminFrame
    title="관리자 배송 상세"
    description="배송 결과와 이력을 확인하고 필요한 후속 처리를 검토합니다."
    current="admin-delivery-groups"
  >
    <RouterLink
      class="ops-link"
      :to="delivery ? '/admin/delivery-groups/' + delivery.groupId : '/admin/delivery-groups'"
      >← 배송 그룹으로</RouterLink
    >
    <div v-if="!delivery" class="ui-empty">
      <h2>배송 대상을 찾을 수 없습니다.</h2>
      <p>그룹 목록에서 다시 선택해 주세요.</p>
    </div>
    <div v-else class="ops-split">
      <div>
        <section class="ui-surface ui-stack">
          <div class="ui-row">
            <h2>{{ delivery.recipient }}</h2>
            <span class="ops-status">{{ delivery.status }}</span>
          </div>
          <dl class="ui-details">
            <div>
              <dt>배송 번호</dt>
              <dd>{{ delivery.id }}</dd>
            </div>
            <div>
              <dt>배송지</dt>
              <dd>{{ delivery.address }}</dd>
            </div>
            <div>
              <dt>시간·수량</dt>
              <dd>{{ delivery.time }} · {{ delivery.count }}식</dd>
            </div>
            <div>
              <dt>전달 방식</dt>
              <dd>{{ delivery.method }}</dd>
            </div>
            <div>
              <dt>요청 사항</dt>
              <dd>{{ delivery.note }}</dd>
            </div>
          </dl>
        </section>
        <section class="ui-surface ui-stack">
          <h2>전달 결과·증빙</h2>
          <p v-if="delivery.status === '배송 실패'">실패 사유: 수령인 연락 불가</p>
          <p v-else-if="delivery.status === '배송 완료'">완료 위치: 문 앞</p>
          <p v-else>아직 전달 결과가 없습니다.</p>
          <p class="ui-muted">
            열람 가능한 완료 사진이 없습니다. 실제 사진은 권한 확인 후 발급되는 접근 URL로
            표시합니다.
          </p>
        </section>
        <section class="ui-surface ui-stack">
          <h2>원본·정정 이력</h2>
          <ol class="ops-timeline">
            <li>
              <strong>원본 상태</strong>
              <p>{{ delivery.status }}</p>
              <time>디자인 예시 · 실제 처리 시각 없음</time>
            </li>
          </ol>
          <p class="ui-muted">정정 이력이 없습니다.</p>
        </section>
      </div>
      <aside class="ui-surface ui-stack">
        <h2>후속 처리 검토</h2>
        <p>대상과 현재 결과를 확인하세요. 완료·실패를 배송 준비 상태로 되돌리지 않습니다.</p>
        <button
          v-if="delivery.status === '배송 준비'"
          class="button button-danger-outline"
          @click="open('배송 실패 검토')"
        >
          실패 처리 검토</button
        ><button
          v-if="delivery.status === '배송 실패'"
          class="button button-secondary"
          @click="open('사후 복구 검토')"
        >
          사후 복구 검토</button
        ><button
          v-if="delivery.status !== '배송 준비'"
          class="button button-secondary"
          @click="open('결과 정보 정정 검토')"
        >
          결과 정정 검토
        </button>
        <p class="ui-note">
          검토 사유만 입력할 수 있습니다. 실제 복구·정정 필드 및 증빙 제출은 서버 연결 시
          활성화합니다.
        </p>
      </aside>
      <OperationReviewDialog
        v-model:visible="isOpen"
        :title="action"
        :target="delivery.id + ' · ' + delivery.status"
        :dirty="Boolean(reason)"
        ><label class="ui-field"
          >검토 사유<textarea v-model.trim="reason" rows="4" required />
        </label>
        <p v-if="action === '사후 복구 검토'" class="ui-note">
          비대면 사후 복구에는 라이더가 촬영한 증빙이 필요합니다. 이 화면에서 완료 처리를 대신하지
          않습니다.
        </p></OperationReviewDialog
      >
    </div>
  </AdminFrame>
</template>
