<script setup>
import { computed, reactive, ref } from 'vue'
import StateNotice from '../../../common/components/feedback/StateNotice.vue'
import PageShell from '../../../common/layouts/PageShell.vue'

const props = defineProps({
  screen: {
    type: String,
    required: true,
  },
})

const screenCopy = {
  change: {
    eyebrow: '구독 설정',
    title: '변경 내용을 먼저 검토하세요',
    description: '적용 가능일·금액·결제 영향은 서버 Preview 응답으로만 확인합니다.',
  },
  addresses: {
    eyebrow: '배송지',
    title: '배송지를 안전하게 관리하세요',
    description: '기본 배송지 변경과 삭제 가능 여부는 서버가 사용 중인 구독을 함께 확인합니다.',
  },
  payments: {
    eyebrow: '결제수단',
    title: '현재 결제수단을 확인하세요',
    description:
      '카드 등록은 PG 인증 흐름에서만 진행하며 카드번호와 CVC를 이 화면에 입력하지 않습니다.',
  },
  history: {
    eyebrow: '결제 내역',
    title: '거래 결과를 확인하세요',
    description: '결제·취소 결과와 원 거래 관계는 서버가 확정한 기록만 표시합니다.',
  },
  orders: {
    eyebrow: '주문 일정',
    title: '예정된 주문을 확인하세요',
    description: '배송 등록 중인 주문은 실패로 단정하지 않고 반영 상태를 별도로 표시합니다.',
  },
  deliveries: {
    eyebrow: '배송 내역',
    title: '내 배송 상태를 확인하세요',
    description: '배송 지연은 현재 상태와 별도의 지연 안내를 함께 표시합니다.',
  },
}

const current = computed(() => screenCopy[props.screen] ?? screenCopy.addresses)
const message = ref('')
const addressFormOpen = ref(false)
const addressSubmitted = ref(false)
const selectedPayment = ref('current')
const addressDraft = reactive({
  label: '',
  recipient: '',
  phone: '',
  postcode: '',
  address: '',
  detail: '',
  deliveryMethod: 'DOORSTEP',
  otherInstruction: '',
  entrancePassword: '',
})

const addressError = computed(() => {
  if (!addressSubmitted.value) return ''
  if (!addressDraft.label.trim()) return '배송지 이름을 입력해 주세요.'
  if (!addressDraft.recipient.trim()) return '수령인 이름을 입력해 주세요.'
  if (!addressDraft.phone.trim()) return '연락처를 입력해 주세요.'
  if (!addressDraft.postcode.trim() || !addressDraft.address.trim())
    return '우편번호와 기본 주소를 입력해 주세요.'
  if (addressDraft.deliveryMethod === 'OTHER' && !addressDraft.otherInstruction.trim()) {
    return '기타 배달 방식의 안내를 입력해 주세요.'
  }
  return ''
})
const addressSubmitDisabled = computed(() => {
  if (!addressDraft.label.trim() || !addressDraft.recipient.trim() || !addressDraft.phone.trim())
    return true
  if (!addressDraft.postcode.trim() || !addressDraft.address.trim()) return true
  return addressDraft.deliveryMethod === 'OTHER' && !addressDraft.otherInstruction.trim()
})

const addresses = [
  {
    label: '집',
    recipient: '수령인',
    phone: '010-****-1234',
    address: '주소는 서버 연결 후 최소 범위로 표시',
    method: '문 앞 배송',
    badges: ['기본 배송지', '사용 중'],
  },
  {
    label: '회사',
    recipient: '수령인',
    phone: '010-****-5678',
    address: '주소는 서버 연결 후 최소 범위로 표시',
    method: '직접 전달',
    badges: ['사용 중'],
  },
]

const orderRows = [
  ['이번 주 점심', '영양식 · 수량과 배송비는 서버 결과로 표시', '배송 등록 반영 중', 'warning'],
  ['다음 배송', '영양식 · 시간대는 서버 확인 후 표시', 'READY', 'info'],
]
const deliveryRows = [
  ['다음 배송', '배송지와 연락처는 업무에 필요한 최소 정보만 공개', 'READY', 'info'],
  ['최근 배송', '완료 시각·실제 전달 방식은 서버 결과로 표시', 'DELIVERED', 'success'],
]

function openAddressForm() {
  addressFormOpen.value = true
  addressSubmitted.value = false
  message.value = ''
}

function closeAddressForm() {
  addressFormOpen.value = false
}

