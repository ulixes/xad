import type { Meta, StoryObj } from '@storybook/react'
import { DailyTaskCard } from './daily-task-card'

const meta = {
  title: 'Daily/DailyTaskCard',
  component: DailyTaskCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tasksCompleted: {
      control: 'number',
      description: 'Number of tasks completed today'
    },
    tasksRequired: {
      control: 'number', 
      description: 'Number of tasks required for daily goal'
    },
    streakMultiplier: {
      control: 'number',
      description: 'Earnings multiplier based on streak'
    },
    estimatedEarnings: {
      control: 'number',
      description: 'Base estimated earnings'
    },
    onStartTasks: {
      action: 'start-tasks-clicked',
      description: 'Called when start/continue button is clicked'
    }
  }
} satisfies Meta<typeof DailyTaskCard>

export default meta
type Story = StoryObj<typeof meta>

export const NotStarted: Story = {
  args: {
    tasksCompleted: 0,
    tasksRequired: 5,
    streakMultiplier: 1,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}

export const InProgress: Story = {
  args: {
    tasksCompleted: 2,
    tasksRequired: 5,
    streakMultiplier: 1,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}

export const AlmostComplete: Story = {
  args: {
    tasksCompleted: 4,
    tasksRequired: 5,
    streakMultiplier: 1.5,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}

export const Complete: Story = {
  args: {
    tasksCompleted: 5,
    tasksRequired: 5,
    streakMultiplier: 2,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}

export const WithBonus: Story = {
  args: {
    tasksCompleted: 3,
    tasksRequired: 5,
    streakMultiplier: 1.5,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}

export const DoubleBonus: Story = {
  args: {
    tasksCompleted: 1,
    tasksRequired: 5,
    streakMultiplier: 2,
    estimatedEarnings: 5.00,
    onStartTasks: () => {},
  },
}