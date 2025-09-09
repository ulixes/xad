import type { Preview } from '@storybook/react';
import React from 'react';
import '@xad/styles/index.css'; // Import shared styles
import './preview.css'; // Import our preview-specific CSS

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story) => {
      React.useEffect(() => {
        // Ensure dark mode is applied
        document.documentElement.classList.add('dark');
      }, []);
      
      return (
        <div className="dark min-h-screen bg-background text-foreground p-6">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;