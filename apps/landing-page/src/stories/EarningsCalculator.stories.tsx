import type { Meta, StoryObj } from '@storybook/react'
import EarningsCalculator from '@/components/EarningsCalculator'

const meta: Meta<typeof EarningsCalculator> = {
  title: 'Components/EarningsCalculator',
  component: EarningsCalculator,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const OnPrimaryBackground: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-primary p-8 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}