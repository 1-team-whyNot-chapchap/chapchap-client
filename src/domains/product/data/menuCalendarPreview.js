import { ref } from 'vue'
import { menuItems, planLabels } from '../../../common/constants/prototypeData'

// 실제 날짜별 편성 API가 연결되기 전의 고정 샘플입니다.
export const menuCalendarPreview = [
  { menuId: 'menu-03', planId: 'healthy' },
  { menuId: 'menu-01', planId: 'nutrition' },
  { menuId: 'menu-02', planId: 'hearty' },
].map(({ menuId, planId }) => ({
  planId,
  planLabel: planLabels[planId],
  menu: menuItems.find((menu) => menu.id === menuId),
}))

export const previewMenuDate = ref(new Date())
export const selectedPreviewMenuId = ref(menuItems[0].id)
