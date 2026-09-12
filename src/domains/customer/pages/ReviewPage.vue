<script setup>
import { computed, ref } from 'vue'
import { Star } from 'lucide-vue-next'
const rating = ref(0)
const comment = ref('')
const submitted = ref(false)
const canSubmit = computed(() => rating.value > 0)
function submitReview() {
  if (canSubmit.value) submitted.value = true
}
</script>
<template>
  <section class="page review-page">
    <header>
      <h1>이번 식사는 어떠셨나요?</h1>
      <p>평점과 한 줄 의견은 다음 메뉴 준비에만 활용됩니다.</p>
    </header>
    <form class="review-form" @submit.prevent="submitReview">
      <fieldset :disabled="submitted">
        <legend>만족도를 선택해 주세요.</legend>
        <div class="rating-input">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            :aria-label="`${star}점`"
            :aria-pressed="rating === star"
            @click="rating = star"
          >
            <Star :size="32" :fill="star <= rating ? 'currentColor' : 'none'" aria-hidden="true" />
          </button>
        </div>
      </fieldset>
      <label
        ><span>한 줄 의견 <em>(선택)</em></span
        ><textarea
          v-model="comment"
          :disabled="submitted"
          rows="4"
          maxlength="300"
          placeholder="맛, 양, 배송 경험을 알려주세요."
        />
      </label>
      <p v-if="submitted" class="review-success" role="status">
        후기를 남겼어요. 다음 식사도 챱챱이 잘 준비할게요.
      </p>
      <button class="button button-primary" type="submit" :disabled="!canSubmit || submitted">
        {{ submitted ? '등록 완료' : '후기 등록' }}
      </button>
    </form>
  </section>
</template>
<style scoped>
.review-page {
  max-width: 680px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.review-page h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.review-page header > p:last-child {
  color: var(--color-text-muted);
}
.review-form {
  display: grid;
  gap: 24px;
  margin-top: 30px;
  padding: clamp(22px, 5vw, 36px);
  border: 1px solid var(--color-border);
  border-radius: 22px;
  background: var(--color-surface);
}
.review-form fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}
.review-form legend,
.review-form label > span {
  display: block;
  margin-bottom: 12px;
  font-weight: 800;
}
.review-form em {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-style: normal;
  font-weight: 400;
}
.rating-input {
  display: flex;
  gap: 6px;
}
.rating-input button {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: 4px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--color-border);
}
.rating-input button[aria-pressed='true'] {
  color: #c58c26;
}
.review-form textarea {
  width: 100%;
  resize: vertical;
}
.review-success {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-text);
}
.review-form > .button {
  width: 100%;
}
@media (max-width: 380px) {
  .rating-input {
    gap: 0;
    justify-content: space-between;
  }
}
</style>
