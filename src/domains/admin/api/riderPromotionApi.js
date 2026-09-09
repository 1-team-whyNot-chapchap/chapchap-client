import { isValidPhone, normalizePhone } from '../riderPromotion.js'

export function createRiderPromotionApi(http) {
  const userPath = (id) => {
    if (!/^[1-9][0-9]*$/.test(String(id))) throw new Error('유효하지 않은 사용자 ID입니다.')
    return `/api/auth/admin/users/${id}`
  }
  const data = (response) => {
    if (response.data?.code !== '00' || !response.data.data)
      throw new Error('잘못된 서버 응답입니다.')
    return response.data.data
  }
  return {
    async search(phone, page = 0) {
      if (!isValidPhone(phone) || !Number.isInteger(page) || page < 0 || page > 1000000)
        throw new Error('검색 조건을 확인해 주세요.')
      return data(
        await http.post('/api/auth/admin/users/search', { phone: normalizePhone(phone), page }),
      )
    },
    async getUser(id) {
      return data(await http.get(userPath(id)))
    },
    async promote(id) {
      return data(
        await http.patch(`${userPath(id)}/role`, { targetRole: 'RIDER' }, { skipAuthRetry: true }),
      )
    },
  }
}
