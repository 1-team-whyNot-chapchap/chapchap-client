import { defineStore } from 'pinia'

// 디자인 검수 전용. 파일 원문과 인증 정보는 보관하지 않습니다.
export const useInquiryPreviewStore = defineStore('inquiry-preview', {
  state: () => ({
    inquiries: [
      {
        id: 'sample-1',
        content: '구독 중 문의할 수 있는 방법을 알고 싶어요.',
        createdAt: '2026-09-09',
        status: '답변 대기',
        attachments: [],
        answer: null,
      },
    ],
  }),
  actions: {
    add(content, attachments) {
      const id = `sample-${crypto.randomUUID()}`
      this.inquiries.unshift({
        id,
        content,
        attachments,
        createdAt: new Date().toLocaleDateString('sv-SE'),
        status: '답변 대기',
        answer: null,
      })
      return id
    },
  },
})
