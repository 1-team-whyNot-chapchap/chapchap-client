<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { UserRound, ChevronLeft } from 'lucide-vue-next'
import http, { authSession } from '../../../common/api/http.js'

const profile = ref(null)
const loading = ref(false)
const error = ref('')
let generation = 0
async function loadProfile() {
  const version = ++generation
  profile.value = null
  error.value = ''
  if (!authSession.state.user) return
  loading.value = true
  try {
    const response = await http.get('/api/auth/users/me')
    if (response.data?.code !== '00' || !response.data.data) throw new Error('Invalid profile')
    if (version === generation) profile.value = response.data.data
  } catch {
    if (version === generation) error.value = '내 정보를 불러오지 못했어요. 다시 시도해 주세요.'
  } finally {
    if (version === generation) loading.value = false
  }
}
watch(
  () => authSession.state.user?.userId,
  () => {
    loading.value = false
    loadProfile()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  generation++
})
const providerLabel = (providers) =>
  (providers || [])
    .map((provider) => ({ KAKAO: '카카오', GOOGLE: '구글' })[provider] || provider)
    .join(', ') || '등록 정보 없음'
</script>

<template>
  <div class="page account-design profile-design">
    <RouterLink class="text-action back-link" to="/mypage"
      ><ChevronLeft :size="18" aria-hidden="true" />마이페이지</RouterLink
    >
    <header class="intro">
      <h1>내 정보</h1>
      <p>등록된 계정 정보를 확인해요.</p>
    </header>
    <p v-if="loading" role="status">내 정보를 불러오고 있어요.</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button button-secondary" @click="loadProfile">다시 시도</button>
    </div>
    <section v-else-if="profile" class="surface stack">
      <div class="profile-photo">
        <div class="avatar">
          <img
            v-if="profile.profileImageUrl"
            :src="profile.profileImageUrl"
            alt="내 프로필 사진"
          /><UserRound v-else :size="32" aria-hidden="true" />
        </div>
        <h2>{{ profile.name || '이름 미등록' }}</h2>
      </div>
      <section class="basic-info">
        <h2>기본 정보</h2>
        <dl>
          <div
            v-for="item in [
              ['이름', profile.name],
              ['이메일', profile.email],
              ['휴대폰 번호', profile.phone],
              ['가입 방식', providerLabel(profile.connectedProviders)],
            ]"
            :key="item[0]"
          >
            <dt>{{ item[0] }}</dt>
            <dd>{{ item[1] || '등록 정보 없음' }}</dd>
          </div>
        </dl>
      </section>
      <p class="muted">프로필 사진 변경과 수신 설정, 회원 탈퇴 기능은 준비 중이에요.</p>
    </section>
    <p v-else role="status">로그인 후 내 정보를 확인할 수 있어요.</p>
  </div>
</template>

<style scoped src="../../../common/styles/account-design.css"></style>
<style scoped>
.back-link {
  display: inline-flex;
  margin-top: var(--space-4);
}
.profile-photo {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: var(--radius-xl);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-copy {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}
.photo-copy h2 {
  line-height: var(--line-height-title);
}
.photo-copy p,
.file-help {
  font-size: var(--font-caption);
}
.basic-info,
.consent {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-5);
}
dl {
  margin: var(--space-4) 0;
}
dl > div {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-3) 0;
  align-items: center;
}
dt {
  color: var(--color-text-muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.consent h2 {
  margin-bottom: var(--space-3);
}
.withdrawal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding: var(--space-5) 0;
  border-top: 1px solid var(--color-border);
}
.withdrawal h2 {
  font-size: var(--font-item-title);
  margin-bottom: var(--space-2);
}
.withdrawal > button {
  flex-shrink: 0;
}
dialog {
  width: min(480px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  color: var(--color-text);
}
dialog::backdrop {
  background: rgba(30, 35, 25, 0.4);
}
@media (max-width: 360px) {
  dl > div {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: var(--space-2);
  }
  .withdrawal {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
