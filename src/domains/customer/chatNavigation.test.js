import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chatMessageParts, chatPages } from './chatNavigation.js'

test('approved AI destinations resolve to real entry routes', () => {
  const router = readFileSync(new URL('../../router/index.js', import.meta.url), 'utf8')
  for (const [path, label] of Object.entries(chatPages)) {
    const content = `이 페이지에서 확인할 수 있어요.\n\n[${label}](${path})`
    assert.deepEqual(chatMessageParts({ senderType: 'AI', content }), {
      text: '이 페이지에서 확인할 수 있어요.',
      page: { path, label },
    })
    assert.ok(router.includes(`path: '${path}'`))
  }
})

test('untrusted links, execution pages and non-AI messages stay inert text', () => {
  for (const content of [
    '[구독 상품 보기](javascript:alert(1))',
    '안내\n\n[구독 상품 보기](https://evil.test)',
    '안내\n\n[구독 상품 보기](//evil.test)',
    '안내\n\n[구독 상품 보기](/plans?redirect=https://evil.test)',
    '안내\n\n[관리자](/admin/consultations)',
    '안내\n\n[결제하기](/subscribe/payment)',
    '안내\n\n[환불 완료](/plans)',
    '<img src=x onerror=alert(1)>',
  ])
    assert.deepEqual(chatMessageParts({ senderType: 'AI', content }), { text: content, page: null })
  for (const senderType of ['USER', 'SYSTEM', 'ADMIN']) {
    assert.equal(
      chatMessageParts({ senderType, content: '안내\n\n[구독 상품 보기](/plans)' }).page,
      null,
    )
  }
})
