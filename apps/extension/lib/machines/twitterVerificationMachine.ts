import { createMachine, assign } from 'xstate'

export interface TwitterVerificationContext {
  tweetId: string | null
  targetUrl: string | null
  currentTab: chrome.tabs.Tab | null
  evidence: any | null
  error: string | null
  guidanceStep: string | null
  guidanceMessage: string | null
}

export type TwitterVerificationEvent =
  | { type: 'START_VERIFICATION'; tweetId: string; targetUrl: string }
  | { type: 'TAB_DETECTED'; tab: chrome.tabs.Tab }
  | { type: 'CONTENT_SCRIPT_READY' }
  | { type: 'CONTENT_SCRIPT_FAILED'; error: string }
  | { type: 'USER_OPENED_TARGET_TWEET' }
  | { type: 'USER_LIKED_TWEET' }
  | { type: 'USER_VISITED_LIKES_PAGE' }
  | { type: 'EVIDENCE_CAPTURED'; evidence: any }
  | { type: 'VERIFICATION_FAILED'; error: string }
  | { type: 'RESET' }
  | { type: 'RETRY' }

export const twitterVerificationMachine = createMachine<TwitterVerificationContext, TwitterVerificationEvent>({
  id: 'twitterVerification',
  initial: 'idle',
  context: {
    tweetId: null,
    targetUrl: null,
    currentTab: null,
    evidence: null,
    error: null,
    guidanceStep: null,
    guidanceMessage: null,
  },
  states: {
    idle: {
      on: {
        START_VERIFICATION: {
          target: 'detecting_user_context',
          actions: assign({
            tweetId: ({ event }) => event.tweetId,
            targetUrl: ({ event }) => event.targetUrl,
            evidence: null,
            error: null,
          }),
        },
      },
    },

    detecting_user_context: {
      entry: assign({
        guidanceStep: 'detecting_context',
        guidanceMessage: 'Detecting your current browser context...',
      }),
      on: {
        TAB_DETECTED: [
          {
            target: 'checking_content_script',
            guard: ({ event }) => 
              event.tab.url?.includes('x.com') || event.tab.url?.includes('twitter.com'),
            actions: assign({
              currentTab: ({ event }) => event.tab,
              guidanceStep: 'on_twitter',
              guidanceMessage: 'Found you on Twitter! Setting up verification...',
            }),
          },
          {
            target: 'waiting_for_twitter_navigation',
            actions: assign({
              currentTab: ({ event }) => event.tab,
              guidanceStep: 'need_twitter',
              guidanceMessage: 'Please open the target tweet to start verification',
            }),
          },
        ],
        VERIFICATION_FAILED: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },

    waiting_for_twitter_navigation: {
      entry: assign({
        guidanceStep: 'open_target_tweet',
        guidanceMessage: 'Click "Open Tweet" to navigate to the target tweet',
      }),
      on: {
        USER_OPENED_TARGET_TWEET: {
          target: 'checking_content_script',
          actions: assign({
            guidanceStep: 'opened_tweet',
            guidanceMessage: 'Great! Now setting up verification...',
          }),
        },
        RETRY: 'detecting_user_context',
      },
    },

    checking_content_script: {
      entry: assign({
        guidanceStep: 'checking_content_script',
        guidanceMessage: 'Checking Twitter page setup...',
      }),
      on: {
        CONTENT_SCRIPT_READY: {
          target: 'ready_for_interaction',
          actions: assign({
            guidanceStep: 'content_script_ready',
            guidanceMessage: 'Perfect! Now like the tweet and visit your likes page',
          }),
        },
        CONTENT_SCRIPT_FAILED: {
          target: 'content_script_error',
          actions: assign({
            error: ({ event }) => event.error,
            guidanceStep: 'refresh_needed',
            guidanceMessage: 'Please refresh the Twitter page and try again',
          }),
        },
      },
    },

    content_script_error: {
      on: {
        RETRY: 'checking_content_script',
        RESET: 'idle',
      },
    },

    ready_for_interaction: {
      entry: assign({
        guidanceStep: 'ready_for_interaction',
        guidanceMessage: 'Like the tweet, then visit your likes page (x.com/username/likes)',
      }),
      on: {
        TWEET_LIKED: {
          target: 'waiting_for_likes_page',
          actions: assign({
            guidanceStep: 'liked_tweet',
            guidanceMessage: '✅ Tweet liked! Now visit your likes page to complete verification',
          }),
        },
        USER_LIKED_TWEET: {
          target: 'waiting_for_likes_page',
          actions: assign({
            guidanceStep: 'liked_tweet',
            guidanceMessage: 'Great! Now visit your likes page to complete verification',
          }),
        },
        USER_VISITED_LIKES_PAGE: {
          target: 'monitoring_api',
          actions: assign({
            guidanceStep: 'monitoring_api',
            guidanceMessage: 'Monitoring Twitter API for verification...',
          }),
        },
      },
    },

    waiting_for_likes_page: {
      entry: assign({
        guidanceStep: 'waiting_for_likes_page',
        guidanceMessage: 'Now visit your likes page: x.com/username/likes',
      }),
      on: {
        USER_VISITED_LIKES_PAGE: {
          target: 'monitoring_api',
          actions: assign({
            guidanceStep: 'monitoring_api',
            guidanceMessage: 'Monitoring Twitter API for verification...',
          }),
        },
      },
    },

    monitoring_api: {
      entry: assign({
        guidanceStep: 'monitoring_api',
        guidanceMessage: 'Scanning Twitter API responses for evidence...',
      }),
      after: {
        30000: {
          target: 'timeout',
          actions: assign({
            error: 'Verification timeout - please ensure you liked the tweet and visited your likes page',
          }),
        },
      },
      on: {
        EVIDENCE_CAPTURED: {
          target: 'verified',
          actions: assign({
            evidence: ({ event }) => event.evidence,
            guidanceStep: 'verified',
            guidanceMessage: 'Verification complete! Like detected successfully',
          }),
        },
        VERIFICATION_FAILED: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },

    verified: {
      entry: assign({
        guidanceStep: 'success',
        guidanceMessage: 'Successfully verified your Twitter like!',
      }),
      type: 'final',
    },

    timeout: {
      entry: assign({
        guidanceStep: 'timeout',
        guidanceMessage: 'Verification timed out. You can retry or submit manually.',
      }),
      on: {
        RETRY: 'detecting_user_context',
        RESET: 'idle',
      },
    },

    failed: {
      entry: assign({
        guidanceStep: 'failed',
        guidanceMessage: ({ context }) => context.error || 'Verification failed',
      }),
      on: {
        RETRY: 'detecting_user_context',
        RESET: 'idle',
      },
    },
  },
})