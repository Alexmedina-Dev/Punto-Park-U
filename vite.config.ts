import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/Logo.png'],
      srcDir: 'src',
      filename: 'pwa-sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Punto Park U',
        short_name: 'PuntoPark',
        description: 'Parqueadero Fácil y Sencillo',
        theme_color: '#7aa2f7',
        background_color: '#1a1b26',
        display: 'standalone',
        icons: [
          {
            src: '/images/Logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@punto-park-u/shared-api': path.resolve(__dirname, './packages/shared-api/dist/index.js'),
      '@punto-park-u/shared-types': path.resolve(__dirname, './packages/shared-types/dist/index.js'),
      '@punto-park-u/shared-stores': path.resolve(__dirname, './packages/shared-stores/dist/index.js'),
    },
  },
})
