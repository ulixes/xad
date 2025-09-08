import type { Meta, StoryObj } from '@storybook/react';
import { VerificationFlow } from './verification-flow';
import { VerificationFlow as VerificationFlowType } from '@/types/proof-config';

const meta = {
  title: 'Verification/VerificationFlow',
  component: VerificationFlow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VerificationFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUserContext = {
  id: 'user123',
  username: 'johndoe',
  displayName: 'John Doe',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  verified: true,
  followers: 12500,
  following: 840
};

const xLikeFlow: VerificationFlowType = {
  platform: 'x',
  contentType: 'like',
  currentStep: 1,
  targetUrl: 'https://x.com/elonmusk/likes',
  contextData: mockUserContext,
  steps: [
    {
      id: 'navigate',
      status: 'completed',
      title: 'Navigate to Target URL',
      description: 'Navigate to your likes page on X'
    },
    {
      id: 'detect-context',
      status: 'active',
      title: 'Detect User Context',
      description: 'Detecting your user profile information from network requests'
    },
    {
      id: 'capture-proof',
      status: 'pending',
      title: 'Capture Proof Data',
      description: 'Scanning for your like activity to capture proof data'
    },
    {
      id: 'verify-proof',
      status: 'pending',
      title: 'Verify Proof',
      description: 'Verify the proof data and submit to blockchain'
    }
  ]
};

const instagramReelShareFlow: VerificationFlowType = {
  platform: 'instagram',
  contentType: 'reel_share',
  currentStep: 2,
  targetUrl: 'https://www.instagram.com/reels',
  contextData: {
    id: 'user456',
    username: 'jane_doe_photo',
    displayName: 'Jane Doe Photography',
    avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
    verified: false,
    followers: 5200,
    following: 1200
  },
  steps: [
    {
      id: 'navigate',
      status: 'completed',
      title: 'Navigate to Instagram',
      description: 'Navigate to Instagram reels page'
    },
    {
      id: 'detect-context',
      status: 'completed',
      title: 'User Context Detected',
      description: 'Successfully detected user profile'
    },
    {
      id: 'capture-proof',
      status: 'active',
      title: 'Capture Share Data',
      description: 'Scanning for your reel share activity to capture proof data'
    },
    {
      id: 'verify-proof',
      status: 'pending',
      title: 'Verify Proof',
      description: 'Verify the proof data and submit to blockchain'
    }
  ]
};

const tiktokFollowFlowWithError: VerificationFlowType = {
  platform: 'tiktok',
  contentType: 'follow',
  currentStep: 1,
  targetUrl: 'https://www.tiktok.com/@user',
  steps: [
    {
      id: 'navigate',
      status: 'completed',
      title: 'Navigate to TikTok',
      description: 'Navigate to the target TikTok profile'
    },
    {
      id: 'detect-context',
      status: 'error',
      title: 'User Context Detection Failed',
      description: 'Failed to detect user context from network requests',
      errorMessage: 'Unable to detect user profile. Please make sure you are logged in to TikTok.'
    },
    {
      id: 'capture-proof',
      status: 'pending',
      title: 'Capture Follow Data',
      description: 'Scanning for your follow activity to capture proof data'
    },
    {
      id: 'verify-proof',
      status: 'pending',
      title: 'Verify Proof',
      description: 'Verify the proof data and submit to blockchain'
    }
  ]
};

const linkedinShareCompleted: VerificationFlowType = {
  platform: 'linkedin',
  contentType: 'share',
  currentStep: 3,
  targetUrl: 'https://www.linkedin.com/posts/activity',
  contextData: {
    id: 'user789',
    username: 'alice-smith-dev',
    displayName: 'Alice Smith',
    avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4',
    verified: false,
    followers: 850,
    following: 200
  },
  steps: [
    {
      id: 'navigate',
      status: 'completed',
      title: 'Navigate to LinkedIn',
      description: 'Navigate to LinkedIn posts'
    },
    {
      id: 'detect-context',
      status: 'completed',
      title: 'User Context Detected',
      description: 'Successfully detected user profile'
    },
    {
      id: 'capture-proof',
      status: 'completed',
      title: 'Captured Share Data',
      description: 'Successfully captured proof data from your post share'
    },
    {
      id: 'verify-proof',
      status: 'completed',
      title: 'Proof Verified',
      description: 'Proof data verified and submitted to blockchain successfully'
    }
  ]
};

const farcasterCommentFlow: VerificationFlowType = {
  platform: 'farcaster',
  contentType: 'comment',
  currentStep: 0,
  targetUrl: 'https://warpcast.com/cast',
  steps: [
    {
      id: 'navigate',
      status: 'active',
      title: 'Navigate to Farcaster',
      description: 'Navigate to the target cast on Warpcast'
    },
    {
      id: 'detect-context',
      status: 'pending',
      title: 'Detect User Context',
      description: 'Detecting your Farcaster profile information'
    },
    {
      id: 'capture-proof',
      status: 'pending',
      title: 'Capture Comment Data',
      description: 'Scanning for your comment activity to capture proof data'
    },
    {
      id: 'verify-proof',
      status: 'pending',
      title: 'Verify Proof',
      description: 'Verify the proof data and submit to blockchain'
    }
  ]
};

export const XLikeVerification: Story = {
  args: {
    flow: xLikeFlow,
    onStepAction: (stepId: string) => console.log('Step action:', stepId),
    onComplete: () => console.log('Verification completed'),
    onCancel: () => console.log('Verification cancelled'),
  },
};

export const InstagramReelShare: Story = {
  args: {
    flow: instagramReelShareFlow,
    onStepAction: (stepId: string) => console.log('Step action:', stepId),
    onComplete: () => console.log('Verification completed'),
    onCancel: () => console.log('Verification cancelled'),
  },
};

export const TikTokFollowWithError: Story = {
  args: {
    flow: tiktokFollowFlowWithError,
    onStepAction: (stepId: string) => console.log('Step action:', stepId),
    onComplete: () => console.log('Verification completed'),
    onCancel: () => console.log('Verification cancelled'),
  },
};

export const LinkedInShareCompleted: Story = {
  args: {
    flow: linkedinShareCompleted,
    onStepAction: (stepId: string) => console.log('Step action:', stepId),
    onComplete: () => console.log('Verification completed'),
    onCancel: () => console.log('Verification cancelled'),
  },
};

export const FarcasterCommentStarting: Story = {
  args: {
    flow: farcasterCommentFlow,
    onStepAction: (stepId: string) => console.log('Step action:', stepId),
    onComplete: () => console.log('Verification completed'),
    onCancel: () => console.log('Verification cancelled'),
  },
};

export const AllPlatformFlows: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-xl font-bold mb-4">X Like Verification (In Progress)</h3>
        <VerificationFlow
          flow={xLikeFlow}
          onStepAction={(stepId) => console.log('X Step action:', stepId)}
          onComplete={() => console.log('X Verification completed')}
          onCancel={() => console.log('X Verification cancelled')}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Instagram Reel Share (Active)</h3>
        <VerificationFlow
          flow={instagramReelShareFlow}
          onStepAction={(stepId) => console.log('Instagram Step action:', stepId)}
          onComplete={() => console.log('Instagram Verification completed')}
          onCancel={() => console.log('Instagram Verification cancelled')}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">LinkedIn Share (Completed)</h3>
        <VerificationFlow
          flow={linkedinShareCompleted}
          onStepAction={(stepId) => console.log('LinkedIn Step action:', stepId)}
          onComplete={() => console.log('LinkedIn Verification completed')}
          onCancel={() => console.log('LinkedIn Verification cancelled')}
        />
      </div>
    </div>
  ),
};