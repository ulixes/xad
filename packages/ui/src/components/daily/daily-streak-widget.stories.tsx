import type { Meta, StoryObj } from '@storybook/react'
import { DailyStreakWidget } from './daily-streak-widget'

const meta = {
  title: 'Daily/DailyStreakWidget',
  component: DailyStreakWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentStreak: {
      control: 'number',
      description: 'Current streak in days'
    },
    tasksCompleted: {
      control: 'number',
      description: 'Tasks completed today'
    },
    tasksRequired: {
      control: 'number',
      description: 'Tasks required to maintain streak'
    },
    hasCompletedToday: {
      control: 'boolean',
      description: 'Whether today\'s tasks are complete'
    }
  }
} satisfies Meta<typeof DailyStreakWidget>

export default meta
type Story = StoryObj<typeof meta>

export const NoStreak: Story = {
  args: {
    currentStreak: 0,
    tasksCompleted: 0,
    tasksRequired: 5,
    hasCompletedToday: false,
  },
}

export const StartingStreak: Story = {
  args: {
    currentStreak: 1,
    tasksCompleted: 2,
    tasksRequired: 5,
    hasCompletedToday: false,
  },
}

export const ActiveStreak: Story = {
  args: {
    currentStreak: 5,
    tasksCompleted: 3,
    tasksRequired: 5,
    hasCompletedToday: false,
  },
}

export const WeekStreak: Story = {
  args: {
    currentStreak: 7,
    tasksCompleted: 5,
    tasksRequired: 5,
    hasCompletedToday: true,
  },
}

export const LongStreak: Story = {
  args: {
    currentStreak: 30,
    tasksCompleted: 4,
    tasksRequired: 5,
    hasCompletedToday: false,
  },
}

export const TodayComplete: Story = {
  args: {
    currentStreak: 3,
    tasksCompleted: 5,
    tasksRequired: 5,
    hasCompletedToday: true,
  },
}