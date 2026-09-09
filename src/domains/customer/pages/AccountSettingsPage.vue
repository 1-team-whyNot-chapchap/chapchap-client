<script setup>
import { LogOut, ShieldCheck, UserRoundX } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="page management-page account-settings-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />

    <section class="page-intro">
      <h1>계정 설정</h1>
      <p>로그인 상태와 계정 이용 정보를 관리합니다.</p>
    </section>

    <section class="account-settings-list">
      <article>
        <span><ShieldCheck :size="21" aria-hidden="true" /></span>
        <div>
          <strong>로그인 계정</strong>
          <p>hong@example.com · 챱챱 자체회원</p>
        </div>
      </article>

      <button type="button" @click="emit('navigate', 'login')">
        <LogOut :size="20" aria-hidden="true" />
        <span>
          <strong>로그아웃</strong>
          <small>현재 기기에서 로그인 상태를 종료합니다.</small>
        </span>
      </button>
    </section>

    <section class="account-danger-zone">
      <div>
        <UserRoundX :size="21" aria-hidden="true" />
        <div>
          <strong>회원 탈퇴</strong>
          <p>진행 중인 구독과 결제 예정 건을 먼저 확인해야 합니다.</p>
        </div>
      </div>
      <button type="button" disabled>구독 이용 중에는 탈퇴할 수 없어요</button>
    </section>
  </div>
</template>

<style scoped>
.account-settings-list {
  overflow: hidden;
  margin-top: 38px;
}

.account-settings-list article,
.account-settings-list button {
  width: 100%;
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  text-align: left;
}

.account-settings-list button:last-child {
  border-bottom: 0;
}

.account-settings-list article > span,
.account-settings-list button > svg {
  color: var(--color-primary-pressed);
}

.account-settings-list p,
.account-settings-list small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.account-danger-zone {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-top: 24px;
  padding: 22px;
}

.account-danger-zone > div {
  display: flex;
  gap: 13px;
}

.account-danger-zone > div > svg {
  color: var(--color-danger);
}

.account-danger-zone p {
  margin-top: 5px;
  font-size: var(--font-caption);
}

.account-danger-zone button {
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  color: var(--color-text-muted);
}

@media (max-width: 760px) {
  .account-danger-zone {
    display: flex;
  }
}
</style>
