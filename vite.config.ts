import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@punto-park-u/shared-api': path.resolve(__dirname, './packages/shared-api/dist/index.js'),
      '@punto-park-u/shared-types': path.resolve(__dirname, './packages/shared-types/dist/index.js'),
      '@punto-park-u/shared-stores': path.resolve(__dirname, './packages/shared-stores/dist/index.js'),
    },
  },
})
