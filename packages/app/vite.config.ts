import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The Electron main process loads this dev server (or the built dist/) as the renderer.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
