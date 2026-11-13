import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Standalone Admin Console app. Root = this `admin/` folder, runs on :5000.
// The `@` alias points at the repo root so admin code can import the shared
// modules under `src/` (types, ThemeContext, data, supabaseClient).
export default defineConfig(() => {
  return {
    root: import.meta.dirname,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '..'),
      },
    },
    server: {
      port: 5000,
      strictPort: false,
      // The learner console already owns Vite's default HMR port (24678), so the
      // admin console needs its own when both run side by side.
      hmr: process.env.DISABLE_HMR !== 'true' ? { port: 24679 } : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
