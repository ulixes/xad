import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    permissions: ['sidePanel', 'tabs', 'debugger']
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
