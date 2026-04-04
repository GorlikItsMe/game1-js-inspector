import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/game1-js-inspector/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
