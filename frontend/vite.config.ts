import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    allowedHosts: [
      'localhost',
      'host.docker.internal',
      '39374ea28c11.ngrok-free.app',
      '3c86a9a49011.ngrok-free.app',
      '67390783526d.ngrok-free.app',
      '7a10099334c1.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok-free.app subdomains
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});