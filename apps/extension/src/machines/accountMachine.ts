import { setup, assign, sendParent, fromPromise } from 'xstate';
import { ProfileData } from '../types/verification';
import { VerificationService } from '../services/VerificationService';

// Types
interface AccountContext {
  id: string;
  platform: string;
  handle: string;
  availableActions: number;
  maxActions: number;
  profileData?: ProfileData;
  verificationError?: string;
  retryCount: number;
  maxRetries: number;
}

type AccountEvent =
  | { type: 'RETRY_VERIFICATION' }
  | { type: 'CONSUME_ACTION' }
  | { type: 'REFRESH_ACTIONS' }
  | { type: 'CLICK' };

interface AccountInput {
  id: string;
  platform: string;
  handle: string;
}

// Services
const verifyAccountService = fromPromise(async ({ input }: {
  input: { platform: string; handle: string }
}): Promise<ProfileData> => {
  console.log(`🔍 [AccountMachine] Verifying account for ${input.platform}: ${input.handle}`);
  
  // Use enhanced IG profile building for Instagram accounts
  if (input.platform === 'instagram') {
    console.log(`📸 [AccountMachine] Using enhanced IG profile building for ${input.handle}`);
    
    // Generate a user ID for this verification - in real implementation, get from user context
    const userId = `user_${Date.now()}`;
    
    try {
      const enhancedProfileData = await VerificationService.buildIGProfileComplete(input.handle, userId);
      
      // Transform enhanced profile data to standard ProfileData format
      const profileData: ProfileData = {
        username: enhancedProfileData.profileData?.username || input.handle,
        fullName: enhancedProfileData.profileData?.fullName || '',
        biography: enhancedProfileData.profileData?.biography || '',
        isVerified: enhancedProfileData.profileData?.isVerified || false,
        followerCount: enhancedProfileData.profileData?.followerCount || 0,
        followingCount: enhancedProfileData.profileData?.followingCount || 0,
        mediaCount: enhancedProfileData.profileData?.mediaCount || 0,
        profilePicUrl: enhancedProfileData.profileData?.profilePicUrl || '',
        accountType: enhancedProfileData.profileData?.accountType || 1,
        isPrivate: enhancedProfileData.profileData?.isPrivate || false,
        isBusiness: enhancedProfileData.profileData?.isBusiness || false,
        category: enhancedProfileData.profileData?.category,
        externalUrl: enhancedProfileData.profileData?.externalUrl,
      };
      
      // Store enhanced data for later use (business insights, audience data, etc.)
      console.log(`✅ [AccountMachine] Enhanced IG profile data collected:`, {
        basicProfile: profileData,
        businessInsights: enhancedProfileData.businessInsights,
        audienceData: enhancedProfileData.audienceData,
        processingTime: enhancedProfileData.processingDuration
      });
      
      return profileData;
    } catch (error) {
      console.error(`❌ [AccountMachine] Enhanced IG profile building failed, falling back to basic:`, error);
      // Fallback to basic verification
      return await VerificationService.startVerification(input.platform, input.handle);
    }
  }
  
  // Use legacy verification for other platforms
  console.log(`🔍 [AccountMachine] Using legacy verification for ${input.platform}: ${input.handle}`);
  return await VerificationService.startVerification(input.platform, input.handle);
});

