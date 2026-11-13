import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // `admin/.next` holds generated Next.js artifacts; the learner app must not
      // watch or serve them, otherwise every admin build triggers a full reload
      // from paths like admin/.next/server/app/*.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : { ignored: ['**/admin/.next/**', '**/admin/dist/**', '**/dist/**', '**/.git/**'] },
    },
  };
});
