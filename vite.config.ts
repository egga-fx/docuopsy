import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Node-side only: a non-VITE_ prefix keeps the credential out of the bundle.
  const { OMNIROUTE_API_KEY } = loadEnv(mode, process.cwd(), '');
  const proxyHeaders: Record<string, string> = OMNIROUTE_API_KEY
    ? { Authorization: `Bearer ${OMNIROUTE_API_KEY}` }
    : {};

  return {
    plugins: [react()],
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/omniroute': {
          target: 'https://api.eggafx.space',
          changeOrigin: true,
          headers: proxyHeaders,
          rewrite: (path) => path.replace(/^\/api\/omniroute/, '/v1'),
        },
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
      minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
  };
});
