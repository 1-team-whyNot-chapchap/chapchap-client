<script setup>
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Camera, UserRound, Check, ChevronLeft } from 'lucide-vue-next'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { profilePhotoPreview as preview } from '../profilePhotoPreview'

const marketing = ref(false)
const message = ref('')
const error = ref('')
const fileInput = ref(null)
const withdrawalDialog = ref(null)
const withdrawalButton = ref(null)
const confirmed = ref(false)
const withdrawn = ref(false)
const dialogHeading = ref(null)
async function completeSample() {
  withdrawn.value = true
  await nextTick()
  dialogHeading.value?.focus()
}
function imageError() {
  removeImage()
  error.value = '이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요.'
}
function resetImage() {
  removeImage()
  message.value = '기본 프로필 이미지로 변경했어요.'
}
function removeImage() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
function chooseImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  error.value = ''
  message.value = ''
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    error.value = '5MB 이하의 JPG, PNG, WebP 이미지를 선택해 주세요.'
    event.target.value = ''
    return
  }
  removeImage()
  preview.value = URL.createObjectURL(file)
  message.value = '마이페이지에도 적용했어요. 새로고침하면 초기화되는 미리보기입니다.'
}
function closeDialog() {
  withdrawalDialog.value?.close()
  withdrawalButton.value?.focus()
}
function showDialog() {
  confirmed.value = false
  withdrawn.value = false
  withdrawalDialog.value?.showModal()
}
</script>

<template>
  <div class="page account-design profile-design design-review-page">
    <DesignPreview title="내 정보" :allow-empty="false">
      <RouterLink class="text-action row back-link" to="/mypage"
        ><ChevronLeft :size="18" aria-hidden="true" />마이페이지</RouterLink
      >
      <header class="intro">
        <h1>내 정보</h1>
        <p>프로필과 소식 수신 설정을 확인해요.</p>
      </header>
      <div class="surface stack">
        <section class="profile-photo" aria-label="프로필 사진">
          <div class="avatar">
            <img
              v-if="preview"
              :src="preview"
              alt="선택한 프로필 사진 미리보기"
              @error="imageError"
            /><UserRound v-else :size="32" aria-hidden="true" />
          </div>
          <div class="photo-copy">
            <h2>홍길동님</h2>
          </div>
        </section>
        <p class="muted">나를 나타내는 사진을 골라 주세요.</p>
        <div class="actions">
          <button class="button button-secondary" type="button" @click="fileInput?.click()">
            <Camera :size="18" aria-hidden="true" />사진 변경</button
          ><button class="text-action" type="button" :disabled="!preview" @click="resetImage">
            기본 이미지로
          </button>
        </div>
        <input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="프로필 이미지 선택"
          tabindex="-1"
          @change="chooseImage"
        />
        <p class="muted file-help">JPG, PNG, WebP · 최대 5MB</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div v-if="message" class="notice row" role="status">
          <Check :size="18" aria-hidden="true" /><span>{{ message }}</span>
        </div>
        <section class="basic-info">
          <h2>기본 정보</h2>
          <dl>
            <div
              v-for="item in [
                ['이름', '홍길동'],
                ['이메일', 'sample@example.com'],
                ['휴대폰 번호', '010-0000-0000'],
                ['가입 방식', '카카오'],
              ]"
              :key="item[0]"
            >
              <dt>{{ item[0] }}</dt>
              <dd>{{ item[1] }}</dd>
            </div>
          </dl>
          <p class="muted">본인 확인 정보와 로그인 정보는 여기서 수정할 수 없어요.</p>
        </section>
        <section class="consent">
          <h2>혜택 및 소식</h2>
          <label class="check-row"
            ><input
              v-model="marketing"
              type="checkbox"
              @change="
                message = marketing
                  ? '소식 받기를 선택했어요. 실제 수신 설정은 변경되지 않아요.'
                  : '소식 받기를 해제했어요. 실제 수신 설정은 변경되지 않아요.'
              "
            /><span>[선택] 마케팅 정보 수신 동의</span></label
          >
          <p class="muted">동의하지 않아도 서비스를 이용할 수 있어요.</p>
        </section>
      </div>
      <section class="withdrawal">
        <div>
          <h2>회원 탈퇴</h2>
          <p class="muted">탈퇴 전 이용 중인 구독을 확인해 주세요.</p>
        </div>
        <button ref="withdrawalButton" class="text-action" type="button" @click="showDialog">
          탈퇴 안내
        </button>
      </section>
      <p class="sample-note">
        계정 정보입니다. 사진은 기기 내에서 미리보기로만 사용하며, 계정과 동의 설정은 실제로
        변경되지 않습니다.
      </p>
    </DesignPreview>
    <dialog
      ref="withdrawalDialog"
      aria-labelledby="withdraw-title"
      @cancel.prevent="closeDialog"
      @click="
        (event) => {
          if (event.target === withdrawalDialog) closeDialog()
        }
      "
    >
      <div class="stack">
        <h2 id="withdraw-title" ref="dialogHeading" tabindex="-1">
          {{ withdrawn ? '탈퇴 완료 예시' : '탈퇴 전 확인해 주세요.' }}
        </h2>
        <template v-if="!withdrawn"
          ><p>이용 중인 구독이 있다면 탈퇴할 수 없어요. 탈퇴 후에는 계정 이용이 종료돼요.</p>
          <p class="notice">예시 화면에서는 실제 탈퇴가 진행되지 않아요.</p>
          <label class="check-row"
            ><input v-model="confirmed" type="checkbox" /><span
              >안내 내용을 확인했어요.</span
            ></label
          >
          <div class="actions">
            <button class="button button-secondary" type="button" autofocus @click="closeDialog">
              돌아가기</button
            ><button
              class="button button-primary"
              type="button"
              :disabled="!confirmed"
              @click="completeSample"
            >
              탈퇴 결과 예시
            </button>
          </div></template
        ><template v-else
          ><p role="status">탈퇴가 완료된 경우에 표시되는 화면이에요. 실제 계정은 유지됩니다.</p>
          <button class="button button-primary" type="button" @click="closeDialog">
            확인
          </button></template
        >
      </div>
    </dialog>
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
