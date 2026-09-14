<script setup>
import { ArrowRight, Headphones, Inbox } from 'lucide-vue-next'
import { displayDateTime } from '../../../common/utils/displayDate.js'

defineProps({
  rows: { type: Array, default: () => [] },
  assigned: { type: Array, default: () => [] },
  busy: Boolean,
  error: String,
  states: { type: Object, required: true },
})
const emit = defineEmits(['accept'])
</script>

<template>
  <div class="consultation-queues" :aria-busy="busy">
    <section class="queue-panel" aria-labelledby="waiting-queue-title">
      <header class="queue-panel__header">
        <div>
          <h2 id="waiting-queue-title"><Inbox :size="19" aria-hidden="true" />연결 대기 상담</h2>
          <p>수락하면 해당 상담의 대화 화면으로 이동합니다.</p>
        </div>
        <span class="queue-count" aria-label="조회된 대기 상담 수">{{ rows.length }}건</span>
      </header>
      <div v-if="rows.length" class="queue-scroll" tabindex="0" aria-label="연결 대기 상담 목록">
        <table class="queue-table">
          <thead>
            <tr>
              <th scope="col">상담 번호</th>
              <th scope="col">접수 일시</th>
              <th scope="col" class="queue-action">연결</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.consultationId">
              <th scope="row">#{{ row.consultationId }}</th>
              <td>
                <time :datetime="row.createdAt">{{ displayDateTime(row.createdAt) }}</time>
              </td>
              <td class="queue-action">
                <button
                  class="button button-primary queue-accept"
                  type="button"
                  :disabled="busy"
                  :aria-label="`상담 ${row.consultationId} 수락하고 연결`"
                  @click="emit('accept', row)"
                >
                  수락하기<ArrowRight :size="15" aria-hidden="true" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="queue-empty" role="status">
        <Inbox :size="28" aria-hidden="true" />
        <p>
          {{
            busy
              ? '대기 상담을 불러오고 있어요.'
              : error
                ? '대기 목록을 확인하지 못했습니다.'
                : '연결을 기다리는 상담이 없습니다.'
          }}
        </p>
      </div>
    </section>
    <section class="queue-panel" aria-labelledby="assigned-queue-title">
      <header class="queue-panel__header">
        <div>
          <h2 id="assigned-queue-title">
            <Headphones :size="19" aria-hidden="true" />내 담당 상담
          </h2>
          <p>담당 상담을 선택해 대화를 이어가세요.</p>
        </div>
        <span class="queue-count queue-count--assigned" aria-label="조회된 담당 상담 수"
          >{{ assigned.length }}건</span
        >
      </header>
      <div v-if="assigned.length" class="queue-scroll" tabindex="0" aria-label="내 담당 상담 목록">
        <table class="queue-table">
          <thead>
            <tr>
              <th scope="col">상담 번호</th>
              <th scope="col">진행 상태</th>
              <th scope="col" class="queue-action">대화</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in assigned" :key="row.consultationId">
              <th scope="row">#{{ row.consultationId }}</th>
              <td>
                <span
                  class="queue-status"
                  :class="{ 'queue-status--closed': row.status === 'CLOSED' }"
                  >{{ states[row.status] || '상태 확인 필요' }}</span
                >
              </td>
              <td class="queue-action">
                <RouterLink
                  class="button button-secondary queue-open"
                  :to="`/admin/consultations/${row.consultationId}`"
                  :aria-label="`상담 ${row.consultationId} 대화 보기`"
                  >대화 보기<ArrowRight :size="15" aria-hidden="true"
                /></RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="queue-empty" role="status">
        <Headphones :size="28" aria-hidden="true" />
        <p>
          {{
            busy
              ? '담당 상담을 불러오고 있어요.'
              : error
                ? '담당 목록을 확인하지 못했습니다.'
                : '아직 담당 중인 상담이 없습니다.'
          }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.consultation-queues {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.queue-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.queue-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}
.queue-panel__header h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}
.queue-panel__header h2 svg {
  color: var(--color-primary-pressed);
  flex-shrink: 0;
}
.queue-panel__header p {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-muted);
}
.queue-count {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.queue-count--assigned {
  background: var(--color-background);
  color: var(--color-text);
}
.queue-scroll {
  max-height: 560px;
  overflow: auto;
}
.queue-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}
.queue-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-surface);
}
.queue-table thead th {
  padding: 12px 20px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.queue-table tbody th,
.queue-table tbody td {
  height: 68px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.queue-table tbody tr:last-child > * {
  border-bottom: 0;
}
.queue-table tbody tr:hover {
  background: var(--color-primary-soft);
}
.queue-table time {
  font-size: 13px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.queue-table .queue-action {
  text-align: right;
}
.queue-accept,
.queue-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 12px;
  font-size: 13px;
  white-space: nowrap;
}
.queue-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: 12px;
  white-space: nowrap;
}
.queue-status--closed {
  background: var(--color-background);
  color: var(--color-text-muted);
}
.queue-empty {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: var(--color-text-muted);
  text-align: center;
}
.queue-empty p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
@media (max-width: 1100px) {
  .consultation-queues {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .queue-panel__header {
    padding: 18px 16px;
  }
  .queue-panel__header h2 {
    font-size: 16px;
  }
  .queue-table thead th,
  .queue-table tbody th,
  .queue-table tbody td {
    padding: 12px 10px;
  }
  .queue-table time {
    white-space: normal;
    font-size: 12px;
  }
  .queue-accept,
  .queue-open {
    min-height: 44px;
    padding: 8px;
  }
  .queue-accept svg,
  .queue-open svg {
    display: none;
  }
}
</style>
