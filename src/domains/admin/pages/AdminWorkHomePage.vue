<script setup>
import { ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import AdminAnalyticsOverview from '../components/AdminAnalyticsOverview.vue'
const deliveryError = ref(false)
const supportError = ref(false)
</script>
<template>
  <AdminFrame
    title="관리자 업무 홈"
    description="주문과 배송 지표를 살펴보고 필요한 운영 업무로 이동합니다."
  >
    <AdminAnalyticsOverview />
    <div class="ui-grid work-home-grid">
      <section class="ui-surface ui-stack">
        <div class="ui-row">
          <h2>배송 운영</h2>
          <span class="ops-status ops-status--warning">ADMIN 업무</span>
        </div>
        <template v-if="!deliveryError"
          ><p>배정 확인이 필요한 그룹과 배송 예외를 확인하세요.</p>
          <dl class="ops-summary">
            <div>
              <dt>배정 확인 대기</dt>
              <dd>1개 그룹</dd>
            </div>
            <div>
              <dt>배송 예외</dt>
              <dd>1건</dd>
            </div>
          </dl>
          <div class="ui-actions">
            <RouterLink class="button button-primary" to="/admin/delivery-groups"
              >배송 그룹 보기</RouterLink
            ><RouterLink class="button button-secondary" to="/admin/delivery-operations"
              >운영 예외 보기</RouterLink
            >
          </div></template
        >
        <div v-else class="ui-note ui-stack" role="alert">
          <p>배송 업무를 불러오지 못했습니다. 고객지원 업무는 계속 확인할 수 있습니다.</p>
          <button class="button button-secondary" @click="deliveryError = false">
            배송 영역 다시 확인
          </button>
        </div>
        <button
          v-if="$route.query.design === '1' && !deliveryError"
          class="ops-link"
          @click="deliveryError = true"
        >
          배송 부분 오류 보기
        </button>
      </section>
      <section class="ui-surface ui-stack">
        <h2>고객지원</h2>
        <template v-if="!supportError"
          ><p>대기 상담과 품질 문의의 처리 상태를 살펴보세요.</p>
          <dl class="ops-summary">
            <div>
              <dt>대기 상담 목록</dt>
              <dd>2건</dd>
            </div>
          </dl>
          <p class="ui-muted">전체 상담 수가 아닌 대기 목록 기준입니다.</p>
          <div class="ui-actions">
            <RouterLink class="button button-secondary" to="/admin/consultations"
              >대기 상담 보기</RouterLink
            ><RouterLink class="button button-secondary" to="/admin/quality-inquiries"
              >품질 문의 보기</RouterLink
            >
          </div></template
        >
        <div v-else class="ui-note ui-stack" role="alert">
          <p>고객지원 업무를 불러오지 못했습니다. 배송 업무는 계속 확인할 수 있습니다.</p>
          <button class="button button-secondary" @click="supportError = false">
            고객지원 다시 확인
          </button>
        </div>
        <button
          v-if="$route.query.design === '1' && !supportError"
          class="ops-link"
          @click="supportError = true"
        >
          고객지원 부분 오류 보기
        </button>
      </section>
    </div>
    <section class="ui-surface ui-stack">
      <h2>계정과 운영 기록</h2>
      <div class="ui-actions">
        <RouterLink class="ops-link" to="/admin/riders">라이더 등록·관리</RouterLink
        ><RouterLink class="ops-link" to="/admin/accounts">관리자 계정</RouterLink
        ><RouterLink class="ops-link" to="/admin/audit-logs">감사 이력</RouterLink
        ><RouterLink class="ops-link" to="/admin/password">비밀번호 변경</RouterLink>
      </div>
      <p class="ui-muted">
        실제 메뉴 권한은 인증 연결 후 적용합니다. SUPER_ADMIN은 배송 운영 API 접근 대상이 아닙니다.
      </p>
    </section>
  </AdminFrame>
</template>

<style scoped>
.work-home-grid {
  align-items: stretch;
  margin-bottom: 24px;
}
.work-home-grid > section {
  display: flex;
  flex-direction: column;
}
.work-home-grid .ui-actions {
  margin-top: auto;
}
</style>
