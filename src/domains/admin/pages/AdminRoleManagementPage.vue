<script setup>
import { RouterLink } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-role-management" @navigate="emit('navigate', $event)" />
    <div class="admin-main workspace-ui design-review-page">
      <header class="ui-heading">
        <div>
          <h1>사용자 역할 관리</h1>
          <p>확인된 사용자의 현재 역할과 변경 영향을 검토합니다.</p>
        </div>
      </header>
      <p class="ui-sample">대상 조회 서비스 연결 전입니다. 실제 사용자 목록이 아닙니다.</p>
      <div class="ui-grid">
        <section class="ui-surface ui-stack">
          <h2>대상 사용자</h2>
          <div class="ui-empty">
            <ShieldCheck :size="32" aria-hidden="true" />
            <h3>먼저 사용자 확인이 필요합니다.</h3>
            <p class="ui-muted">
              조회 기능 연결 전에는 사용자 ID를 입력하거나 역할을 변경할 수 없습니다.
            </p>
          </div>
        </section>
        <section class="ui-surface ui-stack">
          <h2>변경 전 확인</h2>
          <dl class="ui-details">
            <div>
              <dt>현재 역할</dt>
              <dd>사용자 미선택</dd>
            </div>
            <div>
              <dt>대상 역할</dt>
              <dd>CUSTOMER / RIDER</dd>
            </div>
          </dl>
          <p class="ui-note">
            라이더 신규 계정은 별도로 발급합니다. 이 화면에서 ADMIN 권한을 부여하지 않습니다.
          </p>
          <button class="button button-primary" disabled>사용자 조회 후 변경 가능</button
          ><RouterLink class="button button-secondary" to="/admin/riders"
            >라이더 계정 관리</RouterLink
          >
        </section>
      </div>
    </div>
  </div>
</template>
