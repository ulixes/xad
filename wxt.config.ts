import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Task Manager',
    description: 'A task management extension with side panel',
    permissions: ['sidePanel', 'storage'],
    // Allow external web app to communicate with extension
    externally_connectable: {
      matches: [
        'http://localhost:5173/*',
        'http://localhost:*/*',  // Allow any localhost port
        // Add your production domain when ready:
        // 'https://your-web-app-domain.com/*'
      ],
    },
    // Configure action to open side panel (no popup)
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
    // Firefox uses sidebar_action instead of side_panel
    sidebar_action: {
      default_panel: 'sidepanel.html',
      default_title: 'Task Manager',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
  },
});
