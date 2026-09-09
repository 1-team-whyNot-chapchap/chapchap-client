<script setup>
import { computed } from 'vue'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'

const props = defineProps({
  documentType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])

const documents = {
  terms: {
    kicker: 'TERMS OF SERVICE',
    title: '이용약관',
    description: '챱챱 서비스 이용 조건과 회원의 권리·의무를 안내합니다.',
    sections: [
      [
        '서비스 이용',
        '구독 신청, 메뉴 선택, 배송 일정 변경과 관련된 기본 이용 조건이 이곳에 표시됩니다.',
      ],
      [
        '결제와 해지',
        '플랜 가격과 배송비는 결제 전 안내하며, 해지는 다음 정기결제부터 적용됩니다.',
      ],
      ['정식 약관 안내', '법률 검토가 완료된 최종 약관과 시행일은 서비스 오픈 전에 반영됩니다.'],
    ],
  },
  privacy: {
    kicker: 'PRIVACY POLICY',
    title: '개인정보처리방침',
    description: '서비스 제공을 위해 처리하는 개인정보의 범위와 보호 기준을 안내합니다.',
    sections: [
      [
        '수집 항목',
        '회원 정보, 배송지, 주문·결제 식별 정보 등 서비스 제공에 필요한 항목을 처리합니다.',
      ],
      ['이용 목적', '구독 관리, 배송, 결제 확인, 고객 상담과 서비스 개선을 위해 사용합니다.'],
      [
        '정식 방침 안내',
        '보유 기간과 위탁사 정보가 포함된 최종 방침은 서비스 오픈 전에 반영됩니다.',
      ],
    ],
  },
  location: {
    kicker: 'LOCATION TERMS',
    title: '위치기반서비스 이용약관',
    description: '위치정보를 사용하는 기능의 제공 범위와 이용 조건을 안내합니다.',
    sections: [
      ['현재 적용 범위', '현재 프로토타입은 실시간 위치정보를 수집하거나 사용하지 않습니다.'],
      ['도입 여부', '배송 위치 확인 등 위치기반 기능을 도입할 경우 별도 동의와 약관을 제공합니다.'],
      ['정식 약관 안내', '위치기반 기능을 사용하지 않기로 결정하면 푸터의 해당 링크를 제거합니다.'],
    ],
  },
}

// computed는 documentType이 달라질 때 해당 문서 내용을 자동으로 다시 선택하는 Vue 기능입니다.
const document = computed(() => documents[props.documentType])
</script>

<template>
  <div class="page document-page">
    <PageBackButton label="이전 화면으로" @back="emit('navigate', 'home')" />

    <header class="document-page__header">
      <h1>{{ document.title }}</h1>
      <p>{{ document.description }}</p>
      <span>시행 예정일 · 서비스 오픈일</span>
    </header>

    <section class="document-page__content">
      <article v-for="section in document.sections" :key="section[0]">
        <h2>{{ section[0] }}</h2>
        <p>{{ section[1] }}</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.document-page__header {
  max-width: 700px;
  margin-top: 38px;
}

.document-page__header h1 {
  margin-top: 8px;
  font-size: var(--font-display);
}

.document-page__header > p:not(.section-kicker) {
  margin-top: 14px;
}

.document-page__header span {
  display: block;
  margin-top: 18px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.document-page__content {
  display: grid;
  gap: 18px;
  margin-top: 42px;
}

.document-page__content article {
  padding: 25px;
}

.document-page__content h2 {
  font-size: var(--font-section-title);
}

.document-page__content p {
  margin-top: 9px;
  font-size: var(--font-body);
}
</style>
