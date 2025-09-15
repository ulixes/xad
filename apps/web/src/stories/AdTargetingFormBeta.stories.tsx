import type { Meta, StoryObj } from '@storybook/react';
import { AdTargetingFormBeta } from '../components/AdTargetingForm/AdTargetingFormBeta';

const meta: Meta<typeof AdTargetingFormBeta> = {
  title: 'ZK Advertising/AdTargetingFormBeta',
  component: AdTargetingFormBeta,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Simplified beta version of the ad targeting form. Limited to TikTok and Instagram platforms with only Like and Follow actions. No targeting requirements needed - campaigns are available to all users.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create Campaign (Beta)</h1>
          <p className="text-muted-foreground mb-8">
            Launch your campaign on TikTok or Instagram. No targeting requirements needed for beta.
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSave: (rule) => console.log('Saved campaign:', rule),
    onCancel: () => console.log('Cancelled')
  }
};

export const TikTokCampaign: Story = {
  name: 'TikTok Campaign',
  args: {
    onSave: (rule) => console.log('Saved TikTok campaign:', rule),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of a TikTok campaign with like and follow actions'
      }
    }
  }
};

export const InstagramCampaign: Story = {
  name: 'Instagram Campaign', 
  args: {
    onSave: (rule) => console.log('Saved Instagram campaign:', rule),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of an Instagram campaign with like and follow actions'
      }
    }
  }
};

export const MinimumBudget: Story = {
  name: 'Minimum Budget Example',
  args: {
    onSave: (rule) => console.log('Saved campaign:', rule),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the $5 minimum budget requirement. Users need to select enough actions to meet the minimum.'
      }
    }
  }
};