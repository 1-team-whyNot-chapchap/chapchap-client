import { watch } from 'vue'
import { billingUserId } from './mobileBillingContext.js'

export function paymentMethodState() {
  return { cards: [], loading: false, busy: false, loaded: false, error: '', notice: '' }
}

export function paymentMethodsReady(state) {
  return (
    state.loaded &&
    !state.loading &&
    !state.busy &&
    !state.error &&
    state.cards.filter((card) => card.isDefault).length === 1
  )
}

export function paymentMethodError(error, action) {
  const code = error?.code || error?.response?.data?.code
  const status = error?.status || error?.response?.status
  if (status === 401 || code === 'AUTH_001') return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (code === 'PAYMENT_006')
    return '이용 중인 구독의 현재 결제수단은 삭제할 수 없습니다. 다른 카드를 현재 결제수단으로 먼저 선택해 주세요.'
  if (code === 'PAYMENT_005') return '사용할 수 없는 카드입니다. 목록을 다시 확인해 주세요.'
  if (code === 'PAYMENT_004')
    return '다른 등록 요청과 겹쳤습니다. 목록을 확인한 후 다시 진행해 주세요.'
  if (code === 'PAYMENT_001') return '등록할 수 없는 카드입니다. 다른 카드로 등록해 주세요.'
  if (code === 'PAYMENT_002' || code === 'PAYMENT_003')
    return '결제사 연결 또는 카드 검증에 실패했습니다. 잠시 후 목록을 확인해 주세요.'
  return `${action} 결과를 확인하지 못했습니다. 자동으로 다시 요청하지 않습니다. 목록을 다시 확인해 주세요.`
}

// State contains only display data; billing keys stay within the single registration call.
export function createPaymentMethodManager({
  api,
  issue,
  state,
  getOwner,
  onOwnerChange = () => {},
}) {
  let generation = 0
  let ownerGeneration = 0
  let disposed = false
  const ownerId = () => billingUserId(getOwner())
  const active = (version = ownerGeneration) =>
    !disposed && Boolean(ownerId()) && version === ownerGeneration
  // Observe the ID synchronously: A -> logout/B -> A must still invalidate A's old requests.
  const stopOwnerWatch = watch(
    ownerId,
    () => {
      ownerGeneration++
      generation++
      Object.assign(state, paymentMethodState())
      onOwnerChange()
      if (active()) void load()
    },
    { flush: 'sync' },
  )

  async function refresh() {
    if (!active()) return false
    const request = ++generation
    state.loading = true
    state.loaded = false
    state.cards = []
    try {
      const cards = await api.paymentMethods()
      if (!active() || generation !== request) return false
      state.cards = cards
      state.loaded = true
      return true
    } catch {
      if (active() && generation === request)
        state.error = '결제수단 목록을 불러오지 못했습니다. 목록을 다시 확인해 주세요.'
      return false
    } finally {
      if (active() && generation === request) state.loading = false
    }
  }

  async function load() {
    if (state.busy || state.loading || !active()) return false
    state.error = ''
    return refresh()
  }

  async function change(action, operation) {
    if (state.busy || state.loading || !state.loaded || !active()) return false
    const version = ownerGeneration
    const stillActive = () => active(version)
    state.busy = true
    state.error = ''
    state.notice = ''
    let sent = false
    try {
      const result = await operation(() => {
        sent = true
      }, stillActive)
      if (!stillActive()) return false
      state.notice =
        action === '카드 등록'
          ? result.isCurrent
            ? '카드가 등록되어 현재 결제수단으로 선택되었습니다.'
            : '카드가 추가 등록되었습니다. 사용할 카드를 변경하려면 현재 결제수단으로 선택해 주세요.'
          : action === '카드 삭제'
            ? '카드 삭제가 완료되었습니다.'
            : '현재 결제수단 변경이 완료되었습니다.'
      await refresh()
      return stillActive()
    } catch (error) {
      if (!stillActive()) return false
      const message = sent ? paymentMethodError(error, action) : error.message
      // A timed-out write may have completed. Never retry it; read back instead.
      if (sent) await refresh()
      if (!stillActive()) return false
      state.error = message
      return false
    } finally {
      if (stillActive()) state.busy = false
    }
  }

  return {
    load,
    register: () =>
      change('카드 등록', async (sent, stillActive) => {
        let key = await issue(stillActive)
        try {
          if (!stillActive()) throw new Error('로그인 상태가 변경되었습니다. 다시 진행해 주세요.')
          sent()
          return await api.registerPaymentMethod(key)
        } finally {
          key = null
        }
      }),
    select: (card) =>
      change('현재 결제수단 변경', async (sent) => {
        sent()
        return api.defaultPaymentMethod(card.id)
      }),
    remove: (card) =>
      change('카드 삭제', async (sent) => {
        sent()
        return api.deletePaymentMethod(card.id)
      }),
    async verifyCurrent() {
      if (!paymentMethodsReady(state) || !active()) return false
      const version = ownerGeneration
      const previous = state.cards.find((card) => card.isDefault).id
      state.error = ''
      if (!(await refresh())) return false
      if (!active(version)) return false
      if (
        !paymentMethodsReady(state) ||
        state.cards.find((card) => card.isDefault).id !== previous
      ) {
        state.error = '현재 결제수단이 변경되었습니다. 사용할 카드를 확인한 뒤 다시 결제해 주세요.'
        return false
      }
      return true
    },
    dispose() {
      disposed = true
      stopOwnerWatch()
      ownerGeneration++
      generation++
      Object.assign(state, paymentMethodState())
    },
  }
}
