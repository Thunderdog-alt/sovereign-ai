import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: true },
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sovereign AI',
        short_name: 'SovereignAI',
        description: 'Multiplayer AI RPG Experience',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2111/2111501.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2111/2111501.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
