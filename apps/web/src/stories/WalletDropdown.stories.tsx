import type { Meta, StoryObj } from '@storybook/react'
import { WalletDropdown } from '../components/WalletDropdown'
import { useState } from 'react'

const meta = {
  title: 'Components/WalletDropdown',
  component: WalletDropdown,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' }
      ]
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-[400px] p-8">
        <div className="flex justify-end">
          <Story />
        </div>
      </div>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    address: {
      control: 'text',
      description: 'Wallet address to display'
    },
    onSignOut: {
      action: 'signed out',
      description: 'Callback when user signs out'
    },
    mockFundWallet: {
      control: 'boolean',
      description: 'Mock mode for Storybook (disables real Privy hook)'
    }
  }
} satisfies Meta<typeof WalletDropdown>

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {
    address: '0xDEe9966FcDBcfaE388944F295E44A7B0E313CaCA',
    mockFundWallet: true,
    onSignOut: () => console.log('Sign out clicked')
  }
}

// Story with shorter address
export const ShortAddress: Story = {
  args: {
    address: '0x1234567890123456789012345678901234567890',
    mockFundWallet: true,
    onSignOut: () => console.log('Sign out clicked')
  }
}

// Story without sign out button
export const NoSignOut: Story = {
  args: {
    address: '0xDEe9966FcDBcfaE388944F295E44A7B0E313CaCA',
    mockFundWallet: true,
    onSignOut: undefined
  }
}

// Interactive story with state management
export const Interactive: Story = {
  render: function Render(args) {
    const [signedOut, setSignedOut] = useState(false)
    
    if (signedOut) {
      return (
        <div className="text-center">
          <p className="text-gray-400 mb-4">User signed out</p>
          <button
            onClick={() => setSignedOut(false)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Sign In Again
          </button>
        </div>
      )
    }
    
    return (
      <WalletDropdown
        {...args}
        onSignOut={() => {
          console.log('Signing out...')
          setSignedOut(true)
        }}
      />
    )
  },
  args: {
    address: '0xDEe9966FcDBcfaE388944F295E44A7B0E313CaCA',
    mockFundWallet: true
  }
}

// Story showing copied state
export const WithCopiedFeedback: Story = {
  render: function Render(args) {
    return (
      <div className="space-y-4">
        <p className="text-gray-400 text-sm text-center mb-4">
          Click the wallet button, then click the copy icon to see the "Copied!" feedback
        </p>
        <div className="flex justify-center">
          <WalletDropdown {...args} />
        </div>
      </div>
    )
  },
  args: {
    address: '0xDEe9966FcDBcfaE388944F295E44A7B0E313CaCA',
    mockFundWallet: true,
    onSignOut: () => console.log('Sign out clicked')
  }
}

// Multiple instances to show dropdown behavior
export const MultipleInstances: Story = {
  render: function Render(args) {
    return (
      <div className="space-y-4">
        <p className="text-gray-400 text-sm text-center mb-6">
          Multiple wallet dropdowns - only one opens at a time
        </p>
        <div className="flex justify-center gap-4">
          <WalletDropdown {...args} address="0x1111111111111111111111111111111111111111" />
          <WalletDropdown {...args} address="0x2222222222222222222222222222222222222222" />
          <WalletDropdown {...args} address="0x3333333333333333333333333333333333333333" />
        </div>
      </div>
    )
  },
  args: {
    mockFundWallet: true,
    onSignOut: () => console.log('Sign out clicked')
  }
}