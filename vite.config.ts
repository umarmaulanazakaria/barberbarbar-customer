import { defineConfig,loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: { '/socket.io': { target: loadEnv(mode,'.','BARBER_').BARBER_API_PROXY_TARGET || 'http://127.0.0.1:3000', ws: true }, '/api': { target: loadEnv(mode,'.','BARBER_').BARBER_API_PROXY_TARGET || 'http://127.0.0.1:3000', rewrite: path => path.replace(/^\/api/, '') } },
  },
  preview: { port: 4175, strictPort: true },
}));
