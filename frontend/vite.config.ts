import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as PluginOption],
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
    // SECURITY: Disable sourcemaps in production to prevent source code exposure
    sourcemap: false,
    // Use terser for better minification and dead code elimination
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
      },
      format: {
        // Remove comments from production build
        comments: false,
      },
    },
    // Code splitting configuration for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: Core React libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk: UI component libraries
          ui: ['framer-motion', 'lucide-react'],
          // State chunk: State management and API
          state: ['zustand', 'axios'],
        },
      },
    },
    // Warn if chunks are larger than 1MB
    chunkSizeWarningLimit: 1000,
  },
});
