import { reactive } from 'vue'
import http, { authSession } from '../../../common/api/http.js'
import { customerApi } from '../api/customerApi.js'
import { createNotificationStream } from './notificationStream.js'
import { createNotificationCenter } from './notificationCenter.js'

export const notificationState = reactive({
  owner: null,
  rows: [],
  connection: 'closed',
  error: '',
  loading: false,
  busy: false,
  latest: null,
})
export const notifications = createNotificationCenter({
  state: notificationState,
  api: customerApi,
  createStream: (callbacks) =>
    createNotificationStream({
      ...callbacks,
      open: async (signal) => {
        await authSession.ensureSession()
        return http.get('/api/customer/notifications/stream', {
          adapter: 'fetch',
          responseType: 'stream',
          timeout: 0,
          signal,
        })
      },
    }),
})
