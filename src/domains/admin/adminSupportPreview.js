// Fictional examples for layout; no customer data or network operations.
export const consultations = [
  {
    id: 'sample-chat-1',
    title: '배송 시간 문의',
    customer: '고객 1',
    createdAt: '2026-09-09 09:00',
    status: 'WAITING_ADMIN',
  },
  {
    id: 'sample-chat-2',
    title: '구독 일정 문의',
    customer: '고객 2',
    createdAt: '2026-09-09 09:15',
    status: 'WAITING_ADMIN',
  },
]
export const inquiries = [
  {
    id: 'sample-inquiry-1',
    title: '배송 상태 확인 요청',
    body: '배송 상태와 안내 내용이 달라 확인을 부탁드립니다. 이 문장은 디자인 검수용 예시입니다.',
    status: 'IN_PROGRESS',
    category: 'OTHER',
    priority: '일반',
    date: '2026-09-09',
    attachment: 'sample-photo.jpg · 240KB (메타데이터 예시)',
  },
  {
    id: 'sample-inquiry-2',
    title: '구독 안내 문구 문의',
    body: '구독 일정 설명을 확인하고 싶습니다.',
    status: 'RECEIVED',
    category: 'OTHER',
    priority: '일반',
    date: '2026-09-08',
    attachment: '',
  },
]
export const inquiryLabels = {
  RECEIVED: '접수',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결',
  CLOSED: '종료',
}
export const inquiryNext = { RECEIVED: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED' }
export const publicFaqs = [
  {
    id: 'sample-faq-1',
    category: '배송',
    question: '배송 요청 사항은 어디에서 확인하나요?',
    answer:
      '배송지 관리에서 등록한 요청 사항을 확인할 수 있습니다. 실제 정책 문구는 운영 전 확정합니다.',
    displayOrder: 0,
    published: true,
  },
  {
    id: 'sample-faq-2',
    category: '구독',
    question: '주문 일정은 어디에서 볼 수 있나요?',
    answer: '내 구독의 주문 일정에서 날짜별 주문을 확인할 수 있습니다.',
    displayOrder: 1,
    published: true,
  },
]
export const auditRows = {
  '인증·권한': [
    {
      id: 'sample-auth-log-1',
      at: '2026-09-09 09:00',
      action: '역할 변경 이력 예시',
      target: '계정',
      actor: '관리자',
      result: '기록',
      detail: '실제 계정이나 권한 변경은 실행하지 않았습니다.',
    },
  ],
  고객지원: [
    {
      id: 'sample-support-log-1',
      at: '2026-09-09 09:10',
      action: '문의 처리 이력 예시',
      target: 'sample-inquiry-1',
      actor: '관리자',
      result: '기록',
      detail:
        '문의의 처리 작업을 나타내는 화면 예시입니다. 상담·첨부 원문은 기록에 표시하지 않습니다.',
    },
  ],
  배송: [
    {
      id: 'sample-delivery-log-1',
      at: '2026-09-09 09:20',
      action: '배정 검토 이력 예시',
      target: 'sample-group-1',
      actor: '관리자',
      result: '기록',
      detail: '배송 서비스 기록만 표시합니다. 다른 서비스 기록과 정렬·페이지를 합치지 않습니다.',
    },
  ],
}
