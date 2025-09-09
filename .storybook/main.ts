import type { StorybookConfig } from '@storybook/react-vite';
import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: [
    // UI Package Components
    "../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../packages/ui/src/**/*.mdx",
    
    // Web App Components  
    "../apps/web/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../apps/web/src/**/*.mdx",
    
    // Extension Components (if any)
    "../apps/extension/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../apps/extension/src/**/*.mdx",
    
    // Root stories (if any)
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../stories/**/*.mdx"
  ],
  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-a11y'),
    // Note: essentials, interactions, controls, etc. are now built into core
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {}
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      css: {
        postcss: {
          plugins: [
            (await import('tailwindcss')).default,
            (await import('autoprefixer')).default,
          ],
        },
      },
      resolve: {
        alias: [
          // Alias for shared styles package
          {
            find: '@xad/styles',
            replacement: join(__dirname, '..', 'packages', 'styles', 'src'),
          },
          // Specific aliases for packages/ui imports
          {
            find: '@/components/ui',
            replacement: join(__dirname, '..', 'packages', 'ui', 'src', 'components', 'ui'),
          },
          {
            find: '@/components/theme-provider',
            replacement: join(__dirname, '..', 'packages', 'ui', 'src', 'components', 'theme-provider'),
          },
          {
            find: '@/lib',
            replacement: join(__dirname, '..', 'packages', 'ui', 'src', 'lib'),
          },
          // General @ alias for apps/web
          {
            find: '@',
            replacement: join(__dirname, '..', 'apps', 'web', 'src'),
          },
        ],
      },
      publicDir: join(__dirname, '..', 'public'),
    });
  },
};

export default config;