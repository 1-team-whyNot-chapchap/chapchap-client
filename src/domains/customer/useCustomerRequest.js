import { ref } from 'vue'

export function useCustomerRequest() {
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')
  async function run(action) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      return await action()
    } catch (failure) {
      const status = failure.response?.status
      error.value =
        status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : status === 403
            ? '이 작업을 수행할 권한이 없습니다.'
            : status === 404
              ? '항목을 찾을 수 없거나 접근할 수 없습니다.'
              : status === 409
                ? '상태가 변경되었습니다. 새로고침 후 다시 확인해 주세요.'
                : status === 400
                  ? '입력한 내용과 첨부 파일을 확인해 주세요.'
                  : '요청을 완료하지 못했습니다. 조회로 결과를 확인한 뒤 다시 시도해 주세요.'
    } finally {
      busy.value = false
    }
  }
  return { busy, error, notice, run }
}
