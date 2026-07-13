import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The Electron main process loads this dev server (or the built dist/) as the renderer.
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // Resolve internal @assayer/* workspace packages to their TS SOURCE via the `source`
    // export condition — the same node10 source-resolution tsc and eslint already use. Bundling
    // the CJS `dist/` barrel makes @rollup/plugin-commonjs miss names re-exported through the deep
    // __exportStar chain (e.g. compiledTreeContract), breaking the build once the explorer route
    // pulls them into the graph. Source resolution sidesteps the CJS named-export synthesis.
    // 'import'/'require'/'default' are always applied by the resolver; these preserve vite's
    // browser defaults while adding 'source' first.
    conditions: ['source', 'module', 'browser', 'development|production'],
  },
  server: {
    port: 6273,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
