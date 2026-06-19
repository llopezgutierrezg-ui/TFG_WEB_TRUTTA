import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // '/' for local dev; the GitHub Pages build sets VITE_BASE=/TFG_WEB_TRUTTA/
  base: process.env.VITE_BASE || '/',
  publicDir: 'public',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
