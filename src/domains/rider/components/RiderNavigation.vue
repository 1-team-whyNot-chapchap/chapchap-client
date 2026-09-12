<script setup>
import { RouterLink } from 'vue-router'
import { CalendarDays, PackageCheck, UserRound } from 'lucide-vue-next'
import { authSession } from '../../../common/api/http.js'
import LogoutButton from '../../auth/components/LogoutButton.vue'
</script>
<template>
  <nav class="rider-navigation" aria-label="라이더 업무">
    <span class="rider-navigation-user" aria-label="라이더 이름">
      <UserRound :size="18" aria-hidden="true" />
      <span>{{ authSession.state.user?.name || '라이더' }}님</span>
    </span>
    <RouterLink to="/rider/deliveries"
      ><PackageCheck :size="18" aria-hidden="true" />배정 목록</RouterLink
    ><RouterLink to="/rider/schedule"
      ><CalendarDays :size="18" aria-hidden="true" />근무 일정</RouterLink
    >
    <LogoutButton />
  </nav>
</template>
<style scoped>
.rider-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-block: 8px 16px;
  border-bottom: 1px solid var(--color-border);
}
.rider-navigation a,
.rider-navigation-user {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
}
.rider-navigation-user {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.rider-navigation-user svg {
  flex-shrink: 0;
}
.rider-navigation .router-link-exact-active {
  background: var(--color-primary-pressed);
  color: var(--color-surface);
}
.rider-navigation a:focus-visible {
  outline: 2px solid var(--color-primary-pressed);
  outline-offset: -3px;
}
@media (max-width: 480px) {
  .rider-navigation-user {
    flex-basis: 100%;
  }
  .rider-navigation a {
    flex: 1 1 0;
    justify-content: center;
    min-width: 0;
  }
}
</style>
