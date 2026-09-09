import test from 'node:test'
import assert from 'node:assert/strict'
import { createStompDecoder, createConsultationConnection } from './consultationConnection.js'
import { createSseDecoder, createNotificationStream } from './notificationStream.js'
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('STOMP decoder handles fragmented messages, heartbeats and Korean JSON', () => {
  const frames = []
  const parse = createStompDecoder((frame) => frames.push(frame))
  parse(
    '\nCONNECTED\nversion:1.2\n\n\0MESSAGE\ndestination:/topic/consultations/1\n\n{"content":"안',
  )
  parse('녕하세요"}\0\n')
  assert.equal(frames.length, 2)
  assert.equal(JSON.parse(frames[1].body).content, '안녕하세요')
})

test('WebSocket consumes ticket, subscribes only selected conversation and never replays writes', async () => {
  const sockets = [],
    jobs = [],
    states = []
  let tickets = 0
  const client = createConsultationConnection({
    consultationId: '4',
    url: 'ws://127.0.0.1/ws/customer/consultations',
    ticket: async () => {
      tickets++
      return 'a'.repeat(43)
    },
    onState: (s) => states.push(s),
    onMessage: () => {},
    schedule: (fn, ms) => {
      const job = { fn, ms, active: true }
      jobs.push(job)
      return job
    },
    cancel: (job) => {
      if (job) job.active = false
    },
    connectSocket: (url, protocols) => {
      const socket = {
        url,
        protocols,
        readyState: 1,
        sent: [],
        send(value) {
          this.sent.push(value)
        },
        close() {
          this.readyState = 3
          this.onclose?.()
        },
      }
      sockets.push(socket)
      return socket
    },
  })
  client.start()
  await tick()
  const first = sockets[0]
  assert.deepEqual(first.protocols, ['v12.stomp', `ticket.${'a'.repeat(43)}`])
  assert.ok(!first.url.includes('?'))
  first.onopen()
  first.onmessage({ data: 'CONNECTED\nversion:1.2\n\n\0' })
  assert.ok(first.sent[1].includes('/topic/consultations/4'))
  client.send('내용')
  assert.ok(first.sent[2].startsWith('SEND\n'))
  first.close()
  assert.throws(() => client.send('다시'))
  jobs.find((job) => job.active).fn()
  await tick()
  assert.equal(tickets, 2)
  assert.equal(sockets[1].sent.length, 0)
  client.stop()
  assert.equal(states.at(-1), 'closed')
  assert.equal(sockets[1].readyState, 3)
})

test('stopping while ticket is pending prevents a late socket from reopening', async () => {
  let finish
  let connected = 0
  const client = createConsultationConnection({
    consultationId: '1',
    url: 'ws://127.0.0.1',
    ticket: () => new Promise((resolve) => (finish = resolve)),
    onState: () => {},
    onMessage: () => {},
    connectSocket: () => connected++,
  })
  client.start()
  client.stop()
  finish('a'.repeat(43))
  await tick()
  assert.equal(connected, 0)
})

test('SSE decoder accepts fragmented CRLF events and ignores heartbeat comments', () => {
  const events = []
  const parse = createSseDecoder((type, data) => events.push([type, data]))
  parse(': heartbeat\r\n\r\nevent: notification\r\ndata: {"title":"알림"}\r')
  parse('\n\r\n')
  assert.deepEqual(events, [['notification', '{"title":"알림"}']])
})

test('SSE cancellation aborts the authenticated request without scheduling reconnect', async () => {
  let signal
  let scheduled = 0
  const client = createNotificationStream({
    open: (s) => {
      signal = s
      return new Promise((resolve, reject) =>
        s.addEventListener('abort', () => reject(new Error('abort'))),
      )
    },
    onNotification: () => {},
    onState: () => {},
    schedule: () => scheduled++,
  })
  client.start()
  client.stop()
  await tick()
  assert.equal(signal.aborted, true)
  assert.equal(scheduled, 0)
})
