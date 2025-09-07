import type { Meta, StoryObj } from '@storybook/react-vite'
import App from '../App'

const meta = {
  title: 'Pages/Landing Page',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const FullPage: Story = {
  args: {},
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}

export const EnglishVersion: Story = {
  name: 'English (Default)',
  args: {},
}

export const ChineseVersion: Story = {
  name: 'Mandarin (Coming Soon)',
  render: () => (
    <div className="relative">
      <App />
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg z-50">
        中文版即将推出 (Chinese version coming soon)
      </div>
    </div>
  ),
}