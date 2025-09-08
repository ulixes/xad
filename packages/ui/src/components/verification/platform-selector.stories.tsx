import type { Meta, StoryObj } from '@storybook/react';
import { PlatformSelector } from './platform-selector';
import { Platform, ContentType } from '@/types/proof-config';
import { useState } from 'react';

const meta = {
  title: 'Verification/PlatformSelector',
  component: PlatformSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlatformSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const PlatformSelectorWrapper = (args: any) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | undefined>(args.selectedPlatform);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | undefined>(args.selectedContentType);

  return (
    <div className="w-full max-w-4xl">
      <PlatformSelector
        {...args}
        selectedPlatform={selectedPlatform}
        selectedContentType={selectedContentType}
        onPlatformSelect={setSelectedPlatform}
        onContentTypeSelect={setSelectedContentType}
        onStartVerification={() => console.log('Starting verification:', selectedPlatform, selectedContentType)}
      />
    </div>
  );
};

export const Default: Story = {
  render: PlatformSelectorWrapper,
  args: {},
};

export const WithXSelected: Story = {
  render: PlatformSelectorWrapper,
  args: {
    selectedPlatform: 'x' as Platform,
  },
};

export const WithXLikeSelected: Story = {
  render: PlatformSelectorWrapper,
  args: {
    selectedPlatform: 'x' as Platform,
    selectedContentType: 'like' as ContentType,
  },
};

export const WithInstagramSelected: Story = {
  render: PlatformSelectorWrapper,
  args: {
    selectedPlatform: 'instagram' as Platform,
  },
};

export const WithTikTokFollowSelected: Story = {
  render: PlatformSelectorWrapper,
  args: {
    selectedPlatform: 'tiktok' as Platform,
    selectedContentType: 'follow' as ContentType,
  },
};

export const WithLinkedInShareSelected: Story = {
  render: PlatformSelectorWrapper,
  args: {
    selectedPlatform: 'linkedin' as Platform,
    selectedContentType: 'share' as ContentType,
  },
};

export const AllPlatformsShowcase: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">X (Twitter) Platform</h3>
        <PlatformSelectorWrapper selectedPlatform="x" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Instagram Platform</h3>
        <PlatformSelectorWrapper selectedPlatform="instagram" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">TikTok Platform</h3>
        <PlatformSelectorWrapper selectedPlatform="tiktok" />
      </div>
    </div>
  ),
};