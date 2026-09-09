<script setup>
import { ChevronRight, ShieldCheck } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PageShell from '../../../common/layouts/PageShell.vue'

const props = defineProps({ screen: { type: String, required: true } })

const quickLinks = [
  {
    label: '내 정보',
    route: 'app-profile',
  },
  { label: '배송지', route: 'app-addresses' },
  {
    label: '결제수단',
    route: 'app-payment-methods',
  },
  { label: '이용·결제 내역', route: 'app-payments' },
  {
    label: '배송 내역',
    route: 'app-deliveries',
  },
]
const isAccount = computed(() => ['account', 'profile'].includes(props.screen))
</script>

<template>
  <PageShell area="customer">
    <main v-if="!isAccount" class="mypage" aria-labelledby="mypage-title">
      <header class="mypage__intro">
        <div>
          <h1 id="mypage-title">내 구독과 계정</h1>
          <span>구독·배송·결제 정보와 계정 설정으로 빠르게 이동할 수 있습니다.</span>
        </div>
        <RouterLink class="button button--secondary" :to="{ name: 'app-account' }"
          >내 정보</RouterLink
        >
      </header>

      <section class="summary" aria-label="내 구독 요약">
        <article class="customer-surface">
          <p>현재 구독</p>
          <strong>구독 정보를 불러오고 있어요</strong>
          <span>플랜, 배송 요일과 이용 상태를 확인할 수 있습니다.</span>
          <RouterLink :to="{ name: 'app-subscription' }">구독 상세 보기</RouterLink>
        </article>
        <article class="customer-surface">
          <p>다음 배송</p>
          <strong>다음 배송 정보를 불러오고 있어요</strong>
          <span>날짜, 시간과 배송지를 준비되는 대로 표시합니다.</span>
          <RouterLink :to="{ name: 'app-deliveries' }">배송 상세 보기</RouterLink>
        </article>
      </section>

      <section class="mypage__links" aria-labelledby="mypage-links-title">
        <div class="section-heading">
          <div>
            <h2 id="mypage-links-title">내 정보 관리</h2>
          </div>
          <RouterLink :to="{ name: 'app-subscription-apply' }">구독 신청</RouterLink>
        </div>
        <div class="link-list">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.route"
            class="customer-surface"
            :to="{ name: link.route }"
          >
            <span
              ><strong>{{ link.label }}</strong></span
            >
            <ChevronRight :size="19" aria-hidden="true" />
          </RouterLink>
        </div>
      </section>
    </main>

    <main v-else class="account-page" aria-labelledby="account-title">
      <header class="account-page__header">
        <div>
          <p>계정 설정</p>
          <h1 id="account-title">세션과 회원 상태</h1>
          <span
            >로그아웃과 회원 탈퇴는 Auth-Service가 현재 세션과 구독 상태를 확인한 뒤
            처리합니다.</span
          >
        </div>
        <RouterLink class="button button--secondary" :to="{ name: 'app-mypage' }"
          >마이페이지</RouterLink
        >
      </header>
      <StateNotice
        tone="warning"
        title="현재 구현 범위"
        message="인증 서버 Adapter가 연결되기 전에는 로그아웃·탈퇴 요청을 실행하지 않습니다. 탈퇴 가능 여부를 화면에서 추정하지 않습니다."
      />
      <section class="account-page__section" aria-labelledby="session-title">
        <div>
          <h2 id="session-title">현재 기기 세션</h2>
          <p>로그아웃하면 현재 Refresh 세션만 폐기합니다.</p>
        </div>
        <button
          class="button button--secondary"
          type="button"
          disabled
          aria-describedby="session-description"
        >
          로그아웃 연결 대기
        </button>
        <p id="session-description" class="sr-only">인증 서버 연결 전에는 실행할 수 없습니다.</p>
      </section>
      <section
        class="account-page__section account-page__section--danger"
        aria-labelledby="withdrawal-title"
      >
        <div>
          <h2 id="withdrawal-title">회원 탈퇴</h2>
          <p>
            `INACTIVE` 상태일 때만 서버가 최종 탈퇴 요청을 허용합니다. 활성 구독 해지를 유도하지
            않습니다.
          </p>
        </div>
        <button
          class="button button--danger"
          type="button"
          disabled
          aria-describedby="withdrawal-description"
        >
          탈퇴 가능 여부 확인 대기
        </button>
        <p id="withdrawal-description" class="sr-only">
          구독 Projection 상태가 아직 조회되지 않았습니다.
        </p>
      </section>
      <RouterLink class="account-page__profile" :to="{ name: 'app-profile' }">
        <ShieldCheck :size="20" aria-hidden="true" />
        <span
          ><strong>프로필과 마케팅 동의</strong
          ><small>이미지와 선택 동의는 내 정보 화면에서 관리합니다.</small></span
        >
        <ChevronRight :size="19" aria-hidden="true" />
      </RouterLink>
    </main>
  </PageShell>
</template>

<style scoped>
.mypage,
.account-page {
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding: 44px var(--page-padding-desktop) 100px;
}
.mypage__intro,
.account-page__header,
.section-heading,
.account-page__section,
.account-page__profile {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.mypage__intro,
.account-page__header {
  margin-bottom: 18px;
}
.mypage__intro > div > p,
.section-heading p,
.account-page__header > div > p {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.mypage h1,
.mypage h2,
.account-page h1,
.account-page h2 {
  margin: 0;
  letter-spacing: -0.045em;
}
.mypage h1,
.account-page h1 {
  font-size: var(--font-page-title);
}
.mypage h2,
.account-page h2 {
  font-size: var(--font-section-title);
}
.mypage__intro span,
.account-page__header span {
  display: block;
  max-width: 620px;
  margin-top: 10px;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.mypage__intro .button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
}
.summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-6);
}
.summary article {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  min-height: 224px;
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.summary p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.summary strong {
  font-size: var(--font-item-title);
  letter-spacing: -0.04em;
}
.summary span {
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.summary a,
.section-heading > a {
  align-self: end;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 800;
}
.mypage__links {
  margin-top: var(--space-7);
}
.section-heading {
  align-items: end;
  margin-bottom: 18px;
}
.link-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.link-list a,
.account-page__profile {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 92px;
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
}
.link-list a > svg:first-child,
.account-page__profile > svg:first-child {
  flex: 0 0 auto;
  color: var(--color-primary);
}
.link-list span,
.account-page__profile span {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.link-list strong,
.account-page__profile strong {
  font-size: var(--font-body);
}
.link-list small,
.account-page__profile small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-compact);
}
.link-list a > svg:last-child,
.account-page__profile > svg:last-child {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--color-text-muted);
}
.account-page__section {
  align-items: center;
  padding: 26px 0;
  border-top: 1px solid var(--color-border);
}
.account-page__section p {
  max-width: 560px;
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-body);
  line-height: var(--line-height-body);
}
.account-page__section .button {
  flex: 0 0 auto;
}
.account-page__section--danger {
  border-bottom: 1px solid var(--color-border);
}
.account-page__profile {
  margin-top: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
@media (max-width: 768px) {
  .mypage,
  .account-page {
    padding: 28px var(--page-padding-mobile) 96px;
  }
  .mypage__intro,
  .account-page__header,
  .account-page__section {
    flex-direction: column;
  }
  .mypage__intro .button,
  .account-page__header .button,
  .account-page__section .button {
    width: 100%;
  }
  .summary,
  .link-list {
    grid-template-columns: 1fr;
  }
}
</style>
