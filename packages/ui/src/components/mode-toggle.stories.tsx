import type { Meta, StoryObj } from '@storybook/react'
import { ModeToggle } from './mode-toggle'
import { ThemeProvider } from './theme-provider'

const meta = {
  title: 'Theme/ModeToggle',
  component: ModeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light" storageKey="storybook-theme">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ModeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}