import type { Meta, StoryObj } from '@storybook/react-vite'
import { DollarSign, Shield, Zap, Globe } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    
    <div className="relative">
      <div className="inline-flex p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg text-white mb-4">
        <Icon className="h-6 w-6" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  </div>
)

const meta = {
  title: 'Components/FeatureCard',
  component: FeatureCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
    },
  },
} satisfies Meta<typeof FeatureCard>

export default meta
type Story = StoryObj<typeof meta>

export const EarnCrypto: Story = {
  args: {
    icon: DollarSign,
    title: 'Earn Real Crypto',
    description: 'Get paid in USDC for your genuine social media engagement',
  },
}

export const Security: Story = {
  args: {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data stays safe with enterprise-grade security',
  },
}

export const InstantRewards: Story = {
  args: {
    icon: Zap,
    title: 'Instant Rewards',
    description: 'Receive payments immediately after completing tasks',
  },
}

export const MultiPlatform: Story = {
  args: {
    icon: Globe,
    title: 'Multi-Platform',
    description: 'Works across X, Instagram, TikTok, YouTube and more',
  },
}

export const GridLayout: Story = {
  args: {
    icon: DollarSign,
    title: 'Example Feature',
    description: 'Example description'
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50">
      <FeatureCard
        icon={DollarSign}
        title="Earn Real Crypto"
        description="Get paid in USDC for your genuine social media engagement"
      />
      <FeatureCard
        icon={Shield}
        title="Secure & Private"
        description="Your data stays safe with enterprise-grade security"
      />
      <FeatureCard
        icon={Zap}
        title="Instant Rewards"
        description="Receive payments immediately after completing tasks"
      />
      <FeatureCard
        icon={Globe}
        title="Multi-Platform"
        description="Works across X, Instagram, TikTok, YouTube and more"
      />
    </div>
  ),
}