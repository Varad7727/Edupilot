import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/courses': 'http://localhost:3000',
      '/subjects': 'http://localhost:3000',
      '/teachers': 'http://localhost:3000',
      '/students': 'http://localhost:3000',
    },
  },
});
