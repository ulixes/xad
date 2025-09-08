import { 
  TwitterLogo, 
  InstagramLogo, 
  FacebookLogo, 
  LinkedinLogo, 
  TiktokLogo,
  Heart,
  ChatCircle,
  UserPlus,
  Repeat,
  Share,
  Check,
  Clock,
  X,
  Warning
} from '@phosphor-icons/react';
import { PlatformConfig, ContentTypeConfig } from '@/types/proof-config';

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: 'x',
    displayName: 'X (Twitter)',
    icon: TwitterLogo,
    color: '#1DA1F2',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific post or tweet',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Comment',
        description: 'Reply to a specific post or tweet',
        icon: ChatCircle,
        available: true
      },
      {
        type: 'follow',
        label: 'Follow',
        description: 'Follow a specific account',
        icon: UserPlus,
        available: true
      },
      {
        type: 'retweet',
        label: 'Retweet',
        description: 'Retweet a specific post',
        icon: Repeat,
        available: true
      }
    ]
  },
  {
    platform: 'instagram',
    displayName: 'Instagram',
    icon: InstagramLogo,
    color: '#E4405F',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific post',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Comment',
        description: 'Comment on a specific post',
        icon: ChatCircle,
        available: true
      },
      {
        type: 'follow',
        label: 'Follow',
        description: 'Follow a specific account',
        icon: UserPlus,
        available: true
      },
      {
        type: 'story_share',
        label: 'Story Share',
        description: 'Share content to your story',
        icon: Share,
        available: false
      }
    ]
  },
  {
    platform: 'tiktok',
    displayName: 'TikTok',
    icon: TiktokLogo,
    color: '#000000',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific video',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Comment',
        description: 'Comment on a specific video',
        icon: ChatCircle,
        available: true
      },
      {
        type: 'follow',
        label: 'Follow',
        description: 'Follow a specific account',
        icon: UserPlus,
        available: true
      },
      {
        type: 'share',
        label: 'Share',
        description: 'Share a specific video',
        icon: Share,
        available: false
      }
    ]
  },
  {
    platform: 'facebook',
    displayName: 'Facebook',
    icon: FacebookLogo,
    color: '#1877F2',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific post',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Comment',
        description: 'Comment on a specific post',
        icon: ChatCircle,
        available: false
      },
      {
        type: 'share',
        label: 'Share',
        description: 'Share a specific post',
        icon: Share,
        available: false
      }
    ]
  },
  {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    icon: LinkedinLogo,
    color: '#0A66C2',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific post',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Comment',
        description: 'Comment on a specific post',
        icon: ChatCircle,
        available: false
      },
      {
        type: 'follow',
        label: 'Follow',
        description: 'Follow a specific account',
        icon: UserPlus,
        available: false
      }
    ]
  },
  {
    platform: 'farcaster',
    displayName: 'Farcaster',
    icon: Share,
    color: '#8A63D2',
    contentTypes: [
      {
        type: 'like',
        label: 'Like',
        description: 'Like a specific cast',
        icon: Heart,
        available: true
      },
      {
        type: 'comment',
        label: 'Reply',
        description: 'Reply to a specific cast',
        icon: ChatCircle,
        available: true
      },
      {
        type: 'follow',
        label: 'Follow',
        description: 'Follow a specific account',
        icon: UserPlus,
        available: true
      }
    ]
  }
];

export const VERIFICATION_STEP_ICONS = {
  pending: Clock,
  active: Clock,
  completed: Check,
  error: Warning
};