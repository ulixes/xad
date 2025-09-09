import type { Meta, StoryObj } from '@storybook/react'
import { WelcomePage } from './welcome-page'

const meta = {
  title: 'Pages/WelcomePage',
  component: WelcomePage,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onConnectAccounts: {
      action: 'connect-accounts-clicked',
      description: 'Called when the button is clicked'
    },
    buttonText: {
      control: 'text',
      description: 'Text to display on the button'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
} satisfies Meta<typeof WelcomePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onConnectAccounts: () => {},
  },
}

export const CustomButtonText: Story = {
  args: {
    onConnectAccounts: () => {},
    buttonText: 'Connect Your Accounts',
  },
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    onConnectAccounts: () => {},
  },
}

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    onConnectAccounts: () => {},
  },
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    onConnectAccounts: () => {},
    className: 'dark',
  },
}