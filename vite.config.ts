import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.fastmock.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/mock/bb734d5f2483813f0f475d8f23bfb431/api/miniapp")
      }
    }
  }
})
