import { assign, createMachine } from 'xstate';
import { VerificationState, type VerificationContext, type VerificationEvent } from '../../types/verification';

export const verificationMachine = createMachine({
  id: 'verification',
  types: {
    context: {} as VerificationContext,
    events: {} as VerificationEvent,
  },
  initial: VerificationState.PLATFORM_SELECTION,
  context: {
    selectedPlatform: null,
    selectedContentType: null,
    targetId: null,
    activeSessionId: null,
    proofConfig: null,
    contextData: null,
    actionData: null,
    completedProof: null,
    error: null
  },
  states: {
    [VerificationState.IDLE]: {
      entry: assign({
        error: null,
        targetId: null,
        activeSessionId: null,
        contextData: null,
        actionData: null,
        completedProof: null
      }),
      on: {
        RESET: {
          target: VerificationState.PLATFORM_SELECTION
        }
      }
    },

    [VerificationState.PLATFORM_SELECTION]: {
      entry: assign({
        selectedPlatform: null,
        selectedContentType: null,
        error: null
      }),
      on: {
        SELECT_PLATFORM: {
          target: VerificationState.CONTENT_SELECTION,
          actions: assign({
            selectedPlatform: ({ event }) => event.platform
          })
        }
      }
    },

    [VerificationState.CONTENT_SELECTION]: {
      on: {
        SELECT_CONTENT_TYPE: {
          target: VerificationState.STARTING_SESSION,
          actions: assign({
            selectedContentType: ({ event }) => event.contentType,
            targetId: ({ event, context }) => {
              // Set default targets based on content type
              if (event.contentType === 'follow') {
                return 'zkPass';  // Default target for follow verification
              } else {
                return '1964998552331125110';  // Default target for likes/comments/retweets
              }
            },
            activeSessionId: () => `session_${Date.now()}`,
            error: null
          })
        },
        START_VERIFICATION: {
          target: VerificationState.STARTING_SESSION,
          actions: assign({
            targetId: ({ event }) => event.targetId,
            activeSessionId: () => `session_${Date.now()}`,
            error: null
          })
        },
        BACK_TO_PLATFORM_SELECTION: {
          target: VerificationState.PLATFORM_SELECTION
        }
      }
    },
    
    [VerificationState.STARTING_SESSION]: {
      entry: 'sendSessionStartToBackground',
      after: {
        5000: {
          target: VerificationState.ERROR,
          actions: assign({
            error: 'Session start timeout - background script may not be responding'
          })
        }
      },
      on: {
        SESSION_STARTED: {
          target: VerificationState.WAITING_FOR_NAVIGATION
        },
        SESSION_ERROR: {
          target: VerificationState.ERROR,
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    
    [VerificationState.WAITING_FOR_NAVIGATION]: {
      after: {
        60000: {
          target: VerificationState.ERROR,
          actions: assign({
            error: 'Navigation timeout - please navigate to the target page'
          })
        }
      },
      on: {
        NAVIGATION_DETECTED: {
          target: VerificationState.CAPTURING_DATA
        },
        PROOF_TIMEOUT: {
          target: VerificationState.ERROR,
          actions: assign({
            error: 'Proof collection timeout'
          })
        }
      }
    },
    
    [VerificationState.CAPTURING_DATA]: {
      after: {
        30000: {
          target: VerificationState.ERROR,
          actions: assign({
            error: 'Data capture timeout - no GraphQL responses detected'
          })
        }
      },
      on: {
        PROOF_DATA_EXTRACTED: {
          actions: assign(({ context, event }) => {
            console.log('Proof data extracted:', event.dataType, event.data);
            if (event.dataType === 'context') {
              return { contextData: event.data };
            } else if (event.dataType === 'action') {
              return { actionData: event.data };
            }
            return {};
          })
        },
        PROOF_COMPLETED: {
          target: VerificationState.SHOWING_RESULTS,
          actions: assign({
            completedProof: ({ event }) => event.proof,
            activeSessionId: null
          })
        },
        PROOF_ERROR: {
          target: VerificationState.ERROR,
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    
    [VerificationState.SHOWING_RESULTS]: {
      entry: 'endSession',
      on: {
        RESET: {
          target: VerificationState.PLATFORM_SELECTION
        },
        START_VERIFICATION: {
          target: VerificationState.STARTING_SESSION,
          actions: assign({
            selectedPlatform: ({ event }) => event.platform,
            selectedContentType: ({ event }) => event.contentType,
            targetId: ({ event }) => event.targetId,
            activeSessionId: () => `session_${Date.now()}`,
            error: null,
            completedProof: null
          })
        }
      }
    },
    
    [VerificationState.COMPLETED]: {
      entry: 'endSession',
      on: {
        RESET: {
          target: VerificationState.PLATFORM_SELECTION
        }
      }
    },
    
    [VerificationState.ERROR]: {
      entry: 'endSession',
      on: {
        RETRY: {
          target: VerificationState.STARTING_SESSION,
          actions: assign({
            error: null,
            activeSessionId: () => `session_${Date.now()}`
          })
        },
        RESET: {
          target: VerificationState.PLATFORM_SELECTION
        }
      }
    }
  }
}, {
  actions: {
    sendSessionStartToBackground: ({ context }) => {
      const proofType = `${context.selectedPlatform}_${context.selectedContentType}`.toUpperCase();
      console.log('Sending session start to background:', {
        sessionId: context.activeSessionId,
        proofType,
        targetId: context.targetId
      });
      
      // Send message to background script - let background resolve config from registry
      browser.runtime.sendMessage({
        type: 'START_PROOF_SESSION',
        sessionId: context.activeSessionId,
        proofType,
        targetId: context.targetId
      }).then(() => {
        console.log('Session start message sent successfully');
      }).catch((error) => {
        console.error('Failed to send session start message:', error);
      });
    },
    
    endSession: ({ context }) => {
      if (context.activeSessionId) {
        browser.runtime.sendMessage({
          type: 'END_PROOF_SESSION',
          sessionId: context.activeSessionId
        }).catch((error) => {
          console.warn('Failed to end session:', error);
        });
      }
    }
  }
});