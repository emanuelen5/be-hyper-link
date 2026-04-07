import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
import pkg from './package.json';

const browser = process.env.BROWSER ?? 'firefox';
const manifestFile =
  browser === 'chrome' ? 'manifest.chrome.json' : 'manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest: () => {
        const manifest = readJsonFile(manifestFile);
        manifest.version = pkg.version;
        return manifest;
      },
      additionalInputs: ['src/release-notes/release-notes.html'],
      // Additional static assets (icons) are in assets/
    }),
  ],
  publicDir: 'assets',
  build: {
    outDir: `dist-${browser}`,
    emptyOutDir: true,
    sourcemap: mode === 'development' ? 'inline' : false,
  },
}));
