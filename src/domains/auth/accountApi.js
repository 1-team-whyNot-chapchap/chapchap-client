export function validateProfileImage(file) {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw new Error('5MB 이하의 비어 있지 않은 사진을 선택해 주세요.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('JPEG, PNG, WebP 사진만 사용할 수 있습니다.')
}

export function createAccountApi(http) {
  const root = '/api/auth/users/me'
  const unwrap = (response) => {
    if (response.data?.code !== '00') throw new Error('처리 결과를 확인할 수 없습니다.')
    return response.data.data
  }
  const write = async (method, path, data) =>
    unwrap(
      await http.request({
        method,
        url: root + path,
        data,
        skipAuthRetry: true,
      }),
    )
  return {
    profile: async () => unwrap(await http.get(root)),
    image: async () => (await http.get(root + '/profile-image', { responseType: 'blob' })).data,
    consent: async (policyId) =>
      unwrap(await http.get(root + '/marketing-consent', { params: { policyId } })),
    uploadImage(file) {
      validateProfileImage(file)
      const data = new FormData()
      data.append('file', file)
      return write('post', '/profile-image', data)
    },
    deleteImage: () => write('delete', '/profile-image'),
    saveConsent: (policyId, agreed) => write('post', '/marketing-consent', { policyId, agreed }),
    withdraw(confirmed) {
      if (confirmed !== true) throw new Error('탈퇴 안내를 확인해 주세요.')
      return write('delete', '', { confirmed: true })
    },
  }
}
