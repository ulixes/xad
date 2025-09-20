import type { Meta, StoryObj } from '@storybook/react-vite';
import { TermsOfService } from './TermsOfService';

const meta: Meta<typeof TermsOfService> = {
  title: 'Legal/Terms of Service',
  component: TermsOfService,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Terms of Service page compliant with Chrome Web Store guidelines for transparency, user protection, and legal compliance.',
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
        story: 'Complete Terms of Service document with all required sections for a compliant social media engagement platform.',
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
        story: 'Mobile-responsive view of the Terms of Service page.',
      },
    },
  },
};

export const Print: Story = {
  parameters: {
    backgrounds: {
      default: 'light',
    },
    docs: {
      description: {
        story: 'Print-friendly version of the Terms of Service.',
      },
    },
  },
};