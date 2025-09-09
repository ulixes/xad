import type { Meta, StoryObj } from '@storybook/react';
import { AdTargetingForm } from '../components/AdTargetingForm/AdTargetingForm';
import type { TargetingRule } from '../types/platform-schemas';

const meta: Meta<typeof AdTargetingForm> = {
  title: 'ZK Advertising/AdTargetingForm',
  component: AdTargetingForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Privacy-preserving ad targeting using zero-knowledge proofs. Build complex targeting rules for TikTok, Reddit, X, Instagram, and other platforms. Advertisers can offer crypto payments for qualified engagements without accessing raw user data.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const TikTokHighEngagement: Story = {
  args: {
    initialRule: {
      id: 'tiktok-targeting-1',
      name: 'High-Engagement TikTok Creators',
      description: 'Target TikTok creators with high engagement rates for music promotion',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'tiktok-followers',
            operator: '>',
            value: 10000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'tiktok-video-views',
            operator: '>',
            value: 100000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-3',
            schemaId: 'tiktok-fyf-eligible',
            operator: '=',
            value: true,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-4',
            schemaId: 'tiktok-audience-age',
            operator: '>',
            value: 50,
            params: { age_range: '18-24' }
          }
        ]
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const RedditPowerUsers: Story = {
  args: {
    initialRule: {
      id: 'reddit-targeting-1',
      name: 'Reddit Power Users & Top Contributors',
      description: 'Target elite Reddit users with top achievement badges',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'reddit-account-age',
            operator: '>',
            value: 365,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'reddit-top-commenter',
            operator: 'has_achievement',
            value: '',
            params: { tier: 'monthly-top-5-commenter' },
            logicalOperator: 'OR'
          },
          {
            id: 'cond-3',
            schemaId: 'reddit-top-poster',
            operator: 'has_achievement',
            value: '',
            params: { tier: 'monthly-top-5-poster' }
          }
        ]
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};



export const Web3SocialTargeting: Story = {
  args: {
    initialRule: {
      id: 'web3-targeting-1',
      name: 'Web3 Native Users',
      description: 'Farcaster users with strong followings for crypto campaigns',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'farcaster-followers',
            operator: '>',
            value: 100,
            params: {}
          }
        ]
      },
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const InstagramCreatorWithDemographics: Story = {
  args: {
    initialRule: {
      id: 'instagram-targeting-1',
      name: 'Fashion & Beauty Instagram Influencers',
      description: 'Target Instagram creators with strong demographics for fashion/beauty campaigns',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'ig-follower-count',
            operator: '>',
            value: 50000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'ig-audience-gender',
            operator: '>',
            value: 65,
            params: { gender: 'female' },
            logicalOperator: 'AND'
          },
          {
            id: 'cond-3',
            schemaId: 'ig-audience-age',
            operator: '>',
            value: 40,
            params: { age_range: '18-24' },
            logicalOperator: 'AND'
          },
          {
            id: 'cond-4',
            schemaId: 'ig-profile-visits-30d',
            operator: '>',
            value: 10000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-5',
            schemaId: 'ig-accounts-reached-7d',
            operator: '>',
            value: 25000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-6',
            schemaId: 'ig-engagement-rate',
            operator: '>',
            value: 3.5,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-7',
            schemaId: 'ig-top-location',
            operator: 'contains',
            value: 'United States',
            params: { location_type: 'country' }
          }
        ]
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const FacebookPageWithInsights: Story = {
  args: {
    initialRule: {
      id: 'facebook-targeting-1',
      name: 'High-Growth Facebook Pages',
      description: 'Target Facebook pages with strong growth metrics and engagement',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'fb-page-likes',
            operator: '>',
            value: 100000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'fb-net-followers-30d',
            operator: '>',
            value: 5000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-3',
            schemaId: 'fb-page-views-7d',
            operator: '>',
            value: 50000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-4',
            schemaId: 'fb-reach-30d',
            operator: '>',
            value: 500000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-5',
            schemaId: 'fb-content-interactions-7d',
            operator: '>',
            value: 10000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-6',
            schemaId: 'fb-audience-age',
            operator: '>',
            value: 35,
            params: { age_range: '25-34' },
            logicalOperator: 'AND'
          },
          {
            id: 'cond-7',
            schemaId: 'fb-audience-gender',
            operator: '>',
            value: 55,
            params: { gender: 'male' }
          }
        ]
      },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-20'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const InstagramLifestyleInfluencer: Story = {
  args: {
    initialRule: {
      id: 'instagram-targeting-2',
      name: 'Lifestyle Instagram Creators - Millennial Focus',
      description: 'Target lifestyle influencers with strong millennial audience engagement',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'ig-follower-count',
            operator: '>',
            value: 25000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'ig-audience-age',
            operator: '>',
            value: 45,
            params: { age_range: '25-34' },
            logicalOperator: 'AND'
          },
          {
            id: 'cond-3',
            schemaId: 'ig-audience-age',
            operator: '>',
            value: 25,
            params: { age_range: '35-44' },
            logicalOperator: 'AND'
          },
          {
            id: 'cond-4',
            schemaId: 'ig-accounts-engaged-7d',
            operator: '>',
            value: 5000,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-5',
            schemaId: 'ig-follower-growth-90d',
            operator: '>',
            value: 10,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-6',
            schemaId: 'ig-top-location',
            operator: 'contains',
            value: 'Los Angeles',
            params: { location_type: 'city' },
            logicalOperator: 'OR'
          },
          {
            id: 'cond-7',
            schemaId: 'ig-top-location',
            operator: 'contains',
            value: 'New York',
            params: { location_type: 'city' }
          }
        ]
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-10'),
      status: 'active'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};