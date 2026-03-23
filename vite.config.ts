import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // Phase 13: Cache First for offline tile and API resilience
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'guardian-tiles-carto', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 } },
            },
            {
              urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'guardian-tiles-osm', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 } },
            },
            {
              urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
              handler: 'NetworkFirst',
              options: { cacheName: 'guardian-osrm', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 } },
            },
          ],
        },
        manifest: {
          name: 'Guardian Lebanon',
          short_name: 'Guardian',
          description: 'Safety-first navigation for Lebanon',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'https://picsum.photos/seed/guardian-192/192/192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/guardian-512/512/512',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