// Machine definition
export const accountMachine = setup({
  types: {
    context: {} as AccountContext,
    events: {} as AccountEvent,
    input: {} as AccountInput,
  },
  actors: {
    verifyAccount: verifyAccountService,
  },
  guards: {
    canRetry: ({ context }) => {
      return context.retryCount < context.maxRetries;
    },

    hasAvailableActions: ({ context }) => {
      return context.availableActions > 0;
    },
  },
  delays: {
    // Exponential backoff with max delay of 10 seconds
    RETRY_DELAY: ({ context }) => {
      const baseDelay = 1000; // 1 second
      const maxDelay = 10000; // 10 seconds
      const delay = Math.min(baseDelay * Math.pow(2, context.retryCount), maxDelay);
      console.log(`Retrying verification in ${delay}ms (attempt ${context.retryCount + 1})`);
      return delay;
    },
  },
  actions: {
    incrementRetryCount: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),

    resetRetryCount: assign({
      retryCount: 0,
    }),

    setVerificationSuccess: assign({
      profileData: ({ event, context }) => {
        // Don't use assertEvent here as the event type includes the actor ID
        if (event.type.includes('xstate.done.actor')) {
          console.log(`✅ Account ${context.id} verification successful, transitioning to verified`);
          return (event as any).output;
        }
        return undefined;
      },
      availableActions: ({ context }) => {
        console.log(`🎯 Setting available actions for ${context.id} to ${context.maxActions}`);
        return context.maxActions; // Start with max actions
      },
      verificationError: undefined,
    }),

    setVerificationError: assign({
      verificationError: ({ event }) => {
        // Don't use assertEvent here as the event type includes the actor ID
        if (event.type.includes('xstate.error.actor')) {
          return (event as any).error?.message || 'Verification failed';
        }
        return 'Verification failed';
      },
      profileData: undefined,
      availableActions: 0,
    }),

    consumeAction: assign({
      availableActions: ({ context }) => Math.max(0, context.availableActions - 1),
    }),

    refreshActions: assign({
      availableActions: ({ context }) => context.maxActions,
    }),

    // Parent notifications
    notifyVerified: sendParent(({ context }) => ({
      type: 'ACCOUNT_VERIFIED',
      accountId: context.id,
    })),

    notifyFailed: sendParent(({ context }) => ({
      type: 'ACCOUNT_FAILED',
      accountId: context.id,
      error: context.verificationError || 'Unknown error',
    })),

    notifyActionConsumed: sendParent(({ context }) => ({
      type: 'ACCOUNT_ACTION_CONSUMED',
      accountId: context.id,
    })),

    notifyClicked: sendParent(({ context }) => ({
      type: 'ACCOUNT_CLICKED',
      accountId: context.id,
      platform: context.platform,
      handle: context.handle,
    })),
  },
}).createMachine({
  id: 'account',
  initial: 'verifying',

  context: ({ input }) => ({
    id: input.id,
    platform: input.platform,
    handle: input.handle,
    availableActions: 0,
    maxActions: 5, // Platform-specific in production
    retryCount: 0,
    maxRetries: 3,
  }),

  states: {
    verifying: {
      entry: 'resetRetryCount',

      invoke: {
        src: 'verifyAccount',
        input: ({ context }) => ({
          platform: context.platform,
          handle: context.handle,
        }),
        onDone: {
          target: 'verified',
          actions: ['setVerificationSuccess', 'notifyVerified'],
        },
        onError: [
          {
            target: 'retrying',
            guard: 'canRetry',
            actions: ['setVerificationError', 'incrementRetryCount'],
          },
          {
            target: 'failed',
            actions: ['setVerificationError', 'notifyFailed'],
          },
        ],
      },
    },

    retrying: {
      after: {
        RETRY_DELAY: 'verifying',
      },

      on: {
        RETRY_VERIFICATION: 'verifying', // Allow manual retry
      },
    },

    verified: {
      on: {
        CONSUME_ACTION: [
          {
            guard: 'hasAvailableActions',
            actions: ['consumeAction', 'notifyActionConsumed'],
          },
          {
            // No actions available - could show error or request refresh
            actions: () => console.log('No actions available'),
          },
        ],

        REFRESH_ACTIONS: {
          actions: 'refreshActions',
        },

        CLICK: {
          actions: 'notifyClicked',
        },

        RETRY_VERIFICATION: 'verifying', // Allow re-verification
      },
    },

    failed: {
      on: {
        RETRY_VERIFICATION: 'verifying',

        CLICK: {
          // Even failed accounts can be clicked (e.g., to show error details)
          actions: 'notifyClicked',
        },
      },
    },
    
    exit: {
      entry: ({ context }) => {
        // Manual cleanup since 'cleanup' service isn't defined in actors
        console.log(`🧹 [AccountMachine] Cleaning up account ${context.id}`);
      },
      type: 'final',
    },
    
    final: {
      type: 'final',
    },
  },
});
