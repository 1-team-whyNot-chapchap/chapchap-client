<script setup>
import { computed, ref } from 'vue'
import { CircleHelp, MessageSquareText } from 'lucide-vue-next'
import AdminSidebar from '../components/AdminSidebar.vue'

const emit = defineEmits(['navigate'])
const activeTab = ref('inquiries')
const message = ref('')
const inquiries = ref([
  { id: 'CS-0812-01', title: '배송 누락 문의', customer: '김하늘', status: '답변 대기' },
  { id: 'CS-0812-02', title: '결제 내역 확인 요청', customer: '이도윤', status: '처리 중' },
])
const faqs = ref([
  { id: 'FAQ-01', title: '배송 요일은 언제까지 변경할 수 있나요?', status: '공개' },
  { id: 'FAQ-02', title: '구독 해지는 어떻게 하나요?', status: '비공개' },
])
const rows = computed(() => (activeTab.value === 'inquiries' ? inquiries.value : faqs.value))
function selectTab(tab) {
  activeTab.value = tab
  message.value = ''
}
function update(row) {
  row.status =
    activeTab.value === 'inquiries' ? '답변 완료' : row.status === '공개' ? '비공개' : '공개'
  message.value = `${row.id} 항목을 ${row.status} 상태로 변경했어요.`
}
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar current-route="admin-support-management" @navigate="emit('navigate', $event)" />
    <main class="admin-main support-page">
      <header>
        <h1>FAQ와 상담 요청을 관리합니다.</h1>
        <p>고객 문의는 주문·결제 상태를 확인한 뒤 답변하고 처리 이력을 남겨야 합니다.</p>
      </header>
      <div class="support-tabs" role="tablist">
        <button
          :class="{ 'is-active': activeTab === 'inquiries' }"
          role="tab"
          type="button"
          @click="selectTab('inquiries')"
        >
          <MessageSquareText :size="17" />상담 요청</button
        ><button
          :class="{ 'is-active': activeTab === 'faqs' }"
          role="tab"
          type="button"
          @click="selectTab('faqs')"
        >
          <CircleHelp :size="17" />FAQ
        </button>
      </div>
      <p v-if="message" class="support-message" role="status">{{ message }}</p>
      <section class="support-panel">
        <div>
          <h2>{{ activeTab === 'inquiries' ? '접수된 상담 요청' : 'FAQ 공개 상태' }}</h2>
          <p>{{ rows.length }}건</p>
        </div>
        <ul>
          <li v-for="row in rows" :key="row.id">
            <div>
              <small>{{ row.id }}</small
              ><strong>{{ row.title }}</strong
              ><span v-if="row.customer">{{ row.customer }} 고객</span>
            </div>
            <b :class="{ 'is-warning': row.status !== '공개' && row.status !== '답변 완료' }">{{
              row.status
            }}</b
            ><button class="admin-outline-button" type="button" @click="update(row)">
              {{
                activeTab === 'inquiries' ? '답변 완료' : row.status === '공개' ? '비공개' : '공개'
              }}
            </button>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.support-page {
  padding: clamp(26px, 4vw, 52px);
}
.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}
.support-page h1 {
  margin: 0;
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
.support-page header > p:last-child {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.support-tabs {
  display: flex;
  gap: 8px;
  margin-top: 30px;
}
.support-tabs button {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 43px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  font-weight: 800;
}
.support-tabs .is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}
.support-message {
  padding: 12px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  font-size: var(--font-caption);
}
.support-panel {
  margin-top: 18px;
  padding: 25px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
.support-panel h2,
.support-panel p {
  margin: 0;
}
.support-panel p,
small,
span {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.support-panel ul {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}
.support-panel li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-border);
}
.support-panel strong,
.support-panel span {
  display: block;
  margin-top: 4px;
}
.support-panel b {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
}
.support-panel b.is-warning {
  background: var(--color-warning-soft);
  color: #78601c;
}
@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .support-page {
    padding: 26px 20px;
  }
  .support-panel {
    padding: 20px;
  }
  .support-panel li {
    grid-template-columns: 1fr auto;
  }
  .support-panel .admin-outline-button {
    grid-column: 1/-1;
    width: 100%;
  }
}
</style>
