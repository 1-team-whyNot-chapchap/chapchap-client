<script setup>
import { ShieldCheck, UserRoundX } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import { authSession } from '../../../common/api/http.js'
import LogoutButton from '../../auth/components/LogoutButton.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="page management-page account-settings-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <section class="page-intro">
      <h1>계정 설정</h1>
      <p>로그인 상태와 계정 이용 정보를 관리합니다.</p>
    </section>
    <div class="account-cards">
      <section class="account-card" aria-labelledby="account-login-title">
        <div class="account-card-copy">
          <ShieldCheck :size="21" aria-hidden="true" />
          <div>
            <h2 id="account-login-title">로그인 계정</h2>
            <p>{{ authSession.state.user?.name || '로그인 정보 없음' }}</p>
          </div>
        </div>
        <div class="account-card-action"><LogoutButton /></div>
      </section>
      <section class="account-card" aria-labelledby="account-withdraw-title">
        <div class="account-card-copy account-card-copy--danger">
          <UserRoundX :size="21" aria-hidden="true" />
          <div>
            <h2 id="account-withdraw-title">회원 탈퇴</h2>
            <p>내 정보에서 탈퇴 조건과 안내를 확인할 수 있습니다.</p>
          </div>
        </div>
        <div class="account-card-action">
          <RouterLink class="button button-secondary" to="/mypage/profile"
            >탈퇴 안내 보기</RouterLink
          >
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.account-cards {
  display: grid;
  gap: var(--space-5);
  margin-top: var(--space-6);
}
.account-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.account-card-copy {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 0;
}
.account-card-copy > svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-primary-pressed);
}
.account-card-copy--danger > svg {
  color: var(--color-danger);
}
.account-card-copy > div {
  min-width: 0;
}
.account-card h2 {
  margin: 0;
  font-size: var(--font-item-title);
  line-height: var(--line-height-compact);
}
.account-card p {
  margin: var(--space-2) 0 0;
  font-size: var(--font-caption);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
.account-card-action {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  justify-self: end;
  gap: var(--space-2);
  max-width: 100%;
}
.account-card-action :deep(.button) {
  min-height: 44px;
  text-decoration: none;
}
@media (max-width: 760px) {
  .account-card {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
  .account-card-action {
    width: 100%;
  }
}
@media (max-width: 360px) {
  .account-card {
    padding: var(--space-4);
  }
}
</style>
