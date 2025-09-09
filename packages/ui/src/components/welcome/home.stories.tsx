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
    currentStreak: {
      control: 'number',
      description: 'Current streak in days'
    },
    dailyTasksCompleted: {
      control: 'number',
      description: 'Daily tasks completed'
    },
    dailyTasksRequired: {
      control: 'number',
      description: 'Daily tasks required'
    },
    streakMultiplier: {
      control: 'number',
      description: 'Earnings multiplier from streak'
    },
    jackpotAmount: {
      control: 'number',
      description: 'Current jackpot amount'
    },
    jackpotTickets: {
      control: 'number',
      description: 'Tickets earned for jackpot'
    },
    daysUntilDrawing: {
      control: 'number',
      description: 'Days until next jackpot drawing'
    },
    onConnectAccount: {
      action: 'connect-account-clicked',
      description: 'Called when the Connect Account button is clicked'
    },
    onAddAccount: {
      action: 'add-account-clicked',
      description: 'Called when an Add Account button is clicked for a platform'
    },
    onAccountClick: {
      action: 'account-clicked',
      description: 'Called when a connected account is clicked'
    },
    onStartDailyTasks: {
      action: 'start-daily-tasks',
      description: 'Called when start daily tasks is clicked'
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
    currentStreak: 0,
    dailyTasksCompleted: 0,
    dailyTasksRequired: 5,
    streakMultiplier: 1,
    jackpotAmount: 50000,
    jackpotTickets: 0,
    daysUntilDrawing: 3,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    onStartDailyTasks: () => console.log('Start daily tasks'),
  },
}

export const WithStreak: Story = {
  args: {
    pendingEarnings: 45.50,
    availableEarnings: 125.00,
    currentStreak: 7,
    dailyTasksCompleted: 3,
    dailyTasksRequired: 5,
    streakMultiplier: 1.5,
    jackpotAmount: 75000,
    jackpotTickets: 1,
    daysUntilDrawing: 2,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    onStartDailyTasks: () => console.log('Start daily tasks'),
  },
}

export const WithConnectedAccounts: Story = {
  args: {
    pendingEarnings: 25.75,
    availableEarnings: 89.50,
    currentStreak: 3,
    dailyTasksCompleted: 2,
    dailyTasksRequired: 5,
    streakMultiplier: 1,
    jackpotAmount: 60000,
    jackpotTickets: 0,
    daysUntilDrawing: 4,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'johndoe', availableTasks: 5 },
      { platform: 'tiktok', handle: 'janedoe', availableTasks: 3 },
      { platform: 'instagram', handle: 'john_photos', availableTasks: 8 },
      { platform: 'x', handle: 'johntweets', availableTasks: 2 },
    ],
  },
}

export const PartiallyConnected: Story = {
  args: {
    pendingEarnings: 75.00,
    availableEarnings: 250.00,
    currentStreak: 14,
    dailyTasksCompleted: 5,
    dailyTasksRequired: 5,
    streakMultiplier: 2,
    jackpotAmount: 100000,
    jackpotTickets: 2,
    daysUntilDrawing: 1,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'creator123', availableTasks: 12 },
      { platform: 'reddit', handle: 'redditor42', availableTasks: 7 },
    ],
  },
}

export const MultipleAccountsSamePlatform: Story = {
  args: {
    pendingEarnings: 234.50,
    availableEarnings: 892.30,
    currentStreak: 30,
    dailyTasksCompleted: 4,
    dailyTasksRequired: 5,
    streakMultiplier: 2,
    jackpotAmount: 125000,
    jackpotTickets: 4,
    daysUntilDrawing: 3,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    connectedAccounts: [
      { platform: 'instagram', handle: 'main_account', availableTasks: 10 },
      { platform: 'instagram', handle: 'business_account', availableTasks: 15 },
      { platform: 'instagram', handle: 'personal_account', availableTasks: 3 },
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
    currentStreak: 0,
    dailyTasksCompleted: 0,
    dailyTasksRequired: 5,
    streakMultiplier: 1,
    jackpotAmount: 50000,
    jackpotTickets: 0,
    daysUntilDrawing: 3,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
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
    currentStreak: 5,
    dailyTasksCompleted: 1,
    dailyTasksRequired: 5,
    streakMultiplier: 1,
    jackpotAmount: 65000,
    jackpotTickets: 0,
    daysUntilDrawing: 2,
    onConnectAccount: () => {},
    onAddAccount: (platform) => console.log('Add account for:', platform),
    onAccountClick: (account) => console.log('Account clicked:', account),
    onStartDailyTasks: () => console.log('Start daily tasks'),
    connectedAccounts: [
      { platform: 'tiktok', handle: 'creator', availableTasks: 5 },
      { platform: 'instagram', handle: 'photographer', availableTasks: 8 },
    ],
  },
}