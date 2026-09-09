<script setup>
import { AlertCircle, ChevronRight, Plus } from 'lucide-vue-next'

defineProps({
  page: {
    type: Object,
    required: true,
  },
})

const labels = ['현재 상태', '다음 일정', '변경 마감']
</script>

<template>
  <div class="page wireframe-page">
    <p class="section-kicker">WF-{{ page.id }} · {{ page.area }}</p>
    <h1>{{ page.title }}</h1>
    <p class="wireframe-page__description">핵심 정보를 확인하고 다음 행동을 진행하는 화면입니다.</p>

    <section v-if="page.type === 'form'" class="wire-card wire-form">
      <label>
        항목 이름
        <input placeholder="내용을 입력해주세요" />
      </label>
      <label>
        선택 항목
        <select>
          <option>선택해주세요</option>
        </select>
      </label>
      <div class="notice-box notice-box--info">
        <AlertCircle :size="19" />
        <div>
          <strong>입력 안내</strong>
          <p>실제 저장과 검증은 API 연결 후 서버 기준으로 처리됩니다.</p>
        </div>
      </div>
      <button class="button button-primary" type="button">
        저장하고 계속하기
        <ChevronRight :size="18" />
      </button>
    </section>

    <section v-else-if="page.type === 'list'" class="wire-card">
      <div class="wire-card__header">
        <h2>목록</h2>
        <button class="button button-secondary" type="button">
          <Plus :size="17" />
          추가
        </button>
      </div>
      <button v-for="label in labels" :key="label" class="wire-list-item" type="button">
        <span>
          <strong>{{ label }}</strong>
          <small>상세 정보와 상태를 확인할 수 있습니다.</small>
        </span>
        <ChevronRight :size="19" />
      </button>
    </section>

    <section v-else class="wire-card wire-detail">
      <div v-for="label in labels" :key="label">
        <span>{{ label }}</span>
        <strong>{{ label === '변경 마감' ? '배송 2일 전 18:00' : '확인 필요' }}</strong>
      </div>
      <button class="button button-primary" type="button">다음 단계로</button>
    </section>
  </div>
</template>

<style scoped>
.wireframe-page {
  max-width: 760px;
}

.wireframe-page h1 {
  margin-top: 10px;
  font-size: var(--font-display);
}

.wireframe-page__description {
  margin-top: 12px;
}

.wire-card {
  margin-top: 30px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}

.wire-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.wire-form {
  display: grid;
  gap: 16px;
}

.wire-form label {
  display: grid;
  gap: 7px;
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 700;
}

.wire-form input,
.wire-form select {
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.wire-form .notice-box {
  margin: 0;
}

.wire-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 17px 0;
  border: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  text-align: left;
}

.wire-list-item span {
  display: grid;
  gap: 4px;
}

.wire-list-item small {
  color: var(--color-text-muted);
}

.wire-detail {
  display: grid;
  gap: 0;
}

.wire-detail > div {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.wire-detail span {
  color: var(--color-text-muted);
}

.wire-detail .button {
  margin-top: 22px;
}
</style>
