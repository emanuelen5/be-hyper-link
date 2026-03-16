import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';

const browser = process.env.BROWSER ?? 'firefox';
const manifestFile =
  browser === 'chrome' ? 'manifest.chrome.json' : 'manifest.json';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => readJsonFile(manifestFile),
      // Additional static assets (icons) are in public/
    }),
  ],
  build: {
    outDir: `dist-${browser}`,
    emptyOutDir: true,
  },
});
