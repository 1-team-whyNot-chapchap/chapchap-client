// Deliberately fictional, non-persistent design fixtures; never API payloads.
import { defineStore } from 'pinia'
import { ref } from 'vue'
export const groups = [
  {
    id: 'sample-group-1',
    date: '2026-09-09',
    slot: '점심',
    area: '서초 1권역',
    status: '확인 대기',
    count: 2,
    riderId: 'sample-rider-1',
    rider: '라이더 1',
  },
  {
    id: 'sample-group-2',
    date: '2026-09-09',
    slot: '저녁',
    area: '강남 2권역',
    status: '배정 전',
    count: 0,
    riderId: null,
    rider: '미배정',
  },
  {
    id: 'sample-group-3',
    date: '2026-09-10',
    slot: '점심',
    area: '서초 1권역',
    status: '최종 확정',
    count: 1,
    riderId: 'sample-rider-1',
    rider: '라이더 1',
  },
]
export const deliveries = [
  {
    id: 'sample-delivery-1',
    groupId: 'sample-group-1',
    recipient: '수령인 1',
    address: '서울 서초구 예시로 10 · 예시 건물',
    status: '배송 준비',
    method: '비대면',
    note: '문 앞에 놓아 주세요.',
    time: '11:30~12:30',
    count: 2,
  },
  {
    id: 'sample-delivery-2',
    groupId: 'sample-group-1',
    recipient: '수령인 2',
    address: '서울 서초구 예시길 20 · 예시 사무실',
    status: '배송 실패',
    method: '직접 전달',
    note: '연락 후 전달해 주세요.',
    time: '11:30~12:30',
    count: 1,
  },
  {
    id: 'sample-delivery-3',
    groupId: 'sample-group-3',
    recipient: '수령인 3',
    address: '서울 서초구 예시로 30',
    status: '배송 완료',
    method: '비대면',
    note: '문 앞 전달',
    time: '11:30~12:30',
    count: 1,
  },
]
export const useAdminDeliveryPreviewStore = defineStore('admin-delivery-preview', () => {
  const riderContext = ref(null)
  function selectRider(group) {
    riderContext.value = { id: group.riderId, name: group.rider, groupId: group.id }
  }
  return { riderContext, selectRider }
})
