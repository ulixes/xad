import type { Meta, StoryObj } from '@storybook/react'
import { UserProfile } from './user-profile'

const meta = {
  title: 'Auth/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    email: {
      control: 'text',
      description: 'User email address'
    },
    walletAddress: {
      control: 'text',
      description: 'Wallet address'
    },
    avatarUrl: {
      control: 'text',
      description: 'Avatar image URL'
    }
  }
} satisfies Meta<typeof UserProfile>

export default meta
type Story = StoryObj<typeof meta>

export const EmailUser: Story = {
  args: {
    email: "john.doe@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
  },
}

export const WalletUser: Story = {
  args: {
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
}

export const BothEmailAndWallet: Story = {
  args: {
    email: "alice@example.com",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b332c77c?w=32&h=32&fit=crop&crop=face"
  },
}

export const NoAvatar: Story = {
  args: {
    email: "user@example.com",
  },
}