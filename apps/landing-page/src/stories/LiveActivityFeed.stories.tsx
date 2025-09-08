import type { Meta, StoryObj } from '@storybook/react';
import LiveActivityFeed from '../components/LiveActivityFeed';

const meta = {
  title: 'Components/LiveActivityFeed',
  component: LiveActivityFeed,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const DarkBackground: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <Story />
      </div>
    ),
  ],
};

export const InCard: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <div className="bg-card rounded-2xl p-6 max-w-3xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};