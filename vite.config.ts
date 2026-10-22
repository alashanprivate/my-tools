import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
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
})
