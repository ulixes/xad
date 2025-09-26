/**
 * Simple emoji comment purchasing
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MockWalletProvider } from './decorators/MockWalletProvider';

const meta = {
  title: 'Forms/AdTargetingForm/EmojiComments',
  component: SimpleEmojiComments,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Buy emoji comments - pick emojis that will randomly appear in comments'
      }
    }
  },
  decorators: [
    (Story) => (
      <MockWalletProvider>
        <div className="w-full max-w-md mx-auto p-4">
          <Story />
        </div>
      </MockWalletProvider>
    )
  ],
} satisfies Meta<typeof SimpleEmojiComments>;

export default meta;
type Story = StoryObj<typeof SimpleEmojiComments>;

function SimpleEmojiComments() {
  const [selectedEmojis, setSelectedEmojis] = useState(['🔥', '😍', '💯']);
  const [quantity, setQuantity] = useState('50');
  const allEmojis = ['🔥', '😍', '💯', '🤩', '👏', '❤️', '😂', '🙌', '💪', '✨', '🎉', '🚀'];
  
  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis(prev => 
      prev.includes(emoji) 
        ? prev.filter(e => e !== emoji)
        : [...prev, emoji]
    );
  };

  const price = Number(quantity) * 0.15 || 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Buy Emoji Comments</h1>
      </div>

      {/* TikTok URL */}
      <div>
        <Label>TikTok Video URL</Label>
        <Input 
          placeholder="https://tiktok.com/@user/video/123" 
          className="mt-1"
        />
      </div>

      {/* Emoji Selection */}
      <div>
        <Label>Select Emojis for Comments</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {allEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleEmoji(emoji)}
              className={`text-2xl p-2 rounded border-2 ${
                selectedEmojis.includes(emoji)
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {selectedEmojis.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Each comment will use one of: {selectedEmojis.join(' ')}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <Label>Number of Comments</Label>
        <Input 
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="50"
          min="1"
          className="mt-1"
        />
      </div>

      {/* Price */}
      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="text-xl font-bold">${price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {quantity || '0'} comments × $0.15
        </p>
      </div>

      <Button 
        className="w-full" 
        size="lg"
        disabled={!selectedEmojis.length || !quantity || quantity === '0'}
      >
        Buy {quantity} Comments
      </Button>
    </div>
  );
}

export const Default: Story = {
  name: 'Simple Form'
};

export const HowItWorks: Story = {
  name: 'Example Output',
  render: () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold mb-2">You selected: 🔥 😍 💯</h2>
        <p className="text-sm text-muted-foreground">50 comments ordered</p>
      </div>
      
      <div className="border rounded-lg p-3">
        <p className="text-sm font-medium mb-2">Comments will look like:</p>
        <div className="space-y-1 text-sm">
          <div>@user1: 🔥</div>
          <div>@user2: 😍</div>
          <div>@user3: 🔥</div>
          <div>@user4: 💯</div>
          <div>@user5: 😍</div>
          <div>@user6: 💯</div>
          <div>@user7: 🔥</div>
          <div className="text-muted-foreground">... randomly distributed</div>
        </div>
      </div>
    </div>
  )
};