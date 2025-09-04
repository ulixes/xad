import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Task Manager',
    description: 'A task management extension with side panel',
    permissions: ['sidePanel', 'storage', 'identity', 'tabs', 'activeTab', 'webRequest', 'debugger'],
    host_permissions: ['https://x.com/*', 'https://auth.privy.io/*'],
    content_security_policy: {
      extension_pages: "script-src 'self' http://localhost:3000; object-src 'self'; frame-ancestors 'none';",
      sandbox: "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';"
    },
    externally_connectable: {
      matches: ['http://localhost:5173/*'],
    },
    action: {
      default_title: 'Open Task Manager',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
});