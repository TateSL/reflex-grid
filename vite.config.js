import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza automáticamente al detectar cambios
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Reflex Grid Game',
        short_name: 'ReflexGrid',
        description: 'Juego de reflejos interactivo en cuadrícula 4x4',
        theme_color: '#0f172a', // Color de fondo de la barra del sistema (slate-900)
        background_color: '#0f172a',
        display: 'standalone', // Hace que se abra a pantalla completa sin barra del navegador
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Necesario para exponer en red local
    allowedHosts: true
  }
})