import type { Meta, StoryObj } from '@storybook/react'
import { BrandDashboard, type Campaign } from '../components/BrandDashboard/BrandDashboard'

const meta: Meta<typeof BrandDashboard> = {
  title: 'Components/BrandDashboard',
  component: BrandDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-background min-h-screen">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001-active',
    platform: 'instagram',
    totalBudget: 50000, // $500 in cents
    remainingBudget: 35000, // $350 in cents
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString(),
    actions: [
      {
        id: 'action-001',
        actionType: 'like',
        target: 'instagram.com/p/abc123',
        pricePerAction: 50, // $0.50 in cents
        maxVolume: 100,
        currentVolume: 30,
        isActive: true,
      },
      {
        id: 'action-002',
        actionType: 'follow',
        target: '@brandaccount',
        pricePerAction: 200, // $2.00 in cents
        maxVolume: 50,
        currentVolume: 15,
        isActive: true,
      },
      {
        id: 'action-003',
        actionType: 'comment',
        target: 'instagram.com/p/xyz789',
        pricePerAction: 100, // $1.00 in cents
        maxVolume: 75,
        currentVolume: 45,
        isActive: true,
      },
    ],
  },
  {
    id: 'camp-002-active',
    platform: 'tiktok',
    totalBudget: 100000, // $1000 in cents
    remainingBudget: 80000, // $800 in cents
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date().toISOString(),
    actions: [
      {
        id: 'action-004',
        actionType: 'like',
        target: 'tiktok.com/@user/video/123',
        pricePerAction: 30, // $0.30 in cents
        maxVolume: 200,
        currentVolume: 40,
        isActive: true,
      },
      {
        id: 'action-005',
        actionType: 'share',
        target: 'tiktok.com/@user/video/456',
        pricePerAction: 150, // $1.50 in cents
        maxVolume: 100,
        currentVolume: 20,
        isActive: true,
      },
    ],
  },
  {
    id: 'camp-003-completed',
    platform: 'x',
    totalBudget: 25000, // $250 in cents
    remainingBudget: 0,
    status: 'completed',
    isActive: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    actions: [
      {
        id: 'action-006',
        actionType: 'like',
        target: 'x.com/user/status/789',
        pricePerAction: 25, // $0.25 in cents
        maxVolume: 500,
        currentVolume: 500,
        isActive: false,
      },
      {
        id: 'action-007',
        actionType: 'retweet',
        target: 'x.com/user/status/456',
        pricePerAction: 50, // $0.50 in cents
        maxVolume: 250,
        currentVolume: 250,
        isActive: false,
      },
    ],
  },
  {
    id: 'camp-004-paused',
    platform: 'reddit',
    totalBudget: 30000, // $300 in cents
    remainingBudget: 20000, // $200 in cents
    status: 'paused',
    isActive: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date().toISOString(),
    actions: [
      {
        id: 'action-008',
        actionType: 'upvote',
        target: 'reddit.com/r/tech/comments/abc',
        pricePerAction: 40, // $0.40 in cents
        maxVolume: 250,
        currentVolume: 100,
        isActive: false,
      },
    ],
  },
  {
    id: 'camp-005-draft',
    platform: 'instagram',
    totalBudget: 15000, // $150 in cents
    remainingBudget: 15000, // $150 in cents
    status: 'draft',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actions: [],
  },
]

export const Default: Story = {
  args: {
    campaigns: mockCampaigns,
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
}

export const Loading: Story = {
  args: {
    campaigns: [],
    isLoading: true,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  },
}

export const EmptyState: Story = {
  args: {
    campaigns: [],
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
  },
}

export const ActiveCampaignsOnly: Story = {
  args: {
    campaigns: mockCampaigns.filter(c => c.status === 'active'),
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
}

export const CompletedCampaignsOnly: Story = {
  args: {
    campaigns: mockCampaigns.filter(c => c.status === 'completed'),
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
  },
}

export const SingleCampaign: Story = {
  args: {
    campaigns: [mockCampaigns[0]],
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
}

export const MultiplePlatforms: Story = {
  args: {
    campaigns: [
      {
        ...mockCampaigns[0],
        id: 'multi-001',
        platform: 'instagram',
      },
      {
        ...mockCampaigns[1],
        id: 'multi-002',
        platform: 'tiktok',
      },
      {
        ...mockCampaigns[2],
        id: 'multi-003',
        platform: 'x',
        status: 'active',
        isActive: true,
        remainingBudget: 10000,
      },
      {
        ...mockCampaigns[3],
        id: 'multi-004',
        platform: 'reddit',
        status: 'active',
        isActive: true,
      },
    ],
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
}

export const HighSpendCampaigns: Story = {
  args: {
    campaigns: [
      {
        id: 'high-001',
        platform: 'instagram',
        totalBudget: 500000, // $5000 in cents
        remainingBudget: 125000, // $1250 in cents
        status: 'active',
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        actions: [
          {
            id: 'high-action-001',
            actionType: 'like',
            target: 'instagram.com/p/premium',
            pricePerAction: 500, // $5.00 in cents
            maxVolume: 750,
            currentVolume: 600,
            isActive: true,
          },
        ],
      },
      {
        id: 'high-002',
        platform: 'tiktok',
        totalBudget: 1000000, // $10000 in cents
        remainingBudget: 400000, // $4000 in cents
        status: 'active',
        isActive: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        actions: [
          {
            id: 'high-action-002',
            actionType: 'follow',
            target: '@premiumaccount',
            pricePerAction: 1000, // $10.00 in cents
            maxVolume: 600,
            currentVolume: 360,
            isActive: true,
          },
        ],
      },
    ],
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onCreateCampaign: () => console.log('Create campaign clicked'),
    onRefresh: () => console.log('Refresh clicked'),
  },
}

export const NoActionsAvailable: Story = {
  args: {
    campaigns: mockCampaigns.map(c => ({ ...c, onCreateCampaign: undefined, onRefresh: undefined })),
    isLoading: false,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  },
}