function prepareAddressRequest() {
  addressSubmitted.value = true
  if (addressSubmitDisabled.value) return
  addressFormOpen.value = false
  message.value =
    '배송지 등록 요청을 보낼 준비가 되었습니다. 서버가 주소 형식과 사용 가능 여부를 다시 확인합니다.'
}

function preparePreview() {
  message.value =
    '변경 Preview를 요청할 준비가 되었습니다. 적용일·차액·결제 영향은 Gateway 연결 뒤 서버 응답으로 표시합니다.'
}

function preparePaymentRegistration() {
  message.value =
    '결제수단 등록은 PG 인증 계약이 연결된 뒤에만 시작합니다. 이 화면에서는 카드번호와 CVC를 수집하지 않습니다.'
}
</script>

<template>
  <PageShell area="customer">
    <main
      class="management-page"
      :class="`management-page--${screen}`"
      aria-labelledby="management-title"
    >
      <header class="management-page__header">
        <div>
          <h1 id="management-title">{{ current.title }}</h1>
          <p>{{ current.description }}</p>
        </div>
        <span class="status status--info">시연 상태 · 서버 확인 전</span>
      </header>

      <StateNotice
        tone="info"
        title="현재 구현 범위"
        message="표시된 값은 화면 구조를 검증하기 위한 시연 상태입니다. 실제 구독·주소·결제·배송 결과는 Gateway와 서버가 최종 확인합니다."
      />

      <section v-if="screen === 'change'" class="workspace-section" aria-labelledby="change-title">
        <div class="section-heading">
          <div>
            <h2 id="change-title">변경할 항목</h2>
            <p>입력값을 바꾸면 기존 Preview는 폐기하고 서버에 다시 요청해야 합니다.</p>
          </div>
          <button class="button" type="button" @click="preparePreview">Preview 요청 준비</button>
        </div>
        <dl class="change-summary">
          <div>
            <dt>플랜</dt>
            <dd>현재 설정은 서버 연결 후 표시</dd>
          </div>
          <div>
            <dt>배송 요일·조건</dt>
            <dd>인원·배송지·시간대를 서버에서 다시 검토</dd>
          </div>
          <div>
            <dt>현재 결제수단</dt>
            <dd>마스킹 정보와 사용 가능 여부를 서버가 확인</dd>
          </div>
        </dl>
        <StateNotice
          tone="warning"
          title="적용 전 안내"
          message="배송지·시간대 변경으로 금액이 같으면 결제 UI를 표시하지 않습니다. 활성 구독 해지 버튼은 제공하지 않습니다."
        />
      </section>

      <section
        v-else-if="screen === 'addresses'"
        class="workspace-section"
        aria-labelledby="address-title"
      >
        <div class="section-heading">
          <div>
            <h2 id="address-title">등록된 배송지</h2>
            <p>수령인과 연락처는 마스킹하고, 사용 중인 배송지는 서버 판정 전 삭제하지 않습니다.</p>
          </div>
          <button class="button" type="button" @click="openAddressForm">배송지 추가</button>
        </div>
        <ul class="address-list">
          <li v-for="address in addresses" :key="address.label">
            <div class="address-list__heading">
              <div>
                <h3>{{ address.label }}</h3>
                <span>{{ address.recipient }} · {{ address.phone }}</span>
              </div>
              <span v-for="badge in address.badges" :key="badge" class="status status--info">{{
                badge
              }}</span>
            </div>
            <p>{{ address.address }}</p>
            <dl>
              <div>
                <dt>배달 방식</dt>
                <dd>{{ address.method }}</dd>
              </div>
              <div>
                <dt>변경 가능 여부</dt>
                <dd>서버 연결 후 표시</dd>
              </div>
            </dl>
          </li>
        </ul>

        <form v-if="addressFormOpen" class="address-form" @submit.prevent="prepareAddressRequest">
          <div class="section-heading">
            <div>
              <h2>새 배송지 작성</h2>
              <p>공동현관 비밀번호는 이 화면에서만 입력하며 서버 계약 전 저장하지 않습니다.</p>
            </div>
            <button class="button button--secondary" type="button" @click="closeAddressForm">
              작성 취소
            </button>
          </div>
          <p v-if="addressError" class="form-error" role="alert">{{ addressError }}</p>
          <div class="address-form__fields">
            <label>배송지 이름<input v-model="addressDraft.label" type="text" /></label
            ><label>수령인 이름<input v-model="addressDraft.recipient" type="text" /></label
            ><label>연락처<input v-model="addressDraft.phone" type="tel" inputmode="tel" /></label
            ><label>우편번호<input v-model="addressDraft.postcode" type="text" /></label
            ><label class="address-form__wide"
              >기본 주소<input v-model="addressDraft.address" type="text" /></label
            ><label class="address-form__wide"
              >상세 주소<input v-model="addressDraft.detail" type="text" /></label
            ><label
              >배달 방식<select v-model="addressDraft.deliveryMethod">
                <option value="DIRECT">직접 전달</option>
                <option value="DOORSTEP">문 앞 배송</option>
                <option value="OTHER">기타</option>
              </select></label
            ><label
              >공동현관 비밀번호 <small>선택 입력</small
              ><input
                v-model="addressDraft.entrancePassword"
                type="password"
                autocomplete="new-password" /></label
            ><label v-if="addressDraft.deliveryMethod === 'OTHER'" class="address-form__wide"
              >기타 배달 안내<textarea v-model="addressDraft.otherInstruction" rows="3"></textarea>
            </label>
          </div>
          <button class="button" type="submit" :disabled="addressSubmitDisabled">
            등록 요청 준비
          </button>
        </form>
      </section>

      <section
        v-else-if="screen === 'payments'"
        class="workspace-section"
        aria-labelledby="payment-title"
      >
        <div class="section-heading">
          <div>
            <h2 id="payment-title">결제에 사용할 수단</h2>
            <p>전체 카드번호와 CVC는 표시하거나 저장하지 않습니다.</p>
          </div>
          <button class="button" type="button" @click="preparePaymentRegistration">
            결제수단 등록
          </button>
        </div>
        <fieldset class="payment-list">
          <legend>현재 수단 선택</legend>
          <label class="payment-item"
            ><input v-model="selectedPayment" type="radio" value="current" /><span
              ><strong>현재 결제수단</strong
              ><small>카드사와 마스킹 번호는 서버 연결 후 표시</small></span
            ><span class="status status--success">기본 수단</span></label
          ><label class="payment-item"
            ><input v-model="selectedPayment" type="radio" value="new" /><span
              ><strong>다른 결제수단 선택</strong
              ><small>PG 인증이 완료된 수단만 서버가 제공</small></span
            ><span class="status status--warning">연동 필요</span></label
          >
        </fieldset>
        <StateNotice
          tone="warning"
          title="삭제 제한"
          message="진행 중 구독의 현재 결제수단은 직접 삭제할 수 없습니다. 서버가 다른 사용 가능 수단을 확인한 뒤 안내합니다."
        />
      </section>

      <section
        v-else-if="screen === 'history'"
        class="workspace-section"
        aria-labelledby="history-title"
      >
        <div class="section-heading">
          <div>
            <h2 id="history-title">최근 거래 기록</h2>
            <p>금액·상태·원 결제와 취소 관계는 서버 확정 결과만 표시합니다.</p>
          </div>
          <span class="status status--info">최근 3개월</span>
        </div>
        <ul class="record-list">
          <li>
            <strong>결제 결과</strong><span>거래 유형, 시각, 금액은 서버 연결 후 표시</span
            ><span class="status status--info">확인 필요</span>
          </li>
          <li>
            <strong>취소·환불 결과</strong
            ><span>고객은 직접 환불을 실행하지 않으며 원 거래 관계를 확인합니다.</span
            ><span class="status status--warning">서버 판정</span>
          </li>
        </ul>
      </section>

      <section v-else class="workspace-section" aria-labelledby="schedule-title">
        <div class="section-heading">
          <div>
            <h2 id="schedule-title">{{ screen === 'orders' ? '주문·배송 일정' : '배송 상태' }}</h2>
            <p>
              {{
                screen === 'orders'
                  ? '개별 주문 취소나 배송일 변경은 이 화면에서 제공하지 않습니다.'
                  : '내 배송만 조회하며 내부 코드와 운영 메모는 표시하지 않습니다.'
              }}
            </p>
          </div>
          <span class="status status--info">서버 갱신 대기</span>
        </div>
        <ul class="schedule-list">
          <li
            v-for="[title, detail, status, tone] in screen === 'orders' ? orderRows : deliveryRows"
            :key="title"
          >
            <div>
              <strong>{{ title }}</strong
              ><span>{{ detail }}</span>
            </div>
            <span :class="['status', `status--${tone}`]">{{ status }}</span>
          </li>
        </ul>
        <StateNotice
          v-if="screen === 'orders'"
          tone="warning"
          title="반영 중 상태"
          message="주문 확정 뒤 Delivery 등록은 짧은 지연이 있을 수 있습니다. 반영 중인 상태를 즉시 실패로 표시하지 않습니다."
        />
        <StateNotice
          v-else
          tone="info"
          title="배송 상세 제한"
          message="완료 사진은 허용된 경우에만 접근하며 공개 URL을 표시하지 않습니다. 지연은 현재 상태와 함께 별도 안내로 표시합니다."
        />
      </section>

      <StateNotice v-if="message" tone="info" title="요청 상태" :message="message" />
    </main>
  </PageShell>
