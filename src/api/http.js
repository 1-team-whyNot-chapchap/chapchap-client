import axios from 'axios'

// 실제 백엔드가 연결되면 이 인스턴스에 인증 헤더와 오류 처리 규칙을 추가한다.
export const http = axios.create({
  baseURL: '/api',
})
