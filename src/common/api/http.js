import axios from 'axios'
import { createAuthSession } from '../../domains/auth/authSession.js'

const options = {
  timeout: 10000,
  withCredentials: true,
}

const http = axios.create(options)

export const authSession = createAuthSession(
  http,
  axios.create(options),
)

export function socialLoginUrl(provider) {
  if (!['kakao', 'google'].includes(provider)) {
    throw new Error('지원하지 않는 로그인입니다.')
  }

  return `/api/auth/oauth2/authorization/${provider}`
}

export default http