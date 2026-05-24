import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path для GitHub Pages. У dev — '/', у prod — '/<repo>/' через env.
// При деплої: `cross-env VITE_BASE_PATH=/calc-illusions/ vite build`.
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  // publicDir вказує на КОРЕНЕВИЙ public/ репо (не web/public/), щоб JSON-дані,
  // згенеровані `Rscript prep/build.R` чи `node scripts/generate-mock-data.mjs`,
  // потрапляли у dist/ без копіювання.
  publicDir: '../public',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: '127.0.0.1'
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true
  }
});
