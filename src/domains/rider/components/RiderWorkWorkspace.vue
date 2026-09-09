<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PageShell from '../../../common/layouts/PageShell.vue'

const props = defineProps({ screen: { type: String, required: true } })
const message = ref('')
const isAssignmentConfirmed = ref(false)
const isWorkStarted = ref(false)
const isOffDayView = ref(false)
const isIssueView = ref(false)
const offDay = ref({ date: '', time: '', reason: '', detail: '' })
const issueDraft = ref({ type: '', detail: '' })
const issueSubmitted = ref(false)
const issueError = computed(() => {
  if (!issueSubmitted.value) return ''
  if (!issueDraft.value.type) return '이슈 유형을 선택해 주세요.'
  if (!issueDraft.value.detail.trim()) return '상세 설명을 입력해 주세요.'
  return ''
})
const calendarDays = [
  ['일', '8/30', '휴무', 'status--warning'],
  ['월', '8/31', '점심 근무', 'status--success'],
  ['화', '9/1', '저녁 근무', 'status--success'],
  ['수', '9/2', '신청 대기', 'status--warning'],
  ['목', '9/3', '근무 없음', 'status--info'],
  ['금', '9/4', '근무 없음', 'status--info'],
  ['토', '9/5', '근무 없음', 'status--info'],
]
function prepareSchedule() {
  if (!offDay.value.date || !offDay.value.time || !offDay.value.reason) {
    message.value = '희망 날짜, 시간대, 사유를 모두 선택해 주세요.'
    return
  }
  message.value = '휴무일 신청을 등록했습니다. 최근 신청 내역에서 처리 상태를 확인할 수 있습니다.'
  isOffDayView.value = false
}

function confirmAssignment() {
  isAssignmentConfirmed.value = true
  message.value = '배정을 확인했습니다. 근무를 시작하면 배송 상세를 확인할 수 있습니다.'
}

function openIssueView() {
  isIssueView.value = true
  issueSubmitted.value = false
  message.value = ''
}

function submitIssue() {
  issueSubmitted.value = true
  if (issueError.value) return
  isIssueView.value = false
  message.value =
    '배정 이슈를 등록했습니다. 오늘 배송·배정 화면에서 업무를 계속 확인할 수 있습니다.'
}

function startWork() {
  isWorkStarted.value = true
  message.value = '근무를 시작했습니다. 배정된 배송의 상세를 열 수 있습니다.'
}
</script>

<template>
  <PageShell area="rider"
    ><main class="rider-work" aria-labelledby="rider-work-title">
      <header class="rider-work__header">
        <div>
          <p>{{ screen === 'schedule' ? '근무 일정' : '오늘 배송' }}</p>
          <h1 id="rider-work-title">
            {{ screen === 'schedule' ? '근무 일정을 확인해 주세요' : '오늘 배정을 처리해 주세요' }}
          </h1>
          <span>
            {{
              screen === 'schedule'
                ? '일정은 읽기 전용이며, 휴무 신청은 별도 화면에서 진행합니다.'
                : '배정 확인, 근무 시작, 배송 시작은 서로 다른 단계입니다.'
            }}
          </span>
        </div>
        <span class="status status--info">시연 상태 · 서버 확인 전</span>
      </header>
      <StateNotice
        tone="info"
        title="현재 구현 범위"
        message="배정, 근무 시작, 배송 결과는 각 단계에서 명확히 구분해 표시합니다."
      />
      <section
        v-if="screen === 'schedule' && !isOffDayView"
        class="work-section"
        aria-labelledby="schedule-title"
      >
        <div class="section-heading">
          <div>
            <h2 id="schedule-title">근무 캘린더</h2>
            <p>근무일, 휴무일과 신청 대기 상태를 읽기 전용으로 확인합니다.</p>
          </div>
          <button class="button" type="button" @click="isOffDayView = true">휴무일 신청</button>
        </div>
        <ul class="work-list calendar-list" aria-label="8월 30일부터 9월 5일까지 근무 일정">
          <li v-for="[day, date, state, tone] in calendarDays" :key="date">
            <span>{{ day }}</span
            ><strong>{{ date }}</strong>
            <p>{{ state }}</p>
            <span :class="['status', tone]">{{ state }}</span>
          </li>
        </ul>
      </section>
      <section
        v-else-if="screen === 'schedule'"
        class="work-section"
        aria-labelledby="offday-title"
      >
        <div class="section-heading">
          <div>
            <h2 id="offday-title">휴무일 신청</h2>
            <p>희망 날짜와 시간대, 사유를 입력합니다.</p>
          </div>
          <button class="button button--secondary" type="button" @click="isOffDayView = false">
            이전
          </button>
        </div>
        <div class="schedule-form">
          <label>휴무 희망일<input v-model="offDay.date" type="date" /></label
          ><label
            >시간대<select v-model="offDay.time">
              <option value="">선택</option>
              <option>점심</option>
              <option>저녁</option>
              <option>전체</option>
            </select></label
          ><label
            >사유<select v-model="offDay.reason">
              <option value="">선택</option>
              <option>개인 일정</option>
              <option>건강 사유</option>
              <option>기타</option>
            </select></label
          ><label>상세 설명<textarea v-model="offDay.detail" rows="3" /></label
          ><button class="button" type="button" @click="prepareSchedule">신청</button>
        </div>
        <div class="work-list">
          <div class="proposal-card">
            <strong>최근 신청 내역</strong>
            <p>9월 2일 · 전체 · 개인 일정 · 신청 대기</p>
          </div>
        </div>
      </section>
      <section v-else-if="isIssueView" class="work-section" aria-labelledby="issue-title">
        <div class="section-heading">
          <div>
            <h2 id="issue-title">배정 이슈 제기</h2>
            <p>이슈 유형과 필요한 상세 설명을 입력한 뒤 제출합니다.</p>
          </div>
          <button class="button button--secondary" type="button" @click="isIssueView = false">
            이전
          </button>
        </div>
        <form class="issue-form" @submit.prevent="submitIssue">
          <label
            >이슈 유형<select v-model="issueDraft.type">
              <option value="">선택</option>
              <option value="assignment">배정 내용 확인 필요</option>
              <option value="address">배송지 확인 필요</option>
              <option value="schedule">시간대 확인 필요</option>
              <option value="other">기타</option>
            </select></label
          >
          <label
            >상세 설명<textarea
              v-model="issueDraft.detail"
              rows="4"
              placeholder="확인이 필요한 내용을 입력해 주세요."
            ></textarea>
          </label>
          <p v-if="issueError" class="form-error" role="alert">{{ issueError }}</p>
          <button class="button" type="submit">이슈 제출</button>
        </form>
      </section>
      <section v-else class="work-section" aria-labelledby="delivery-list-title">
        <div class="section-heading">
          <div>
            <h2 id="delivery-list-title">오늘 배송·배정</h2>
            <p>8월 31일 · 방문지 3곳 · 도시락 12개</p>
          </div>
          <span class="status">{{
            isWorkStarted ? '근무 중' : isAssignmentConfirmed ? '근무 시작 전' : '배정 확인 전'
          }}</span>
        </div>
        <div class="proposal-actions">
          <button class="button button--secondary" type="button" @click="openIssueView">
            이슈 제기</button
          ><button
            v-if="!isAssignmentConfirmed"
            class="button"
            type="button"
            @click="confirmAssignment"
          >
            배정 확인</button
          ><button v-else-if="!isWorkStarted" class="button" type="button" @click="startWork">
            근무 시작
          </button>
        </div>
        <ul class="work-list">
          <li>
            <span class="status status--info">1 · 강남구</span><strong>문 앞 전달 · 4개</strong>
            <p>근무 시작 후 배송 상세를 확인할 수 있습니다.</p>
            <RouterLink
              v-if="isWorkStarted"
              class="button button--secondary"
              :to="{ name: 'rider-delivery-detail', params: { deliveryId: 'delivery-1' } }"
              >상세 확인</RouterLink
            >
          </li>
          <li>
            <span class="status status--info">2 · 서초구</span><strong>직접 전달 · 8개</strong>
            <p>근무 시작 후 배송 상세를 확인할 수 있습니다.</p>
            <RouterLink
              v-if="isWorkStarted"
              class="button button--secondary"
              :to="{ name: 'rider-delivery-detail', params: { deliveryId: 'delivery-2' } }"
              >상세 확인</RouterLink
            >
          </li>
        </ul>
      </section>
      <StateNotice v-if="message" tone="info" title="요청 상태" :message="message" /></main
  ></PageShell>
