import type { Meta, StoryObj } from '@storybook/react'
import { JackpotWidget } from './jackpot-widget'

const meta = {
  title: 'Daily/JackpotWidget',
  component: JackpotWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    jackpotAmount: {
      control: 'number',
      description: 'Current jackpot amount'
    },
    ticketsEarned: {
      control: 'number',
      description: 'Number of tickets earned'
    },
    daysUntilDrawing: {
      control: 'number',
      description: 'Days until next drawing'
    },
    streakDays: {
      control: 'number',
      description: 'Current streak days'
    },
    requiredStreak: {
      control: 'number',
      description: 'Required streak to enter'
    }
  }
} satisfies Meta<typeof JackpotWidget>

export default meta
type Story = StoryObj<typeof meta>

export const NotEligible: Story = {
  args: {
    jackpotAmount: 50000,
    ticketsEarned: 0,
    daysUntilDrawing: 3,
    streakDays: 2,
    requiredStreak: 7,
  },
}

export const AlmostEligible: Story = {
  args: {
    jackpotAmount: 75000,
    ticketsEarned: 0,
    daysUntilDrawing: 5,
    streakDays: 5,
    requiredStreak: 7,
  },
}

export const Eligible: Story = {
  args: {
    jackpotAmount: 100000,
    ticketsEarned: 1,
    daysUntilDrawing: 2,
    streakDays: 7,
    requiredStreak: 7,
  },
}

export const MultipleTickets: Story = {
  args: {
    jackpotAmount: 125000,
    ticketsEarned: 4,
    daysUntilDrawing: 1,
    streakDays: 28,
    requiredStreak: 7,
  },
}

export const LargeJackpot: Story = {
  args: {
    jackpotAmount: 500000,
    ticketsEarned: 2,
    daysUntilDrawing: 4,
    streakDays: 14,
    requiredStreak: 7,
  },
}

export const DrawingSoon: Story = {
  args: {
    jackpotAmount: 250000,
    ticketsEarned: 3,
    daysUntilDrawing: 1,
    streakDays: 21,
    requiredStreak: 7,
  },
}