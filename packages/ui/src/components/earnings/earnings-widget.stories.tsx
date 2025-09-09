import type { Meta, StoryObj } from '@storybook/react'
import { EarningsWidget } from './earnings-widget'

const meta = {
  title: 'Components/EarningsWidget',
  component: EarningsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    pending: {
      control: 'number',
      description: 'The pending earnings amount'
    },
    available: {
      control: 'number',
      description: 'The available earnings amount'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
} satisfies Meta<typeof EarningsWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pending: 0,
    available: 0,
  },
}

export const WithEarnings: Story = {
  args: {
    pending: 45.50,
    available: 125.00,
  },
}

export const PendingOnly: Story = {
  args: {
    pending: 89.75,
    available: 0,
  },
}

export const AvailableOnly: Story = {
  args: {
    pending: 0,
    available: 250.25,
  },
}

export const LargeAmounts: Story = {
  args: {
    pending: 567.80,
    available: 1234.75,
  },
}