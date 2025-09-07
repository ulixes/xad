import type { Meta, StoryObj } from '@storybook/react-vite'
import LanguageSwitch from '../components/LanguageSwitch'

const meta = {
  title: 'Components/LanguageSwitch',
  component: LanguageSwitch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InCorner: Story = {
  decorators: [
    (Story) => (
      <div className="relative h-96 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
}