import { defineConfig } from 'wxt';
import path from 'node:path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: [
      'sidePanel', 
      'activeTab', 
      'storage',
      'debugger',
      'tabs',
      'webRequest'
    ],
    action: {
      default_title: 'Open Microtask Side Panel',
    },
    host_permissions: [
      "https://auth.privy.io/*",
      "https://www.googletagmanager.com/*",
      "https://embed-wallet.privy.io/*",
      "https://x.com/*",
      "https://twitter.com/*"
    ]
  },
  vite: () => ({
    resolve: {
      alias: {
        '@/lib/utils': path.resolve(__dirname, '../../packages/ui/src/lib/utils.ts'),
        '@/components': path.resolve(__dirname, '../../packages/ui/src/components'),
        '@': path.resolve(__dirname, '../../packages/ui/src'),
        buffer: 'buffer',
      },
    },
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'buffer'],
    },
    server: {
      fs: {
        allow: [
          path.resolve(__dirname, '../..'),
        ],
      },
    },
  }),
});
