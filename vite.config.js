import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const gatewayTarget =
    env.VITE_LOCAL_GATEWAY_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],

    server: {
      host: true,

      allowedHosts: env.VITE_DEV_ALLOWED_HOST
        ? [env.VITE_DEV_ALLOWED_HOST]
        : [],

      proxy: {
        '/api': {
          target: gatewayTarget,
          changeOrigin: true,
        },

        '/ws': {
          target: gatewayTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})