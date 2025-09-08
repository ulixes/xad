import type { Meta, StoryObj } from '@storybook/react'
import { WalletList } from './wallet-list'

const meta = {
  title: 'Wallet/WalletList',
  component: WalletList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onCopyAddress: {
      action: 'copy-address',
      description: 'Called when copy button is clicked'
    },
    onViewExternal: {
      action: 'view-external',
      description: 'Called when external view button is clicked'
    }
  }
} satisfies Meta<typeof WalletList>

export default meta
type Story = StoryObj<typeof meta>

const mockWallets = [
  {
    id: "1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    type: "embedded" as const,
    balance: "2.5"
  },
  {
    id: "2", 
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    type: "external" as const,
    balance: "0.75"
  }
]

export const WithWallets: Story = {
  args: {
    wallets: mockWallets,
    onCopyAddress: () => {},
    onViewExternal: () => {}
  },
}

export const SingleWallet: Story = {
  args: {
    wallets: [mockWallets[0]],
    onCopyAddress: () => {},
  },
}

export const NoWallets: Story = {
  args: {
    wallets: [],
    onCopyAddress: () => {},
  },
}

export const WithoutExternalView: Story = {
  args: {
    wallets: mockWallets,
    onCopyAddress: () => {},
  },
}