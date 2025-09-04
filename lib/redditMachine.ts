import { createMachine, assign, createActor } from 'xstate';

interface RedditContext {
  username: string | null;
  profileData: any | null;
  error: string | null;
}

type RedditEvent = 
  | { type: 'START' }
  | { type: 'PROFILE_CAPTURED'; data: { username: string; profileData: any } }
  | { type: 'VERIFY' }
  | { type: 'RETRY' }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; error: string };

export const redditMachine = createMachine({
  id: 'reddit',
  initial: 'idle',
  context: {
    username: null,
    profileData: null,
    error: null,
  } as RedditContext,
  states: {
    idle: {
      on: {
        START: 'opening'
      }
    },
    opening: {
      entry: 'openRedditTab',
      on: {
        PROFILE_CAPTURED: {
          target: 'verifying',
          actions: assign({
            username: ({ event }) => event.data.username,
            profileData: ({ event }) => event.data.profileData,
            error: null
          })
        },
        ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    verifying: {
      on: {
        VERIFY: 'saving',
        RETRY: 'opening'
      }
    },
    saving: {
      entry: 'saveToAPI',
      on: {
        COMPLETE: 'success',
        ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    success: {
      type: 'final'
    },
    error: {
      on: {
        RETRY: 'opening'
      }
    }
  }
});

export const createRedditActor = () => {
  return createActor(redditMachine, {
    actions: {
      openRedditTab: () => {
        // Start network capture and open Reddit tab
        chrome.runtime.sendMessage({ type: 'START_REDDIT_CAPTURE' });
        chrome.tabs.create({ 
          url: 'https://www.reddit.com/user/me/', 
          active: true 
        });
      },
      saveToAPI: ({ context }) => {
        // This will be handled in the React component
      }
    }
  });
};