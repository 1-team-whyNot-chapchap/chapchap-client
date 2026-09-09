<script setup>
import { computed, ref } from 'vue'
import AdminFrame from '../components/AdminFrame.vue'
import { consultations } from '../adminSupportPreview'
const search = ref('')
const rows = computed(() => consultations.filter((c) => c.title.includes(search.value.trim())))
</script>
<template>
  <AdminFrame
    title="대기 상담"
    description="관리자 연결을 기다리는 상담을 생성 순서대로 확인합니다."
  >
    <p class="ui-note">
      현재는 대기 목록 미리보기만 제공합니다. 상담 이력 복구·연결 기능이 준비되기 전까지 실제 수락은
      사용할 수 없습니다.
    </p>
    <div class="ops-toolbar">
      <label class="ui-field"
        >상담 제목 검색<input v-model="search" type="search" placeholder="제목 입력" /></label
      ><button class="button button-secondary" @click="search = ''">조건 초기화</button>
    </div>
    <section class="ui-surface ui-stack">
      <div class="ui-row">
        <h2>관리자 연결 대기</h2>
        <span class="ui-muted" role="status">{{ rows.length }}건</span>
      </div>
      <ul class="ui-list">
        <li v-for="c in rows" :key="c.id" class="ui-list-item consultation-row">
          <div>
            <span class="ops-status ops-status--warning">관리자 대기</span>
            <h3>{{ c.title }}</h3>
            <p>{{ c.customer }} · {{ c.createdAt }}</p>
          </div>
          <div class="ui-actions">
            <RouterLink
              class="ops-link"
              :to="{ name: 'admin-consultation-detail', params: { consultationId: c.id } }"
              >처리 화면 미리보기</RouterLink
            ><button class="button button-secondary" disabled>수락 · 연결 전</button>
          </div>
        </li>
        <li v-if="!rows.length" class="ui-empty">
          <h3>조건에 맞는 대기 상담이 없습니다.</h3>
          <button class="button button-secondary" @click="search = ''">검색 초기화</button>
        </li>
      </ul>
    </section>
  </AdminFrame>
</template>

<style scoped>
.consultation-row > .ui-actions {
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-left: auto;
}
.consultation-row h3,
.consultation-row p {
  overflow-wrap: anywhere;
}
@media (max-width: 768px) {
  .consultation-row {
    flex-wrap: wrap;
  }
  .consultation-row > .ui-actions {
    flex-basis: 100%;
    margin-left: 0;
  }
}
</style>
