const POSTCODE_SCRIPT_URL = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let pendingLoader = null

function postcodeConstructor(windowRef) {
  return windowRef.kakao?.Postcode || windowRef.daum?.Postcode || null
}

export function toRoadAddressSelection(data) {
  const postalCode = typeof data?.zonecode === 'string' ? data.zonecode.trim() : ''
  const addressLine1 = typeof data?.roadAddress === 'string' ? data.roadAddress.trim() : ''

  if (!postalCode || !addressLine1) {
    throw new Error('도로명 주소와 우편번호를 확인할 수 없습니다. 다른 주소를 선택해 주세요.')
  }

  return { postalCode, addressLine1 }
}

export function loadKakaoPostcode({ documentRef = document, windowRef = window } = {}) {
  const available = postcodeConstructor(windowRef)
  if (available) return Promise.resolve(available)
  if (pendingLoader) return pendingLoader

  pendingLoader = new Promise((resolve, reject) => {
    const resolvePostcode = () => {
      const Postcode = postcodeConstructor(windowRef)
      if (!Postcode) {
        reject(new Error('카카오 주소 검색을 초기화하지 못했습니다.'))
        return
      }
      resolve(Postcode)
    }
    const rejectPostcode = () => reject(new Error('카카오 주소 검색을 불러오지 못했습니다.'))
    const existing = documentRef.querySelector('script[data-kakao-postcode-sdk]')

    if (existing) {
      existing.addEventListener('load', resolvePostcode, { once: true })
      existing.addEventListener('error', rejectPostcode, { once: true })
      return
    }

    const script = documentRef.createElement('script')
    script.dataset.kakaoPostcodeSdk = 'true'
    script.src = POSTCODE_SCRIPT_URL
    script.async = true
    script.onload = resolvePostcode
    script.onerror = rejectPostcode
    documentRef.head.append(script)
  }).finally(() => {
    pendingLoader = null
  })

  return pendingLoader
}
