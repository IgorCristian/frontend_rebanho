import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 3100, // 3000 fica para o AleEdu: os dois podem rodar ao mesmo tempo
    strictPort: true,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // mostra o aviso de "Nova versão" (ReloadPrompt)
      includeAssets: ['favicon.ico', 'logo_256.png', 'logo_512.png'],
      manifest: {
        name: 'AleEdu Rebanho',
        short_name: 'Rebanho',
        start_url: '/',
        display: 'standalone',
        background_color: '#050D21',
        theme_color: '#050D21',
        orientation: 'portrait',
        icons: [
          { src: '/logo_256.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo_512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Só guarda os arquivos do app (para abrir rápido e instalar). Os DADOS sempre vêm da API:
        // não há modo offline por enquanto (decisão do PROJETO.md).
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
