import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // 资源引用前缀：web 版部署在 OSS 的 my-tools/ 子路径（见 .env.web），
    // 桌面端/默认构建必须保持 /，否则 Tauri 加载不到资源
    base: env.VITE_BASE_PATH || '/',
    plugins: [tailwindcss(), react()],
    clearScreen: false,
    server: {
      watch: {
        // tauri dev 下 cargo 会锁写 src-tauri/target 内的产物，Vite 监听会 EBUSY 崩溃
        ignored: ['**/src-tauri/**'],
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      // 不用 vmThreads：jose 的 WebCrypto 在 VM 上下文中不可用，会导致 JWT 测试失败
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**'],
        exclude: [
          'src/test/**',
          '**/*.test.*',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData/**',
        ],
      },
    },
  }
})
