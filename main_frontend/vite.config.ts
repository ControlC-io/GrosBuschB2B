import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: 'http://backend_api:3000',
          changeOrigin: true,
        },
        // Proxy for external accounting / tickets API to avoid CORS in the browser.
        '/external-api': {
          target: env.VITE_API_BASE_URL || 'http://152.228.162.63:3234',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/external-api/, ''),
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
    },
  };
});
