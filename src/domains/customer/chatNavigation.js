// Exact pairs shared with Customer-Ai's approved navigation catalog.
// Never turn arbitrary model/user content into HTML or navigable URLs.
export const chatPages = Object.freeze({
  '/mypage/addresses': '배송지 관리 보기',
  '/mypage/payment-methods': '결제수단 관리 보기',
  '/mypage/profile': '내 정보 보기',
  '/plans': '구독 상품 보기',
  '/subscription': '내 구독 보기',
  '/mypage/payments': '결제 내역 보기',
  '/mypage/deliveries': '배송 내역 보기',
})

export function chatMessageParts(message) {
  const text = typeof message?.content === 'string' ? message.content : ''
  if (message?.senderType !== 'AI') return { text, page: null }
  // The server appends one exact catalog link at the end of its answer.
  const match = /\n\n\[([^\]\n]+)\]\((\/[^\s)]+)\)$/.exec(text)
  if (!match || chatPages[match[2]] !== match[1]) return { text, page: null }
  return { text: text.slice(0, match.index), page: { path: match[2], label: match[1] } }
}