</template>

<style scoped>
.rider-work {
  width: min(100%, var(--rider-content-width));
  margin: 0 auto;
  padding: 44px var(--page-padding-desktop) 100px;
}
.rider-work__header,
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rider-work__header {
  margin-bottom: 18px;
}
.rider-work__header p {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.rider-work h1,
.rider-work h2,
.rider-work h3 {
  margin: 0;
  letter-spacing: -0.04em;
}
.rider-work h1 {
  font-size: var(--font-display);
}
.rider-work h2 {
  font-size: var(--font-section-title);
}
.rider-work__header span:not(.status),
.section-heading p {
  display: block;
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.work-section {
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
}
.section-heading {
  margin-bottom: 18px;
}
.proposal-card,
.schedule-form,
.work-list li {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.proposal-card dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 18px 0;
}
.proposal-card dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.proposal-card dd {
  margin: 5px 0 0;
  font-weight: 800;
}
.proposal-actions,
.schedule-form,
.issue-form {
  display: grid;
  gap: 12px;
}
.proposal-actions label,
.schedule-form label,
.issue-form label {
  display: grid;
  gap: 7px;
  font-size: var(--font-body);
  font-weight: 800;
}
.proposal-actions textarea,
.schedule-form select,
.schedule-form input,
.schedule-form textarea,
.issue-form select,
.issue-form textarea {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.work-list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.work-list li {
  display: grid;
  gap: 9px;
}
.work-list li .status {
  justify-self: start;
}
.work-list p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.calendar-list {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-list li {
  min-width: 0;
  min-height: 132px;
  align-content: start;
  gap: var(--space-2);
}
.calendar-list li > span:first-child {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}
.calendar-list strong {
  font-size: var(--font-item-title);
}
.calendar-list .status {
  justify-self: start;
}
.form-error {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-left: 4px solid var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-weight: var(--font-weight-bold);
}
@media (max-width: 768px) {
  .rider-work {
    padding: 28px var(--page-padding-mobile) 96px;
  }
}
@media (max-width: 560px) {
  .rider-work__header,
  .section-heading {
    flex-direction: column;
  }
  .section-heading .button,
  .proposal-actions .button,
  .work-list .button,
  .issue-form .button {
    width: 100%;
  }
  .calendar-list {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--space-1);
  }
  .calendar-list li {
    min-height: 116px;
    padding: var(--space-2);
  }
  .calendar-list li > p,
  .calendar-list .status {
    overflow-wrap: anywhere;
    font-size: var(--font-caption);
  }
}
</style>
