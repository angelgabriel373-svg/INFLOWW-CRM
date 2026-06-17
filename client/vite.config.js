import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy hacia el backend (puerto 4000) para API, uploads y websockets
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
