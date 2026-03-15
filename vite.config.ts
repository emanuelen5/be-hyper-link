import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => readJsonFile('manifest.json'),
      // Additional static assets (icons) are in public/
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
