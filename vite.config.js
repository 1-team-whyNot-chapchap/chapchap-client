import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gatewayTarget = env.VITE_LOCAL_GATEWAY_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],
    server: {
      host: true,
      allowedHosts: env.VITE_DEV_ALLOWED_HOST ? [env.VITE_DEV_ALLOWED_HOST] : [],
      proxy: {
        '/api': {
          target: gatewayTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (request) => request.setHeader('origin', 'http://localhost:5173'))
          },
        },
      },
    },
  }
})
