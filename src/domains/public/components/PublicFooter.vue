<script setup>
import { ArrowUpRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="public-footer">
    <div class="public-footer__main">
      <section class="public-footer__intro" aria-label="챱챱 소개">
        <RouterLink class="public-footer__brand" :to="{ name: 'home' }">챱챱</RouterLink>
        <p>내 일정에 맞춰 필요한 요일에 받는 식사 구독 서비스</p>
        <RouterLink :to="{ name: 'login' }">
          소셜 로그인으로 시작 <ArrowUpRight :size="16" aria-hidden="true" />
        </RouterLink>
      </section>
      <nav aria-label="서비스 링크">
        <h2>서비스</h2>
        <RouterLink :to="{ name: 'home' }">서비스 소개</RouterLink>
        <RouterLink :to="{ name: 'menu' }">메뉴 안내</RouterLink>
        <RouterLink :to="{ name: 'plans' }">플랜 비교</RouterLink>
        <RouterLink :to="{ name: 'login' }">고객센터</RouterLink>
      </nav>
      <nav aria-label="정책 링크">
        <h2>안내</h2>
        <RouterLink :to="{ name: 'terms' }">이용약관</RouterLink>
        <RouterLink :to="{ name: 'privacy' }">개인정보 처리방침</RouterLink>
        <RouterLink :to="{ name: 'admin-login' }">관리자 로그인</RouterLink>
      </nav>
      <section class="public-footer__support" aria-labelledby="support-title">
        <h2 id="support-title">고객 지원</h2>
        <p>상담과 문의 이력은 로그인 후 고객센터에서 확인할 수 있습니다.</p>
        <RouterLink :to="{ name: 'login' }">고객센터로 이동</RouterLink>
      </section>
    </div>
    <div class="public-footer__bottom">
      <p>사업자 및 운영 정보는 서비스 운영 정보가 확정되면 공개합니다.</p>
      <p>© 2026 챱챱. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.public-footer__main,
.public-footer__bottom {
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding-inline: var(--page-padding-desktop);
}
.public-footer__main {
  display: grid;
  grid-template-columns: minmax(220px, 1.7fr) repeat(2, minmax(120px, 0.8fr)) minmax(180px, 1.1fr);
  gap: 36px;
  padding-top: 48px;
  padding-bottom: 40px;
}
.public-footer__brand {
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 900;
  letter-spacing: -0.08em;
  text-decoration: none;
}
.public-footer p {
  margin: 11px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
}
.public-footer__intro > a:last-child,
.public-footer__support > a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 40px;
  margin-top: 17px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 800;
}
.public-footer nav {
  display: grid;
  align-content: start;
  gap: 8px;
}
.public-footer h2 {
  margin: 0 0 8px;
  font-size: var(--font-body);
}
.public-footer nav a {
  min-height: 32px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: var(--line-height-body);
  text-decoration: none;
}
.public-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-top: 17px;
  padding-bottom: 22px;
  border-top: 1px solid var(--color-border);
}
.public-footer__bottom p {
  margin: 0;
  font-size: var(--font-caption);
}
@media (hover: hover) and (pointer: fine) {
  .public-footer a:hover {
    color: var(--color-primary);
  }
}
@media (max-width: 900px) {
  .public-footer__main {
    grid-template-columns: minmax(180px, 1.3fr) repeat(2, minmax(120px, 0.8fr));
  }
  .public-footer__support {
    grid-column: 1 / -1;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
  }
}
@media (max-width: 768px) {
  .public-footer__main,
  .public-footer__bottom {
    padding-inline: var(--page-padding-mobile);
  }
  .public-footer__main {
    grid-template-columns: 1fr 1fr;
    gap: 30px 20px;
    padding-top: 36px;
    padding-bottom: 30px;
  }
  .public-footer__intro,
  .public-footer__support {
    grid-column: 1 / -1;
  }
  .public-footer__bottom {
    display: grid;
    gap: 8px;
    padding-bottom: 30px;
  }
}
</style>
