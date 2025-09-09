import type { Meta, StoryObj } from '@storybook/react'
import { Home } from './home'

const meta = {
  title: 'Pages/Home',
  component: Home,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    pendingEarnings: {
      control: 'number',
      description: 'Pending earnings amount'
    },
    availableEarnings: {
      control: 'number',
      description: 'Available earnings amount'
    },
    jackpotAmount: {
      control: 'number',
      description: 'Current jackpot amount'
    },
    hoursUntilDrawing: {
      control: 'number',
      description: 'Hours until next jackpot drawing'
    },
    minutesUntilDrawing: {
      control: 'number',
      description: 'Minutes until next jackpot drawing'
    },
    secondsUntilDrawing: {
      control: 'number',
      description: 'Seconds until next jackpot drawing'
    },
    dailyActionsCompleted: {
      control: 'number',
      description: 'Daily actions completed'
    },
    dailyActionsRequired: {
      control: 'number',
      description: 'Daily actions required'
    },
    walletAddress: {
      control: 'text',
      description: 'Wallet address to display in header'
    },
    onAddAccount: {
      action: 'add-account-clicked',
      description: 'Called when user confirms adding an account with platform and handle'
    },
    onAccountClick: {
      action: 'account-clicked',
      description: 'Called when a connected account is clicked'
    },
    onWalletClick: {
      action: 'wallet-clicked',
      description: 'Called when wallet button is clicked'
    },
    onJackpotClick: {
      action: 'jackpot-clicked',
      description: 'Called when jackpot widget is clicked'
    },
    onCashOut: {
      action: 'cash-out-clicked',
      description: 'Called when cash out button is clicked'
    },
    connectedAccounts: {
      control: 'object',
      description: 'Array of connected accounts with their details'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pendingEarnings: 0,
    availableEarnings: 0,
    dailyActionsCompleted: 0,
    dailyActionsRequired: 5,
    jackpotAmount: 50000,
    hoursUntilDrawing: 3,
    minutesUntilDrawing: 45,
    secondsUntilDrawing: 0,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    onWalletClick: () => console.log('Wallet clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const WithStreak: Story = {
  args: {
    pendingEarnings: 45.50,
    availableEarnings: 125.00,
    dailyActionsCompleted: 3,
    dailyActionsRequired: 5,
    jackpotAmount: 75000,
    hoursUntilDrawing: 2,
    minutesUntilDrawing: 30,
    secondsUntilDrawing: 15,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    onWalletClick: () => console.log('Wallet clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const WithConnectedAccounts: Story = {
  args: {
    pendingEarnings: 25.75,
    availableEarnings: 89.50,
    dailyActionsCompleted: 2,
    dailyActionsRequired: 5,
    jackpotAmount: 60000,
    hoursUntilDrawing: 4,
    minutesUntilDrawing: 15,
    secondsUntilDrawing: 30,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    onWalletClick: () => console.log('Wallet clicked'),
    onCashOut: () => console.log('Cash out clicked'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'johndoe', availableActions: 5 },
      { platform: 'tiktok', handle: 'janedoe', availableActions: 3 },
      { platform: 'instagram', handle: 'john_photos', availableActions: 8 },
      { platform: 'x', handle: 'johntweets', availableActions: 2 },
    ],
  },
}

export const PartiallyConnected: Story = {
  args: {
    pendingEarnings: 75.00,
    availableEarnings: 250.00,
    dailyActionsCompleted: 5,
    dailyActionsRequired: 5,
    jackpotAmount: 100000,
    hoursUntilDrawing: 1,
    minutesUntilDrawing: 10,
    secondsUntilDrawing: 45,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'creator123', availableActions: 12 },
      { platform: 'reddit', handle: 'redditor42', availableActions: 7 },
    ],
  },
}

export const MultipleAccountsSamePlatform: Story = {
  args: {
    pendingEarnings: 234.50,
    availableEarnings: 892.30,
    dailyActionsCompleted: 4,
    dailyActionsRequired: 5,
    jackpotAmount: 125000,
    hoursUntilDrawing: 3,
    minutesUntilDrawing: 45,
    secondsUntilDrawing: 0,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    connectedAccounts: [
      { platform: 'instagram', handle: 'main_account', availableActions: 10 },
      { platform: 'instagram', handle: 'business_account', availableActions: 15 },
      { platform: 'instagram', handle: 'personal_account', availableActions: 3 },
    ],
  },
}

export const AddingAccount: Story = {
  args: {
    pendingEarnings: 25.75,
    availableEarnings: 89.50,
    dailyActionsCompleted: 2,
    dailyActionsRequired: 5,
    jackpotAmount: 60000,
    hoursUntilDrawing: 4,
    minutesUntilDrawing: 15,
    secondsUntilDrawing: 30,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    onWalletClick: () => console.log('Wallet clicked'),
    onCashOut: () => console.log('Cash out clicked'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'johndoe', availableActions: 5 },
    ],
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking the Add Account button to show the input field
    const addButton = canvasElement.querySelector('button:has(.lucide-plus)')
    if (addButton) {
      // This is just for story documentation, actual interaction would trigger the state
      console.log('Story Note: Click "Add Account" to see the input field')
    }
  }
}

export const VerifyingAccount: Story = {
  args: {
    pendingEarnings: 25.75,
    availableEarnings: 89.50,
    dailyActionsCompleted: 2,
    dailyActionsRequired: 5,
    jackpotAmount: 60000,
    hoursUntilDrawing: 4,
    minutesUntilDrawing: 15,
    secondsUntilDrawing: 30,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    onWalletClick: () => console.log('Wallet clicked'),
    onCashOut: () => console.log('Cash out clicked'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'johndoe', availableActions: 5 },
      { platform: 'instagram', handle: 'newaccount', availableActions: 0, isVerifying: true },
      { platform: 'instagram', handle: 'existingaccount', availableActions: 8 },
    ],
  },
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    pendingEarnings: 0,
    availableEarnings: 0,
    dailyActionsCompleted: 0,
    dailyActionsRequired: 5,
    jackpotAmount: 50000,
    hoursUntilDrawing: 3,
    minutesUntilDrawing: 45,
    secondsUntilDrawing: 0,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
  },
}

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    pendingEarnings: 35.25,
    availableEarnings: 75.00,
    dailyActionsCompleted: 1,
    dailyActionsRequired: 5,
    jackpotAmount: 65000,
    hoursUntilDrawing: 2,
    minutesUntilDrawing: 30,
    secondsUntilDrawing: 15,
    onAddAccount: (platform, handle) => console.log('Add account for:', platform, 'with handle:', handle),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onJackpotClick: () => console.log('Jackpot clicked'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'creator', availableActions: 5 },
      { platform: 'instagram', handle: 'photographer', availableActions: 8 },
    ],
  },
}