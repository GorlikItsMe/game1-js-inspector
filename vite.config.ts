import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/gf-game1-playground/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
