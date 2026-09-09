<script setup>
import { computed } from 'vue'
import PageShell from '../../../common/layouts/PageShell.vue'
import CustomerManagementWorkspace from '../components/CustomerManagementWorkspace.vue'
import MyPageWorkspace from '../components/MyPageWorkspace.vue'
import SubscriptionApplyFlow from '../components/SubscriptionApplyFlow.vue'

const props = defineProps({ screen: { type: String, default: 'home' } })
const screens = {
  home: {
    title: '오늘의 식사 일정',
    description: '현재 구독, 다음 배송, 알림을 각각 확인할 수 있어요.',
    action: '구독 설정 변경',
    status: '이용 중',
    cards: [
      ['현재 구독', '영양식 · 월/수/금 · 다음 적용일은 서버 확인 후 안내'],
      ['다음 배송', '8월 20일 · 11:00~13:00 · 배송 준비 중'],
      ['읽지 않은 알림', '2건의 새로운 알림이 있어요.'],
    ],
  },
  subscription: {
    title: '현재 구독',
    description: '플랜과 요일별 배송 조건을 확인하고 변경할 수 있어요.',
    action: '설정 변경',
    status: '이용 중',
    cards: [
      ['플랜', '영양식 · 이용 기간은 서버 응답으로 표시'],
      ['요일별 조건', '월/수/금 · 인원, 배송지, 시간대'],
      ['다음 결제', '결제 상태와 적용 가능일을 서버에서 확인합니다.'],
    ],
  },
  apply: {
    title: '구독 신청',
    description: '플랜을 선택하고 월요일부터 토요일 중 필요한 배송 요일을 설정하세요.',
    action: '요일별 조건 입력',
    status: '2단계: 요일 선택',
    cards: [
      ['플랜', '건강식 / 영양식 / 든든식 중 하나를 선택'],
      ['선택한 요일', '월요일 · 조건 입력 필요'],
      ['서버 확인', '실제 배송일·금액·할인·배송비는 최종 확인 단계에서 표시'],
    ],
  },
  change: {
    title: '구독 설정 변경',
    description: '변경 전후와 적용일, 차액은 서버 Preview 응답으로 확인합니다.',
    action: 'Preview 다시 확인',
    status: '서버 Preview 필요',
    cards: [
      ['변경할 항목', '플랜, 요일, 인원, 배송지, 시간대'],
      ['적용일', '서버 계산 결과를 표시'],
      ['실패 시', '기존 설정이 유지되었음을 명확히 안내'],
    ],
  },
  addresses: {
    title: '배송지 관리',
    description: '기본 배송지와 사용 중인 배송지를 안전하게 관리하세요.',
    action: '배송지 추가',
    status: '2개 등록됨',
    cards: [
      ['집', '기본 배송지 · 연락처는 마스킹 표시'],
      ['회사', '사용 중 · 삭제 요청은 서버 거부 사유를 표시'],
    ],
  },
  payments: {
    title: '결제수단',
    description: '현재 결제수단을 선택하거나 PG 등록 화면으로 이동합니다.',
    action: '결제수단 등록',
    status: '기본 수단 있음',
    cards: [
      ['신한카드', '**** **** **** 1234 · 기본'],
      ['보안 안내', '전체 카드번호와 CVC는 표시하거나 저장하지 않습니다.'],
    ],
  },
  history: {
    title: '결제 내역',
    description: '거래 유형, 상태, 원 결제와 취소 관계를 확인합니다.',
    action: '상세 보기',
    status: '최근 3개월',
    cards: [
      ['결제 완료', '금액과 시각은 서버 결과'],
      ['환불 완료', '고객이 직접 환불을 실행하지 않습니다.'],
    ],
  },
  orders: {
    title: '주문·배송 일정',
    description: '배송일, 플랜, 수량과 Delivery 연결 상태를 확인하세요.',
    action: '배송 상세 보기',
    status: '이번 달',
    cards: [
      ['8월 20일', '영양식 · 배송 등록 반영 중'],
      ['8월 22일', '영양식 · 배송 준비 중'],
    ],
  },
  deliveries: {
    title: '배송 내역',
    description: '배송 상태와 지연 여부를 색상 외 정보와 함께 확인합니다.',
    action: '배송 상세 보기',
    status: '배송 준비 중',
    cards: [
      ['8월 20일 점심', 'READY · 배송지 요약과 시간대'],
      ['8월 18일 저녁', 'DELIVERED · 완료 시각과 전달 방식'],
    ],
  },
  faq: {
    title: '자주 묻는 질문',
    description: '질문을 검색하거나 원하는 분류를 선택하세요.',
    action: '상담 시작',
    status: '공개 FAQ',
    cards: [
      ['구독 변경은 언제 반영되나요?', '서버가 계산한 적용 가능일을 확인하세요.'],
      ['검색 결과가 없나요?', '상담으로 이어갈 수 있어요.'],
    ],
  },
  consultations: {
    title: '상담',
    description: 'AI 안내와 관리자 연결 상태를 대화 이력과 함께 확인하세요.',
    action: '새 상담',
    status: '연결 상태 확인 중',
    cards: [
      ['진행 중 상담', 'WAITING_ADMIN · 예상 완료 시간을 임의로 안내하지 않습니다.'],
      ['종료된 상담', '새 상담 생성을 안내합니다.'],
    ],
  },
  quality: {
    title: '품질 문의',
    description: '유형에 맞는 주문·상품·배송 식별자와 내용을 제출하세요.',
    action: '문의 접수',
    status: '접수 전',
    cards: [
      ['문의 유형', 'DAMAGED / MISSING / QUALITY / DELIVERY / OTHER'],
      ['첨부파일', 'JPG, JPEG, PNG, WEBP, PDF · 파일당 10MB 이하'],
    ],
  },
  notifications: {
    title: '알림',
    description: '읽지 않은 알림을 확인하고 안전한 관련 화면으로 이동하세요.',
    action: '전체 읽음',
    status: '읽지 않음 2건',
    cards: [
      ['배송 준비', '민감한 주소·결제 상세는 알림 본문에 표시하지 않습니다.'],
      ['결제 결과', '동일 ID의 SSE/REST 알림을 중복 표시하지 않습니다.'],
    ],
  },
  profile: {
    title: '내 정보',
    description: '프로필과 마케팅 동의를 관리하고, 로그아웃·탈퇴 영향도 확인합니다.',
    action: '변경 저장',
    status: 'CUSTOMER',
    cards: [
      ['프로필 이미지', 'JPEG/PNG/WebP · 5MB 이하'],
      ['회원 탈퇴', '서버가 INACTIVE로 판정한 경우에만 요청할 수 있습니다.'],
    ],
  },
}
const current = computed(() => screens[props.screen] ?? screens.home)
const isManagementScreen = computed(() =>
  ['change', 'addresses', 'payments', 'history', 'orders', 'deliveries'].includes(props.screen),
)
const isMyPageScreen = computed(() => ['mypage', 'account', 'profile'].includes(props.screen))
</script>

