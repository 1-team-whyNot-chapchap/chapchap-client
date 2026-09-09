<script setup>
import { computed, ref } from 'vue'
import SelectButton from 'primevue/selectbutton'
import { Bell, CreditCard, PackageCheck } from 'lucide-vue-next'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import { selectButtonPt } from '../../../common/constants/primeUiPt'
const emit = defineEmits(['navigate'])
const filter = ref('전체')
const notifications = ref([
  {
    id: 1,
    icon: PackageCheck,
    title: '배송 상태가 변경되었어요.',
    description: '배송 내역에서 수령 정보를 확인해 주세요.',
    date: '2026.08.03',
    unread: true,
    target: 'wf-033',
  },
  {
    id: 2,
    icon: CreditCard,
    title: '결제 내역을 확인해 주세요.',
    description: '구독 결제수단과 처리 내역을 확인할 수 있어요.',
    date: '2026.07.26',
    unread: true,
    target: 'wf-031',
  },
])
const unreadCount = computed(() => notifications.value.filter((n) => n.unread).length)
const visible = computed(() =>
  notifications.value.filter((n) => filter.value === '전체' || n.unread),
)
function open(item) {
  item.unread = false
  emit('navigate', item.target)
}
</script>

<template>
  <div class="workspace-ui design-review-page">
    <PageBackButton @back="emit('navigate', 'mypage')" />
    <header class="ui-heading">
      <div>
        <h1>알림 센터</h1>
        <p>배송과 결제에 관한 소식을 한곳에서 확인하세요.</p>
      </div>
      <button
        class="button button-secondary"
        :disabled="!unreadCount"
        @click="notifications.forEach((n) => (n.unread = false))"
      >
        모두 읽음
      </button>
    </header>
    <div class="ui-row">
      <SelectButton
        v-model="filter"
        :options="['전체', '안 읽음']"
        :allow-empty="false"
        :pt="selectButtonPt"
        aria-label="알림 필터"
      />
      <p class="ui-muted" role="status">안 읽은 알림 {{ unreadCount }}개</p>
    </div>
    <DesignPreview title="알림" empty="새로운 알림이 없어요.">
      <section class="ui-surface" style="margin-top: 24px" aria-label="알림 목록">
        <article v-for="item in visible" :key="item.id" class="ui-list-item">
          <span class="ui-icon"><component :is="item.icon" :size="22" aria-hidden="true" /></span>
          <div>
            <div class="ui-actions">
              <h2>{{ item.title }}</h2>
              <span v-if="item.unread" class="mini-badge">안 읽음</span>
            </div>
            <p>{{ item.description }}</p>
            <time class="ui-muted">{{ item.date }}</time>
          </div>
          <button
            class="button button-secondary"
            :aria-label="`${item.title} 내용 확인`"
            @click="open(item)"
          >
            내용 확인
          </button>
        </article>
        <div v-if="!visible.length" class="ui-empty">
          <Bell :size="32" aria-hidden="true" />
          <h2>모든 알림을 확인했어요.</h2>
          <p class="ui-muted">새로운 소식이 오면 알려드릴게요.</p>
        </div>
      </section>
    </DesignPreview>
  </div>
</template>
