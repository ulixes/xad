import type { Meta, StoryObj } from '@storybook/react'
import { AuthStateIndicator } from './auth-state-indicator'

const meta = {
  title: 'State/AuthStateIndicator',
  component: AuthStateIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'authenticating', 'authenticated', 'creatingWallet', 'signingMessage', 'error'],
      description: 'Current authentication state'
    }
  }
} satisfies Meta<typeof AuthStateIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    state: 'idle',
  },
}

export const Authenticating: Story = {
  args: {
    state: 'authenticating',
  },
}

export const Authenticated: Story = {
  args: {
    state: 'authenticated',
  },
}

export const CreatingWallet: Story = {
  args: {
    state: 'creatingWallet',
  },
}

export const SigningMessage: Story = {
  args: {
    state: 'signingMessage',
  },
}

export const Error: Story = {
  args: {
    state: 'error',
  },
}

export const AllStates: Story = {
  args: { state: 'idle' },
  render: () => (
    <div className="flex flex-wrap gap-4">
      <AuthStateIndicator state="idle" />
      <AuthStateIndicator state="authenticating" />
      <AuthStateIndicator state="authenticated" />
      <AuthStateIndicator state="creatingWallet" />
      <AuthStateIndicator state="signingMessage" />
      <AuthStateIndicator state="error" />
    </div>
  ),
}