<template>
  <SubscriptionApplyFlow v-if="screen === 'apply'" />
  <CustomerManagementWorkspace v-else-if="isManagementScreen" :screen="screen" />
  <MyPageWorkspace v-else-if="isMyPageScreen" :screen="screen" />
  <PageShell v-else area="customer"
    ><section class="page">
      <header class="page-header">
        <div>
          <h1>{{ current.title }}</h1>
          <p>{{ current.description }}</p>
        </div>
        <button class="button">{{ current.action }}</button>
      </header>
      <span class="status">{{ current.status }}</span>
      <div class="cards">
        <article v-for="([title, text], index) in current.cards" :key="title" class="card">
          <h2>{{ title }}</h2>
          <p>{{ text }}</p>
          <button v-if="index === 0" class="button button--secondary">자세히 보기</button>
        </article>
      </div>
      <aside class="notice">
        Loading, Empty, Network Error, 서버 업무 거부, 인증 만료와 비동기 반영 중 상태는 실제
        Adapter 응답에 따라 같은 위치에 표시합니다.
      </aside>
    </section></PageShell
  >
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 20px 0 28px;
}
.card h2 {
  margin: 0 0 8px;
  font-size: var(--font-section-title);
}
.card p {
  min-height: 72px;
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.card .button {
  margin-top: 16px;
}
.notice {
  max-width: none;
}
@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
  .card p {
    min-height: auto;
  }
}
</style>
