import { defineConfig } from 'wxt';
import path from 'path';
import { mergeConfig } from 'vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    permissions: ['sidePanel', 'tabs', 'activeTab', 'scripting', 'debugger'],
    host_permissions: [
      '*://*.instagram.com/*',
      '*://*.tiktok.com/*',
      'https://www.tiktok.com/tiktokstudio/api/*',
      'https://www.tiktok.com/api/*'
    ]
  },
  vite: (inlineConfig) => {
    return mergeConfig(inlineConfig, {
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
        },
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
