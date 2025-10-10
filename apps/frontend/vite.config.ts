import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Tailwind CSS v4: Vite 插件用于在开发时跟踪 class 变更并触发样式 HMR
    tailwind(),
  ],
  // 可选：某些文件系统/虚拟化环境下，polling 可以提高变更检测可靠性
  // server: { watch: { usePolling: true } },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
