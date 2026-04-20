import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue(), tailwindcss()],

  // Tell Vite the storefront app lives in apps/storefront/
  // This is where it looks for index.html and resolves /src/... imports
  root: path.resolve(__dirname, 'apps/storefront'),

  // Store cache outside of apps/storefront/node_modules (avoids permission issues)
  cacheDir: path.resolve(__dirname, '.vite-cache'),

  resolve: {
    alias: {
      '@storefront-ui/vue': path.resolve(__dirname, 'node_modules/@storefront-ui/vue'),
      '@storefront-ui/typography': path.resolve(__dirname, 'node_modules/@storefront-ui/typography'),
    },
  },

  server: {
    // Allow dev server to serve files from the monorepo root
    fs: {
      allow: [__dirname],
    },
    // Proxy /api calls to the Express middleware running on port 3000
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
