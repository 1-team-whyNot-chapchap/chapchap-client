import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_GATEWAY_BASE_URL, timeout: 10000 })
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default http
