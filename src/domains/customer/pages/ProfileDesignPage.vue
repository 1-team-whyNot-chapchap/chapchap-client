<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { UserRound, ChevronLeft } from 'lucide-vue-next'
import http, { authSession } from '../../../common/api/http.js'
import { createAccountApi } from '../../auth/accountApi.js'
const api = createAccountApi(http)
const profile = ref(null),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
const photo = ref(''),
  photoError = ref(''),
  file = ref(null),
  fileInput = ref(null)
const policy = ref(null),
  consent = ref(null),
  agreed = ref(false),
  consentError = ref('')
const confirming = ref(false),
  confirmed = ref(false)
let generation = 0
function releasePhoto() {
  if (photo.value) URL.revokeObjectURL(photo.value)
  photo.value = ''
}
async function loadPhoto(version) {
  releasePhoto()
  photoError.value = ''
  if (!profile.value?.profileImageUrl) return
  try {
    const blob = await api.image()
    if (version === generation) photo.value = URL.createObjectURL(blob)
  } catch {
    if (version === generation) photoError.value = '사진을 불러오지 못했습니다.'
  }
}
async function loadConsent(version) {
  consentError.value = ''
  policy.value = null
  consent.value = null
  try {
    const policies = await authSession.getSignupPolicies()
    const current = policies.find((p) => p.policyType === 'MARKETING_EMAIL')
    if (!current) throw new Error('Missing policy')
    const value = await api.consent(current.policyId)
    if (version !== generation) return
    policy.value = current
    consent.value = value
    agreed.value = value.consentStatus === 'AGREED'
  } catch {
    if (version === generation)
      consentError.value = '수신 설정을 불러오지 못했습니다. 다시 조회해 주세요.'
  }
}
async function loadProfile() {
  if (busy.value) return
  const version = ++generation
  profile.value = null
  error.value = ''
  releasePhoto()
  if (!authSession.state.user) return
  loading.value = true
  try {
    const value = await api.profile()
    if (version !== generation) return
    profile.value = value
    await Promise.all([loadPhoto(version), loadConsent(version)])
  } catch {
    if (version === generation) error.value = '내 정보를 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (version === generation) loading.value = false
  }
}
async function change(action, success) {
  if (busy.value || loading.value) return
  const version = generation
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action(version)
    if (version === generation) notice.value = success
  } catch (failure) {
    if (version !== generation) return
    error.value =
      failure.response?.status === 409
        ? '현재 계정 또는 구독 상태에서 처리할 수 없습니다. 정보를 다시 조회해 주세요.'
        : failure.response?.status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : failure.response?.status === 400
            ? '사진 형식, 용량 또는 선택한 정책을 확인해 주세요.'
            : failure.response
              ? '요청을 완료하지 못했습니다. 다시 조회해 결과를 확인해 주세요.'
              : failure.message
  } finally {
    if (version === generation) busy.value = false
  }
}
function upload() {
  change(async (version) => {
    const value = await api.uploadImage(file.value)
    if (version !== generation) return
    profile.value = value
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
    await loadPhoto(version)
  }, '프로필 사진을 저장했습니다.')
}
function removePhoto() {
  change(async (version) => {
    await api.deleteImage()
    if (version !== generation) return
    profile.value = { ...profile.value, profileImageUrl: null }
    releasePhoto()
    photoError.value = ''
  }, '프로필 사진을 삭제했습니다.')
}
function saveConsent() {
  if (!policy.value) return
  change(async (version) => {
    const result = await api.saveConsent(policy.value.policyId, agreed.value)
    if (version === generation) {
      consent.value = result
      agreed.value = result.consentStatus === 'AGREED'
    }
  }, '이메일 수신 설정을 저장했습니다.')
}
function withdraw() {
  if (!confirmed.value) return
  change(async (version) => {
    await api.withdraw(true)
    if (version !== generation) return
    authSession.clear()
    notice.value = '회원 탈퇴가 완료되었습니다.'
    confirming.value = false
    confirmed.value = false
    busy.value = false
  }, '')
}
function cancelWithdrawal() {
  confirming.value = false
  confirmed.value = false
}
watch(
  () => authSession.state.user?.userId,
  () => {
    generation++
    busy.value = false
    loading.value = false
    confirming.value = false
    confirmed.value = false
    policy.value = null
    consent.value = null
    file.value = null
    loadProfile()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  generation++
  releasePhoto()
})
const providerLabel = (providers) =>
  (providers || []).map((p) => ({ KAKAO: '카카오', GOOGLE: '구글' })[p] || p).join(', ') ||
  '등록 정보 없음'
