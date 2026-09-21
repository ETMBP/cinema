import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-only: the browser talks to Vite (one origin), Vite forwards /api
    // to the express server. No CORS anywhere. In production the k8s ingress
    // plays this exact role.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
