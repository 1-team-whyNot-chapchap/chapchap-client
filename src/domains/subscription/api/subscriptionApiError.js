export class SubscriptionApiError extends Error {
  constructor(message, { status = null, code = '', serverMessage = '', cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'SubscriptionApiError'
    this.status = status
    this.code = code
    this.serverMessage = serverMessage
  }
}

export function unwrapSubscriptionResponse(response, fallbackMessage) {
  const payload = response?.data
  if (payload?.code !== '00' || payload.data == null) {
    throw new SubscriptionApiError(fallbackMessage, {
      status: response?.status ?? null,
      code: typeof payload?.code === 'string' ? payload.code : '',
      serverMessage: typeof payload?.message === 'string' ? payload.message : '',
    })
  }
  return payload.data
}

export function toSubscriptionApiError(error, fallbackMessage) {
  if (error instanceof SubscriptionApiError) return error
  const payload = error?.response?.data
  return new SubscriptionApiError(fallbackMessage, {
    status: error?.response?.status ?? null,
    code: typeof payload?.code === 'string' ? payload.code : '',
    serverMessage: typeof payload?.message === 'string' ? payload.message : '',
    cause: error,
  })
}
