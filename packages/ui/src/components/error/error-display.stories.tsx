import type { Meta, StoryObj } from '@storybook/react'
import { ErrorDisplay } from './error-display'

const meta = {
  title: 'Error/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'Error message or Error object'
    },
    title: {
      control: 'text',
      description: 'Error title'
    },
    onRetry: {
      action: 'retry',
      description: 'Called when retry button is clicked'
    }
  }
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    error: "Authentication failed. Please check your credentials and try again.",
  },
}

export const WithRetry: Story = {
  args: {
    error: "Network connection failed. Please check your internet connection.",
    onRetry: () => {},
  },
}

export const CustomTitle: Story = {
  args: {
    error: "Wallet creation failed due to insufficient permissions.",
    title: "Wallet Creation Error",
    onRetry: () => {},
  },
}

export const LongError: Story = {
  args: {
    error: "This is a very long error message that demonstrates how the component handles lengthy error descriptions that might contain technical details and multiple sentences explaining what went wrong.",
    title: "Detailed Error Information",
    onRetry: () => {},
  },
}