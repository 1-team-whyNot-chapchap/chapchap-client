<script setup>
import {
  Bell,
  ChevronRight,
  CreditCard,
  MapPin,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Star,
  Settings,
  UserRound,
  MessageCircle,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { authSession } from '../../../common/api/http.js'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'

const emit = defineEmits(['navigate'])

const links = [
  { label: '내 정보', detail: '이름과 연락처를 관리해요', icon: UserRound, route: 'wf-027' },
  { label: '배송지', detail: '기본 배송지와 추가 주소', icon: MapPin, route: 'wf-028' },
  { label: '결제 수단', detail: '기본 카드와 결제 상태', icon: CreditCard, route: 'wf-030' },
  {
    label: '결제 내역',
    detail: '정기결제 결과와 결제 수단',
    icon: ReceiptText,
    route: 'wf-031',
  },
  {
    label: '배송 내역',
    detail: '회차별 배송 상태와 도착 정보',
    icon: PackageCheck,
    route: 'wf-033',
  },
  {
    label: '환불 내역',
    detail: '환불 요청과 처리 상태',
    icon: RotateCcw,
    route: 'wf-035',
  },
  {
    label: '리뷰 내역',
    detail: '배송 완료 주문의 후기를 관리해요',
    icon: Star,
    route: 'review-history',
  },
  {
    label: '계정 설정',
    detail: '로그아웃과 회원 탈퇴 안내',
    icon: Settings,
    route: 'account-settings',
  },
]
</script>

<template>
  <div class="page design-review-page">
    <DesignPreview title="마이" empty="아직 구독 내역이 없어요.">
      <p class="my-greeting">나의 챱챱 · 안녕하세요</p>
      <section class="mypage-profile">
        <RouterLink class="profile-avatar" to="/mypage/profile" aria-label="프로필 사진 변경">
          <UserRound :size="36" aria-hidden="true" />
        </RouterLink>
        <h1 class="profile-name">
          {{ authSession.state.user?.name || '마이페이지'
          }}<span v-if="authSession.state.user?.name">님</span>
        </h1>
        <button
          type="button"
          class="icon-button"
          aria-label="알림함"
          @click="emit('navigate', 'notifications')"
        >
          <Bell :size="20" aria-hidden="true" />
        </button>
      </section>

      <section class="account-metrics">
        <div>
          <span>현재 구독</span>
          <strong>구독 조회 준비 중</strong>
        </div>
        <div>
          <span>다음 배송</span>
          <strong>배송 조회 준비 중</strong>
        </div>
      </section>

      <section class="settings-list" aria-label="마이페이지 메뉴">
        <button
          v-for="link in links"
          :key="link.label"
          class="settings-list__item"
          type="button"
          @click="emit('navigate', link.route)"
        >
          <span class="settings-list__icon">
            <component :is="link.icon" :size="20" aria-hidden="true" />
          </span>
          <span>
            <strong>{{ link.label }}</strong>
            <small>{{ link.detail }}</small>
          </span>
          <ChevronRight :size="20" aria-hidden="true" />
        </button>
      </section>
      <RouterLink class="my-support" to="/help/chat">
        <MessageCircle :size="24" aria-hidden="true" />
        <span
          ><strong>도움이 필요하신가요?</strong
          ><small>배송부터 이용 문의까지, 상담으로 남겨 주세요.</small></span
        >
        <ChevronRight :size="20" aria-hidden="true" />
      </RouterLink>
    </DesignPreview>
  </div>
</template>

<style scoped>
.mypage-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}
.my-greeting {
  margin: 0 0 16px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.profile-avatar {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-section-title);
  font-weight: 800;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.mypage-profile p {
  font-size: var(--font-caption);
}

.mypage-profile h1 {
  margin: 0;
  line-height: 1.2;
  font-size: var(--font-page-title);
}

.mypage-profile .profile-name {
  min-width: 0;
  font-size: clamp(20px, 3vw, 28px);
  overflow-wrap: anywhere;
}

.profile-name span {
  margin-left: 4px;
  font-size: 0.75em;
  font-weight: 500;
}

.icon-button {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  margin-left: auto;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
}

.account-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 30px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.account-metrics div {
  display: grid;
  gap: 6px;
  padding: 19px;
  min-height: 92px;
  align-content: center;
}

.account-metrics div + div {
  border-left: 1px solid var(--color-border);
}

.account-metrics span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.account-metrics strong {
  font-size: var(--font-body);
}

.settings-list {
  margin-top: 30px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.settings-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  min-height: 84px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  text-align: left;
}

.settings-list__item:last-child {
  border-bottom: 0;
}

.settings-list__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--color-surface-subtle);
  color: var(--color-primary-pressed);
}

.settings-list__item > span:nth-child(2) {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.settings-list__item strong {
  line-height: 1.6;
  font-size: var(--font-body);
}

.settings-list__item small {
  line-height: 1.6;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.settings-list__item > svg {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--color-text-muted);
}
.mypage-profile > div:nth-child(2) {
  min-width: 0;
  overflow-wrap: anywhere;
}
.account-metrics strong {
  overflow-wrap: anywhere;
}
.settings-list__item:hover {
  background: var(--color-surface-subtle);
}
.my-support {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
  padding: 24px;
  border-radius: 18px;
  background: var(--color-primary-soft);
  color: var(--color-text);
  text-decoration: none;
}
.my-support > svg {
  flex-shrink: 0;
}
.my-support > svg:last-child {
  margin-left: auto;
}
.my-support span {
  display: grid;
  gap: 5px;
}
.my-support small,
.my-sample-note {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.my-sample-note {
  margin-top: 16px;
}
@media (min-width: 900px) {
  .settings-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .settings-list__item:nth-child(odd) {
    border-right: 1px solid var(--color-border);
  }
  .settings-list__item:nth-last-child(2) {
    border-bottom: 0;
  }
}
@media (max-width: 480px) {
  .account-metrics {
    grid-template-columns: 1fr;
  }
  .account-metrics div + div {
    border-left: 0;
    border-top: 1px solid var(--color-border);
  }
  .my-support {
    padding: 18px;
  }
}
</style>
