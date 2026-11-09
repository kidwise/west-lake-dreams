import { defineConfig } from 'vite';

// `base: './'` keeps every asset path relative, so the same build works when
// hosted under any URL path, opened from a mobile app wrapper (Capacitor),
// or packaged into a desktop shell.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: true,
  },
});
