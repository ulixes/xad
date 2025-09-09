import type { Meta, StoryObj } from '@storybook/react'
import { JackpotDetailsPage } from './jackpot-details-page'

const meta = {
  title: 'Pages/JackpotDetails',
  component: JackpotDetailsPage,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    jackpotAmount: {
      control: 'number',
      description: 'Jackpot prize amount'
    },
    hoursUntilDrawing: {
      control: 'number',
      description: 'Hours until next drawing'
    },
    minutesUntilDrawing: {
      control: 'number',
      description: 'Minutes until next drawing'
    },
    dailyTasksCompleted: {
      control: 'number',
      description: 'Number of tasks completed today'
    },
    dailyTasksRequired: {
      control: 'number',
      description: 'Number of tasks required to enter'
    },
    isEligible: {
      control: 'boolean',
      description: 'Whether user is entered in current jackpot'
    },
    onBack: {
      action: 'back-clicked',
      description: 'Called when back button is clicked'
    }
  }
} satisfies Meta<typeof JackpotDetailsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    jackpotAmount: 50000,
    hoursUntilDrawing: 3,
    minutesUntilDrawing: 45,
    dailyTasksCompleted: 0,
    dailyTasksRequired: 10,
    isEligible: false,
    onBack: () => console.log('Back clicked'),
  },
}

export const PartialProgress: Story = {
  args: {
    jackpotAmount: 75000,
    hoursUntilDrawing: 2,
    minutesUntilDrawing: 30,
    dailyTasksCompleted: 4,
    dailyTasksRequired: 10,
    isEligible: false,
    onBack: () => console.log('Back clicked'),
  },
}

export const AlmostComplete: Story = {
  args: {
    jackpotAmount: 100000,
    hoursUntilDrawing: 1,
    minutesUntilDrawing: 15,
    dailyTasksCompleted: 8,
    dailyTasksRequired: 10,
    isEligible: false,
    onBack: () => console.log('Back clicked'),
  },
}

export const Eligible: Story = {
  args: {
    jackpotAmount: 125000,
    hoursUntilDrawing: 0,
    minutesUntilDrawing: 45,
    dailyTasksCompleted: 10,
    dailyTasksRequired: 10,
    isEligible: true,
    onBack: () => console.log('Back clicked'),
  },
}

export const ExtraTasks: Story = {
  args: {
    jackpotAmount: 150000,
    hoursUntilDrawing: 5,
    minutesUntilDrawing: 0,
    dailyTasksCompleted: 25,
    dailyTasksRequired: 10,
    isEligible: true,
    onBack: () => console.log('Back clicked'),
  },
}