</script>
<template>
  <div class="page account-design profile-design">
    <RouterLink class="text-action back-link" to="/mypage"
      ><ChevronLeft :size="18" aria-hidden="true" />마이페이지</RouterLink
    >
    <header class="intro">
      <h1>내 정보</h1>
      <p>계정 정보와 프로필 사진, 이메일 수신 설정을 관리해요.</p>
    </header>
    <p v-if="notice" role="status">{{ notice }}</p>
    <div v-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button button-secondary" :disabled="busy || loading" @click="loadProfile">
        다시 조회
      </button>
    </div>
    <p v-if="loading" role="status">내 정보를 불러오고 있어요.</p>
    <section v-if="profile" class="surface stack" :aria-busy="busy || loading">
      <div class="profile-photo">
        <div class="avatar">
          <img v-if="photo" :src="photo" alt="내 프로필 사진" /><UserRound
            v-else
            :size="32"
            aria-hidden="true"
          />
        </div>
        <h2>{{ profile.name || '이름 미등록' }}</h2>
      </div>
      <p v-if="photoError" role="alert">
        {{ photoError }}
        <button class="text-action" :disabled="busy || loading" @click="loadPhoto(generation)">
          사진 다시 조회
        </button>
      </p>
      <form class="stack" @submit.prevent="upload">
        <label class="ui-field"
          >프로필 사진<input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="busy || loading"
            @change="file = $event.target.files[0]"
        /></label>
        <p class="muted">JPEG, PNG, WebP · 최대 5MB</p>
        <div class="ui-actions">
          <button class="button button-primary" :disabled="busy || loading || !file">
            사진 저장</button
          ><button
            v-if="profile.profileImageUrl"
            type="button"
            class="button button-secondary"
            :disabled="busy || loading"
            @click="removePhoto"
          >
            사진 삭제
          </button>
        </div>
      </form>
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
      <section class="consent">
        <h2>이메일 수신 설정</h2>
        <p v-if="consentError" role="alert">
          {{ consentError }}
          <button class="text-action" :disabled="busy || loading" @click="loadProfile">
            다시 조회
          </button>
        </p>
        <form v-else-if="policy && consent" class="stack" @submit.prevent="saveConsent">
          <p>
            저장된 설정:
            {{
              { AGREED: '동의', DECLINED: '미동의', WITHDRAWN: '철회' }[consent.consentStatus] ||
              '미선택'
            }}
          </p>
          <details>
            <summary>{{ policy.title }}</summary>
            <p style="white-space: pre-wrap">{{ policy.content }}</p>
          </details>
          <label
            ><input v-model="agreed" type="checkbox" :disabled="busy || loading" /> 이메일로 마케팅
            정보를 받겠습니다. (선택)</label
          >
          <p class="muted">동의하지 않아도 서비스 이용에 제한이 없습니다.</p>
          <button
            class="button button-primary"
            :disabled="
              busy ||
              loading ||
              (consent.consentStatus !== null && agreed === (consent.consentStatus === 'AGREED'))
            "
          >
            수신 설정 저장
          </button>
        </form>
      </section>
      <section class="stack withdrawal">
        <div>
          <h2>회원 탈퇴</h2>
          <p>활성 구독이 있거나 구독 상태를 확인할 수 없으면 탈퇴할 수 없습니다.</p>
        </div>
        <button
          v-if="!confirming"
          class="button button-secondary"
          :disabled="busy || loading"
          @click="confirming = true"
        >
          탈퇴 안내
        </button>
        <div v-else class="stack" role="group" aria-label="회원 탈퇴 확인">
          <p>
            탈퇴하면 계정 개인정보와 소셜 연결이 제거되고 모든 로그인 세션이 종료됩니다. 이 작업은
            되돌릴 수 없습니다.
          </p>
          <label
            ><input v-model="confirmed" type="checkbox" :disabled="busy" /> 탈퇴 안내를 확인했으며
            탈퇴하겠습니다.</label
          >
          <div class="ui-actions">
            <button class="button button-secondary" :disabled="busy" @click="cancelWithdrawal">
              취소</button
            ><button class="button button-primary" :disabled="busy || !confirmed" @click="withdraw">
              회원 탈퇴 확정
            </button>
          </div>
        </div>
      </section>
      <p v-if="busy" role="status">변경 사항을 처리하고 있어요.</p>
    </section>
    <p v-else-if="!loading && !error">
      <RouterLink to="/login">로그인</RouterLink> 후 내 정보를 확인할 수 있어요.
    </p>
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
  flex-direction: column;
  align-items: stretch;
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
