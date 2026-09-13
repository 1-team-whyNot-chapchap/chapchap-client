// Auth's identity-verification loader and channel configuration remain independent.
let loading
export function loadBillingSdk(win = window, doc = document) {
  if (win.PortOne?.requestIssueBillingKey) return Promise.resolve(win.PortOne)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = doc.createElement('script')
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    script.async = true
    script.referrerPolicy = 'no-referrer'
    let finished = false
    const finish = (success) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      script.onload = script.onerror = null
      if (success) resolve(win.PortOne)
      else {
        script.remove()
        reject(new Error('카드 등록 화면을 불러오지 못했습니다. 다시 시도해 주세요.'))
      }
    }
    const timer = setTimeout(() => finish(false), 15000)
    script.onload = () => finish(Boolean(win.PortOne?.requestIssueBillingKey))
    script.onerror = () => finish(false)
    doc.head.append(script)
  }).catch((error) => {
    loading = null
    throw error
  })
  return loading
}

export function billingConfiguration(env = import.meta.env || {}) {
  const storeId = env.VITE_PORTONE_STORE_ID?.trim()
  const channelKey = env.VITE_PORTONE_BILLING_CHANNEL_KEY?.trim()
  if (!storeId || !channelKey)
    throw new Error('카드 등록 연결 설정을 확인 중입니다. 잠시 후 다시 이용해 주세요.')
  return { storeId, channelKey, billingKeyMethod: 'CARD' }
}

export async function issueBillingKey({
  env,
  navigatorInfo = navigator,
  loadSdk = loadBillingSdk,
} = {}) {
  // Mobile redirects need a separately approved return route and draft restoration.
  if (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigatorInfo.userAgent) ||
    (navigatorInfo.platform === 'MacIntel' && navigatorInfo.maxTouchPoints > 1)
  )
    throw new Error('현재 카드 등록은 PC 브라우저에서 이용해 주세요. 모바일 연결은 준비 중입니다.')
  const request = billingConfiguration(env)
  const sdk = await loadSdk()
  let response
  try {
    response = await sdk.requestIssueBillingKey({
      ...request,
      windowType: { pc: 'IFRAME' },
    })
  } catch {
    // Do not propagate provider payloads that may contain sensitive data.
    throw new Error('카드 발급을 완료하지 못했습니다. 기존 결제수단은 변경되지 않았습니다.')
  }
  if (!response || response.code) {
    throw new Error('카드 등록이 취소되었거나 발급되지 않았습니다. 기존 결제수단은 유지됩니다.')
  }
  if (
    typeof response.billingKey !== 'string' ||
    !response.billingKey.trim() ||
    response.billingKey === 'NEEDS_CONFIRMATION'
  )
    throw new Error('카드 발급 결과를 확인할 수 없습니다. 등록을 완료하지 않았습니다.')
  return response.billingKey
}
