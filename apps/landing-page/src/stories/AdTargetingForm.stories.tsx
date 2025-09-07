import type { Meta, StoryObj } from '@storybook/react';
import { AdTargetingForm } from '../components/AdTargetingForm';
import type { TargetingRule } from '../types/zk-schemas';

const meta: Meta<typeof AdTargetingForm> = {
  title: 'ZK Advertising/AdTargetingForm',
  component: AdTargetingForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A privacy-preserving advertising targeting form using zero-knowledge proofs. Advertisers can build complex targeting rules using verified attributes from ZKPass and Camp Network without accessing raw user data.'
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

export const WithExampleRule: Story = {
  args: {
    initialRule: {
      id: 'rule-example',
      name: 'Young Music Fans in USA',
      description: 'Target users aged 18-35 in the USA who are active on social media and listen to hip-hop',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'zkp-age',
            operator: '>',
            value: 18,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-2',
            schemaId: 'zkp-country',
            operator: '=',
            value: 'USA',
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-3',
            schemaId: 'custom-reddit-karma',
            operator: '>',
            value: 100,
            params: {},
            logicalOperator: 'AND'
          },
          {
            id: 'cond-4',
            schemaId: 'camp-spotify-listens',
            operator: '>',
            value: 100,
            params: { artist_name: 'Kanye West' }
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

export const ComplexNestedRule: Story = {
  args: {
    initialRule: {
      id: 'rule-complex',
      name: 'Premium Audience Segment',
      description: 'High-value users with verified financial status or significant social influence',
      rootGroup: {
        id: 'group-root',
        operator: 'OR',
        conditions: [
          {
            id: 'group-1',
            operator: 'AND',
            conditions: [
              {
                id: 'cond-1',
                schemaId: 'zkp-bank-balance',
                operator: '>',
                value: 10000,
                params: {}
              },
              {
                id: 'cond-2',
                schemaId: 'zkp-amazon-prime',
                operator: '=',
                value: true,
                params: {}
              },
              {
                id: 'cond-3',
                schemaId: 'zkp-country',
                operator: 'in',
                value: 'USA,UK,Canada',
                params: {}
              }
            ]
          },
          {
            id: 'group-2',
            operator: 'AND',
            conditions: [
              {
                id: 'cond-4',
                schemaId: 'camp-twitter-followers',
                operator: '>',
                value: 10000,
                params: {}
              },
              {
                id: 'cond-5',
                schemaId: 'camp-tiktok-views',
                operator: '>',
                value: 1000000,
                params: {}
              }
            ]
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

export const EducationFocused: Story = {
  args: {
    initialRule: {
      id: 'rule-education',
      name: 'Active Learners',
      description: 'Users actively engaged in online education',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'zkp-coursera-courses',
            operator: '>=',
            value: 3,
            params: {}
          },
          {
            id: 'cond-2',
            schemaId: 'zkp-duolingo-streak',
            operator: '>',
            value: 30,
            params: {}
          }
        ]
      },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
      status: 'draft'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const CryptoEnthusiasts: Story = {
  args: {
    initialRule: {
      id: 'rule-crypto',
      name: 'Crypto Holders',
      description: 'Users with significant cryptocurrency holdings',
      rootGroup: {
        id: 'group-root',
        operator: 'AND',
        conditions: [
          {
            id: 'cond-1',
            schemaId: 'zkp-crypto-holdings',
            operator: '>',
            value: 1000,
            params: {}
          },
          {
            id: 'cond-2',
            schemaId: 'zkp-paypal-verified',
            operator: '=',
            value: true,
            params: {}
          }
        ]
      },
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
      status: 'paused'
    } as TargetingRule,
    onSave: (rule) => console.log('Saved rule:', rule),
    onCancel: () => console.log('Cancelled')
  }
};