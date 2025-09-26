import { defineConfig } from 'wxt';
import path from 'path';
import { mergeConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    icons: {
      '16': '/icon.svg',
      '32': '/icon.svg',
      '48': '/icon.svg',
      '128': '/icon.svg'
    },
    permissions: ['sidePanel', 'tabs', 'activeTab', 'scripting', 'identity'],
    host_permissions: [
      '*://*.tiktok.com/*',
      'https://www.tiktok.com/tiktokstudio/api/*',
      'https://www.tiktok.com/api/*',
      'https://api.getpara.com/*',
      'https://api.beta.getpara.com/*',
      'https://api.sandbox.getpara.com/*'
    ]
  },
  vite: (inlineConfig) => {
    return mergeConfig(inlineConfig, {
      plugins: [
        // Add polyfills for Node.js modules like Buffer and crypto
        nodePolyfills({
          // Include specific modules as needed
          include: ['buffer', 'crypto', 'stream', 'util'],
          globals: {
            Buffer: true,
            process: true
          }
        })
      ],
      css: {
        postcss: './postcss.config.js',
      },
      resolve: {
        alias: {
          // Map the package name to source for direct imports
          '@xad/ui': path.resolve(__dirname, '../../packages/ui/src'),
          // Map styles specifically  
          '@xad/ui/styles': path.resolve(__dirname, '../../packages/ui/src/styles/globals.css'),
          // Map UI package internal paths to resolve @ aliases within UI components
          '@/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
          '@/components': path.resolve(__dirname, '../../packages/ui/src/components'),
          // Add crypto fallback for browser
          'crypto': 'crypto-browserify'
        },
        // Force deduplication of React Query to prevent multiple instances
        dedupe: ['@tanstack/react-query'],
      },
      optimizeDeps: {
        include: ['@xad/ui'],
      },
      server: {
        fs: {
          // Allow serving files from parent dirs (UI package)
          allow: ['.', '..', '../..', '../../packages'],
        },
        // Enable HMR polling for external dirs if needed (fallback for file watchers)
        watch: {
          usePolling: true,  // Helps in some FS setups (e.g., Docker/WSL)
        },
      },
    });
  },
});
