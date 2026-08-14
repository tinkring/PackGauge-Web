import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        compatibility: resolve(import.meta.dirname, 'compatibility.html'),
        safety: resolve(import.meta.dirname, 'safety.html'),
      },
    },
  },
});
