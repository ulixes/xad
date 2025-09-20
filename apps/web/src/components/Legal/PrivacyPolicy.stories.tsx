import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrivacyPolicy } from './PrivacyPolicy';

const meta: Meta<typeof PrivacyPolicy> = {
  title: 'Legal/Privacy Policy',
  component: PrivacyPolicy,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive Privacy Policy compliant with GDPR, Chrome Web Store user data policies, and privacy best practices for social media engagement platforms.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Complete Privacy Policy with detailed explanations of data collection, usage, and user rights.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-responsive view showing how the Privacy Policy adapts to smaller screens.',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Privacy Policy in dark mode for better accessibility in low-light conditions.',
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet view showing medium-sized screen adaptations.',
      },
    },
  },
};