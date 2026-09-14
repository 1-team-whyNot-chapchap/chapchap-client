export function createAdminAccountApi(http) {
  const unwrap = (response) => {
    if (response.data?.code !== '00') throw new Error('서버 처리 결과를 확인할 수 없습니다.')
    return response.data.data
  }
  return {
    list: async (params) => unwrap(await http.get('/api/auth/admin/accounts', { params })),
    overview: async (days) =>
      unwrap(await http.get('/api/auth/admin/overview', { params: { days } })),
    create: async (data) =>
      unwrap(await http.post('/api/auth/admin/accounts', data, { skipAuthRetry: true })),
    action: async (id, action, data = {}) => {
      if (
        !Number.isSafeInteger(Number(id)) ||
        Number(id) < 1 ||
        !['disable', 'unlock', 'password-reset'].includes(action)
      )
        throw new Error('처리 대상을 확인해 주세요.')
      return unwrap(
        await http.post(`/api/auth/admin/accounts/${id}/${action}`, data, { skipAuthRetry: true }),
      )
    },
  }
}
