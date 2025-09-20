import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download, Heart, Wallet, Star, Check } from 'lucide-react'

interface StepCardProps {
  icon: React.ComponentType<{ className?: string }>
  number: string
  title: string
  description: string
}

const StepCard = ({ icon: Icon, number, title, description }: StepCardProps) => (
  <div className="relative">
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative z-10">
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white">
            <Icon className="h-8 w-8" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {number}
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center">
        {description}
      </p>
    </div>
  </div>
)

const meta = {
  title: 'Components/StepCard',
  component: StepCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
    },
  },
} satisfies Meta<typeof StepCard>

export default meta
type Story = StoryObj<typeof meta>

export const Step1Install: Story = {
  args: {
    icon: Download,
    number: '1',
    title: 'Install Extension',
    description: 'Add zkAd to your Chrome or Firefox browser in one click',
  },
}

export const Step2Engage: Story = {
  args: {
    icon: Heart,
    number: '2',
    title: 'Engage Naturally',
    description: 'Like, comment, and follow on your favorite social platforms',
  },
}

export const Step3Earn: Story = {
  args: {
    icon: Wallet,
    number: '3',
    title: 'Earn Rewards',
    description: 'Receive crypto payments directly to your wallet',
  },
}

export const CompleteFlow: Story = {
  args: {
    icon: Download,
    number: '1',
    title: 'Example Step',
    description: 'Example step description'
  },
  render: () => (
    <div className="flex flex-col md:flex-row gap-8 p-8 bg-gray-50 relative">
      <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 -translate-y-1/2 z-0"></div>
      <StepCard
        icon={Download}
        number="1"
        title="Install Extension"
        description="Add zkAd to your Chrome or Firefox browser in one click"
      />
      <StepCard
        icon={Heart}
        number="2"
        title="Engage Naturally"
        description="Like, comment, and follow on your favorite social platforms"
      />
      <StepCard
        icon={Wallet}
        number="3"
        title="Earn Rewards"
        description="Receive crypto payments directly to your wallet"
      />
    </div>
  ),
}

export const AlternativeSteps: Story = {
  args: {
    icon: Star,
    number: '1',
    title: 'Example Step',
    description: 'Example step description'
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <StepCard
        icon={Star}
        number="1"
        title="Get Started"
        description="Sign up and verify your account"
      />
      <StepCard
        icon={Check}
        number="2"
        title="Complete Tasks"
        description="Finish simple social media activities"
      />
    </div>
  ),
}