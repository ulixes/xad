import type { Meta, StoryObj } from '@storybook/react'
import { WithdrawPage, ActionHistory } from './withdraw-page'

const meta = {
  title: 'Pages/Withdraw',
  component: WithdrawPage,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    availableEarnings: {
      control: 'number',
      description: 'Available earnings for cash out'
    },
    actionHistory: {
      control: 'object',
      description: 'History of completed actions'
    },
    onBack: {
      action: 'back-clicked',
      description: 'Called when back button is clicked'
    },
    onCashOut: {
      action: 'cash-out-clicked',
      description: 'Called when cash out button is clicked'
    }
  }
} satisfies Meta<typeof WithdrawPage>

export default meta
type Story = StoryObj<typeof meta>

const now = new Date()
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

const sampleActions: ActionHistory[] = [
  {
    id: '1',
    type: 'like',
    status: 'verified',
    url: 'https://tiktok.com/@creator/video/123456',
    payment: 0.25,
    platform: 'tiktok',
    completedAt: daysAgo(8),
  },
  {
    id: '2',
    type: 'comment',
    status: 'verified',
    url: 'https://instagram.com/p/ABC123',
    payment: 0.50,
    platform: 'instagram',
    completedAt: daysAgo(8),
  },
  {
    id: '3',
    type: 'like',
    status: 'pending',
    url: 'https://x.com/user/status/789',
    payment: 0.25,
    platform: 'x',
    completedAt: daysAgo(3),
    daysRemaining: 4,
  },
  {
    id: '4',
    type: 'retweet',
    status: 'pending',
    url: 'https://x.com/another/status/456',
    payment: 0.30,
    platform: 'x',
    completedAt: daysAgo(2),
    daysRemaining: 5,
  },
  {
    id: '5',
    type: 'upvote',
    status: 'pending',
    url: 'https://reddit.com/r/funny/comments/xyz',
    payment: 0.20,
    platform: 'reddit',
    completedAt: daysAgo(1),
    daysRemaining: 6,
  },
  {
    id: '6',
    type: 'follow',
    status: 'pending',
    url: 'https://tiktok.com/@newcreator',
    payment: 0.40,
    platform: 'tiktok',
    completedAt: now,
    daysRemaining: 7,
  },
  {
    id: '7',
    type: 'like',
    status: 'pending',
    url: 'https://instagram.com/p/XYZ789',
    payment: 0.25,
    platform: 'instagram',
    completedAt: daysAgo(0.5),
    hoursRemaining: 12,
  },
  {
    id: '8',
    type: 'comment',
    status: 'pending',
    url: 'https://x.com/user/status/999',
    payment: 0.50,
    platform: 'x',
    completedAt: daysAgo(0.9),
    hoursRemaining: 3,
  },
]

export const Default: Story = {
  args: {
    availableEarnings: 0.75,
    actionHistory: sampleActions,
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const BelowMinimum: Story = {
  args: {
    availableEarnings: 2.50,
    actionHistory: sampleActions.slice(0, 3),
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const CanCashOut: Story = {
  args: {
    availableEarnings: 12.75,
    actionHistory: [
      ...sampleActions,
      {
        id: '9',
        type: 'like',
        status: 'verified',
        url: 'https://tiktok.com/@popular/video/999',
        payment: 0.25,
        platform: 'tiktok',
        completedAt: daysAgo(10),
      },
      {
        id: '10',
        type: 'share',
        status: 'verified',
        url: 'https://instagram.com/reel/XYZ789',
        payment: 0.35,
        platform: 'instagram',
        completedAt: daysAgo(9),
      },
    ],
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const AllPending: Story = {
  args: {
    availableEarnings: 0,
    actionHistory: [
      {
        id: '1',
        type: 'like',
        status: 'pending',
        url: 'https://tiktok.com/@creator/video/123',
        payment: 0.25,
        platform: 'tiktok',
        completedAt: daysAgo(6),
        daysRemaining: 1,
      },
      {
        id: '2',
        type: 'comment',
        status: 'pending',
        url: 'https://instagram.com/p/DEF456',
        payment: 0.50,
        platform: 'instagram',
        completedAt: daysAgo(4),
        daysRemaining: 3,
      },
      {
        id: '3',
        type: 'follow',
        status: 'pending',
        url: 'https://x.com/influencer',
        payment: 0.40,
        platform: 'x',
        completedAt: daysAgo(0),
        daysRemaining: 7,
      },
    ],
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const MixedStatuses: Story = {
  args: {
    availableEarnings: 5.25,
    actionHistory: [
      {
        id: '1',
        type: 'like',
        status: 'verified',
        url: 'https://tiktok.com/@creator/video/111',
        payment: 0.25,
        platform: 'tiktok',
        completedAt: daysAgo(15),
      },
      {
        id: '3',
        type: 'like',
        status: 'failed',
        url: 'https://x.com/deleted/status/000',
        payment: 0.25,
        platform: 'x',
        completedAt: daysAgo(10),
      },
      {
        id: '4',
        type: 'share',
        status: 'pending',
        url: 'https://tiktok.com/@viral/video/222',
        payment: 0.35,
        platform: 'tiktok',
        completedAt: daysAgo(2),
        daysRemaining: 5,
      },
      {
        id: '5',
        type: 'save',
        status: 'verified',
        url: 'https://instagram.com/reel/SAVE789',
        payment: 0.30,
        platform: 'instagram',
        completedAt: daysAgo(20),
      },
    ],
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}

export const EmptyHistory: Story = {
  args: {
    availableEarnings: 0,
    actionHistory: [],
    onBack: () => console.log('Back clicked'),
    onCashOut: () => console.log('Cash out clicked'),
  },
}