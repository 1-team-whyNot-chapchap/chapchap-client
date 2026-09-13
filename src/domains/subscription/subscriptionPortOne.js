let loading

function isBillingKeySdk(value) {
  return typeof value?.requestIssueBillingKey === 'function'
}

export function billingKeyFromResponse(response) {
  if (response?.code !== undefined) {
    const error = new Error(response.message || '카드 등록을 완료하지 못했습니다.')
    error.code = response.code
    throw error
  }
  if (typeof response?.billingKey !== 'string' || !response.billingKey.trim()) {
    throw new Error('카드 등록 결과를 확인할 수 없습니다.')
  }
  return response.billingKey.trim()
}

export function loadSubscriptionPortOne() {
  if (isBillingKeySdk(window.PortOne)) return Promise.resolve(window.PortOne)
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
      () => finish(new Error('카드 등록 모듈 로딩 시간이 초과되었습니다.')),
      15000,
    )
    script.onload = () =>
      finish(
        isBillingKeySdk(window.PortOne) ? null : new Error('카드 등록 모듈을 불러오지 못했습니다.'),
      )
    script.onerror = () =>
      finish(new Error('카드 등록 모듈을 불러오지 못했습니다. 네트워크를 확인해 주세요.'))
    document.head.append(script)
  }).catch((error) => {
    loading = null
    throw error
  })
  return loading
}

export async function requestCardBillingKey({ storeId, channelKey }) {
  if (!storeId || !channelKey) throw new Error('카드 등록 환경 설정을 확인해 주세요.')
  const sdk = await loadSubscriptionPortOne()
  const response = await sdk.requestIssueBillingKey({
    storeId,
    channelKey,
    billingKeyMethod: 'CARD',
  })
  return billingKeyFromResponse(response)
}
