let loading
export function loadPortOne() {
  if (window.PortOne?.requestIdentityVerification) return Promise.resolve(window.PortOne)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    script.async = true
    script.referrerPolicy = 'no-referrer'
    const finish = (error) => {
      clearTimeout(timer)
      script.onload = script.onerror = null
      if (error) {
        script.remove()
        reject(error)
      } else resolve(window.PortOne)
    }
    const timer = setTimeout(
      () => finish(new Error('본인인증 모듈 로딩 시간이 초과되었습니다.')),
      15000,
    )
    script.onload = () =>
      finish(
        window.PortOne?.requestIdentityVerification
          ? null
          : new Error('본인인증 모듈을 불러오지 못했습니다.'),
      )
    script.onerror = () =>
      finish(new Error('본인인증 모듈을 불러오지 못했습니다. 네트워크를 확인해 주세요.'))
    document.head.append(script)
  }).catch((error) => {
    loading = null
    throw error
  })
  return loading
}
