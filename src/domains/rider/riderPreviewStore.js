import { defineStore } from 'pinia'

export const useRiderPreviewStore = defineStore('rider-preview', {
  state: () => ({
    // 인증 연동 전 표시용 샘플이며 로그인 여부 판단에는 사용하지 않습니다.
    profile: { name: '라이더' },
    workStarted: false,
    offDayRequests: [
      {
        id: 'sample-off-1',
        date: '2026-09-18',
        slot: '종일',
        reason: '연차',
        detail: '',
        status: '신청 중',
      },
      {
        id: 'sample-off-2',
        date: '2026-09-10',
        slot: '종일',
        reason: '연차',
        detail: '',
        status: '승인',
      },
    ],
    assignment: { id: 'sample-1', date: '2026-09-09', slot: '점심', confirmed: false },
    deliveries: [
      {
        id: 'RD-240812-01',
        quantity: 2,
        recipient: '수령인 A',
        address: '대구광역시 중구 챱챱로 **',
        status: '배송 준비',
        request: '문 앞에 놓아 주세요.',
        method: '비대면 전달',
      },
      {
        id: 'RD-240812-02',
        quantity: 1,
        recipient: '수령인 B',
        address: '대구광역시 수성구 식사로 **',
        status: '배송 중',
        request: '직접 전달을 요청했어요.',
        method: '직접 전달',
      },
    ],
    schedules: [
      { date: '2026-09-09', slot: '점심', time: '11:00~13:00', label: '근무 예정' },
      { date: '2026-09-10', slot: '점심', time: '11:00~13:00', label: '근무 예정' },
      { date: '2026-09-11', slot: '저녁', time: '17:00~19:00', label: '근무 예정' },
    ],
  }),
})
