import type { Preview } from '@storybook/react-vite'
import '../src/index.css'  // CSS variables and Tailwind
import '../src/App.css'    // Dark theme styles

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;