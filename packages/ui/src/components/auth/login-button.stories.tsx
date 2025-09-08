import type { Meta, StoryObj } from '@storybook/react'
import { LoginButton } from './login-button'

const meta = {
  title: 'Auth/LoginButton',
  component: LoginButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Shows loading state with spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button'
    },
    onClick: {
      action: 'clicked',
      description: 'Called when button is clicked'
    }
  }
} satisfies Meta<typeof LoginButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onClick: () => {},
  },
}

export const Loading: Story = {
  args: {
    onClick: () => {},
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    onClick: () => {},
    disabled: true,
  },
}

export const CustomText: Story = {
  args: {
    onClick: () => {},
    children: "Sign In Now",
  },
}