</template>

<style scoped>
.management-page {
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 44px var(--page-padding-desktop) 100px;
}
.management-page__header,
.section-heading,
.address-list__heading,
.payment-item,
.schedule-list li,
.record-list li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.management-page__header {
  margin-bottom: 18px;
}
.management-page__eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 800;
}
.management-page h1,
.management-page h2,
.management-page h3 {
  margin: 0;
  letter-spacing: -0.04em;
}
.management-page h1 {
  font-size: var(--font-page-title);
}
.management-page h2 {
  font-size: var(--font-section-title);
}
.management-page__header p:not(.management-page__eyebrow),
.section-heading p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.workspace-section {
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
}
.section-heading {
  margin-bottom: 18px;
}
.change-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1px;
  margin: 0 0 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.change-summary div {
  padding: 18px;
  background: var(--color-surface);
}
.change-summary dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
}
.change-summary dd {
  margin: 8px 0 0;
  line-height: var(--line-height-body);
}
.address-list,
.schedule-list,
.record-list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.address-list li,
.schedule-list li,
.record-list li {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.address-list h3 {
  font-size: var(--font-section-title);
}
.address-list__heading span:not(.status),
.address-list p,
.schedule-list li > div > span,
.record-list li > span {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
.address-list p {
  margin: 16px 0;
}
.address-list dl {
  display: flex;
  gap: 28px;
  margin: 0;
}
.address-list dt {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.address-list dd {
  margin: 5px 0 0;
  font-weight: 800;
}
.address-form {
  display: grid;
  gap: 18px;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}
.address-form__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.address-form label {
  display: grid;
  gap: 7px;
  min-width: 0;
  font-size: var(--font-body);
  font-weight: 800;
}
.address-form label small {
  color: var(--color-text-muted);
  font-weight: 400;
}
.address-form input,
.address-form select,
.address-form textarea {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.address-form textarea {
  resize: vertical;
}
.address-form__wide {
  grid-column: 1 / -1;
}
.form-error {
  margin: 0;
  padding: 12px 14px;
  border-left: 4px solid var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-weight: 700;
}
.payment-list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  border: 0;
}
.payment-list legend {
  margin-bottom: 12px;
  font-size: var(--font-item-title);
  font-weight: 800;
}
.payment-item {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}
.payment-item input {
  width: 20px;
  height: 20px;
  margin: 2px 0 0;
  accent-color: var(--color-primary);
}
.payment-item > span:nth-child(2) {
  display: grid;
  gap: 5px;
  margin-right: auto;
}
.payment-item small {
  color: var(--color-text-muted);
  font-weight: 400;
}
.schedule-list li > div,
.record-list li {
  display: grid;
  gap: 6px;
}
.schedule-list li > div {
  min-width: 0;
}
.record-list li > .status {
  align-self: start;
}
@media (max-width: 768px) {
  .management-page {
    padding: 28px var(--page-padding-mobile) 96px;
  }
  .change-summary {
    grid-template-columns: 1fr;
  }
  .address-form__fields {
    grid-template-columns: 1fr;
  }
  .address-form__wide {
    grid-column: auto;
  }
}
@media (max-width: 560px) {
  .management-page__header,
  .section-heading,
  .address-list__heading,
  .payment-item,
  .schedule-list li,
  .record-list li {
    flex-direction: column;
  }
  .management-page__header .button,
  .section-heading .button,
  .address-form .button {
    width: 100%;
  }
  .address-list dl {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .payment-item > span:nth-child(2) {
    margin-right: 0;
  }
  .schedule-list .status,
  .record-list .status {
    align-self: flex-start;
  }
}
</style>
