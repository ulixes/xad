import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    permissions: ['sidePanel', 'tabs', 'debugger', 'storage', 'downloads'],
    host_permissions: [
      '*://*.tiktok.com/*',
      'https://www.tiktok.com/tiktokstudio/api/*',
      'https://www.tiktok.com/api/*',
      '*://*.instagram.com/*',
      '*://*.twitter.com/*',
      '*://*.x.com/*',
      '*://*.reddit.com/*'
    ]
  },
  vite: () => ({
    css: {
      postcss: './postcss.config.js'
    },
    optimizeDeps: {
      include: ['@xad/ui'],
      exclude: ['@xad/ui/src']
    },
    server: {
      fs: {
        allow: ['..']
      }
    }
  })
});