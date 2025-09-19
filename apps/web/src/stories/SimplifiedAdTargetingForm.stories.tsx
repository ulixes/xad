import type { Meta, StoryObj } from '@storybook/react';
import { SimplifiedAdTargetingForm } from '../components/AdTargetingForm/SimplifiedAdTargetingForm';

const meta: Meta<typeof SimplifiedAdTargetingForm> = {
  title: 'ZK Advertising/SimplifiedAdTargetingForm (Beta)',
  component: SimplifiedAdTargetingForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Simplified Ad Targeting Form - Beta Release

A streamlined version of the ad targeting form designed for beta testing with fixed campaign packages.

## Features
- **TikTok Platform Only** - Other platforms marked as "coming soon"
- **Fixed Campaign Package** - 20 Likes + 10 Follows for $6.00 total
- **Simplified Targeting** - Gender, Age Range, and Country selection
- **Demo Mode** - Works in Storybook without wallet connection
- **Clean UI** - Simplified interface for better user experience

## Fixed Package Details
- **20 Likes** @ $0.05 per like = $1.00
- **10 Follows** @ $0.50 per follow = $5.00
- **Total Cost**: $6.00 (fixed price, no customization)

## Targeting Options
- **Gender**: All, Primarily Male (60%+), Primarily Female (60%+)
- **Age Range**: All, 13-17, 18-24, 25-34, 35-44, 45-54, 55+
- **Country**: 14 major markets including US, UK, Canada, Australia, and more

## Use Cases
Perfect for beta testing with a simple, fixed-price campaign package. Users just need to:
1. Select their targeting preferences
2. Provide a TikTok post URL for likes
3. Provide a TikTok profile URL for follows
4. Pay the fixed $6.00 package price
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create TikTok Campaign</h1>
            <p className="text-muted-foreground">
              Launch your targeted advertising campaign with simplified audience selection
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - wallet not connected
export const Default: Story = {
  args: {
    mockWalletConnected: false,
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  }
};

// Wallet connected - ready to create campaign
export const WalletConnected: Story = {
  name: 'Wallet Connected',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xABC123...789DEF',
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the form with wallet connected, ready to create a campaign'
      }
    }
  }
};

// Example with US Female Audience
export const USFemaleAudience: Story = {
  name: 'US Female Audience Campaign',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xDEF456...123ABC',
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Example campaign targeting primarily female audience in the United States'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // This would simulate user interactions in Storybook's play function
    console.log('Demo: User would select Female gender and US country');
  }
};

// Example with Young Adult Targeting
export const YoungAdultCampaign: Story = {
  name: 'Young Adult (18-34) Campaign',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0x789GHI...456JKL',
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Campaign targeting 18-24 and 25-34 age groups, ideal for products aimed at young adults'
      }
    }
  }
};

// Fixed Package example
export const FixedPackageExample: Story = {
  name: 'Fixed Package ($6.00)',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0x111AAA...999ZZZ',
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the fixed campaign package: 20 likes + 10 follows for $6.00 total. No customization available in beta.'
      }
    }
  }
};

// All platforms preview
export const AllPlatformsPreview: Story = {
  name: 'All Platforms (Coming Soon)',
  args: {
    mockWalletConnected: false,
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview showing all platforms with "coming soon" labels. Only TikTok is currently available in beta.'
      }
    }
  }
};

// Mobile responsive view
export const MobileView: Story = {
  name: 'Mobile Responsive',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xMOB123...456ILE',
    onSave: (data) => console.log('Campaign created:', data),
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12'
    },
    docs: {
      description: {
        story: 'Form optimized for mobile devices with responsive layout'
      }
    }
  }
};

// Error states
export const ValidationErrors: Story = {
  name: 'Validation & Error States',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xERR999...000OR',
    onSave: (data) => {
      console.log('Campaign data:', data);
      alert('This would show validation errors if budget < $5 or no actions selected');
    },
    onCancel: () => console.log('Cancelled')
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates validation states: minimum budget requirements, missing action selections, and empty target URLs'
      }
    }
  }
};

// Dynamic Pricing Examples
export const DynamicPricingBaseRate: Story = {
  name: 'Dynamic Pricing - Base Rate ($6.00)',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xBASE123...456',
    onSave: (data) => console.log('Campaign with base pricing:', data),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Base Rate Pricing** - No multipliers applied
- Target: All Countries, All Genders, All Ages
- Price: $6.00 (20 likes @ $0.05 + 10 follows @ $0.50)
- Multiplier: 1.0x

This is the cheapest option with the widest reach.
        `
      }
    }
  }
};

export const DynamicPricingUSTargeted: Story = {
  name: 'Dynamic Pricing - US Targeted ($15.00)',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xUSA789...012',
    onSave: (data) => console.log('US targeted campaign:', data),
  },
  parameters: {
    docs: {
      description: {
        story: `
**US Market Pricing** - Country multiplier applied
- Target: United States only
- Base: $6.00 → Final: $15.00
- Country Multiplier: 2.5x (Tier 1 market)
- Breakdown: 20 likes @ $0.125 + 10 follows @ $1.25

High-value market commands premium pricing.
        `
      }
    }
  }
};

export const DynamicPricingFullyTargeted: Story = {
  name: 'Dynamic Pricing - Fully Targeted ($52.50)',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xMAX999...888',
    onSave: (data) => console.log('Fully targeted campaign:', data),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Maximum Targeting** - All multipliers applied
- Target: US, Female, Age 18-24
- Base: $6.00 → Final: $52.50
- Multipliers: Country 2.5x × Gender 1.2x × Age 1.4x = 4.2x
- Breakdown: 20 likes @ $0.21 + 10 follows @ $2.10

Most expensive but most precisely targeted campaign.
        `
      }
    }
  }
};

export const DynamicPricingComparison: Story = {
  name: 'Dynamic Pricing - Compare Tiers',
  args: {
    mockWalletConnected: true,
    mockWalletAddress: '0xCOMP567...234',
    onSave: (data) => console.log('Campaign data:', data),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Pricing Tier Comparison**

| Targeting | Multiplier | Total Cost |
|-----------|------------|------------|
| Base (All/All/All) | 1.0x | $6.00 |
| Gender Only | 1.2x | $7.20 |
| Age Only | 1.4x | $8.40 |
| Country Tier 3 (Spain) | 1.3x | $7.80 |
| Country Tier 2 (Germany) | 1.8x | $10.80 |
| Country Tier 1 (USA) | 2.5x | $15.00 |
| USA + Gender | 3.0x | $18.00 |
| USA + Age | 3.5x | $21.00 |
| USA + Gender + Age | 4.2x | $25.20 |

Try different combinations to see how targeting affects pricing!
        `
      }
    }
  }
};