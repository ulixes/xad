import { useEffect, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { verificationMachine } from '../state/machines/verificationMachine';

export function useVerificationMachine() {
  const [state, send] = useMachine(verificationMachine);

  // Listen to background events and forward them to state machine
  useEffect(() => {
    const handleBackgroundEvent = (message: any) => {
      if (message.type === 'BACKGROUND_EVENT') {
        console.log('🎯 Received background event:', message.eventType, message.payload);
        
        // Forward background events to state machine
        switch (message.eventType) {
          case 'NAVIGATION_DETECTED':
            console.log('📍 Navigation detected, transitioning state');
            send({ type: 'NAVIGATION_DETECTED', ...message.payload });
            break;
            
          case 'PROOF_DATA_EXTRACTED':
            console.log('📊 Proof data extracted:', message.payload.dataType);
            send({ type: 'PROOF_DATA_EXTRACTED', ...message.payload });
            break;
            
          case 'PROOF_COMPLETED':
            console.log('✅ Proof completed!');
            send({ type: 'PROOF_COMPLETED', ...message.payload });
            break;
            
          case 'PROOF_ERROR':
            console.log('❌ Proof error:', message.payload.error);
            send({ type: 'PROOF_ERROR', ...message.payload });
            break;

          case 'PROOF_TIMEOUT':
            console.log('⏰ Proof timeout');
            send({ type: 'PROOF_TIMEOUT', ...message.payload });
            break;

          default:
            console.log('🤷 Unknown background event:', message.eventType);
        }
      }

      // Handle direct background responses
      if (message.type === 'START_PROOF_SESSION' && message.success) {
        console.log('✅ Session started successfully (direct response)');
        send({ type: 'SESSION_STARTED' });
      }
      
      // Also handle SESSION_STARTED as a background event
      if (message.type === 'BACKGROUND_EVENT' && message.eventType === 'SESSION_STARTED') {
        console.log('✅ Session started successfully (background event)');
        send({ type: 'SESSION_STARTED' });
      }

      if (message.type === 'START_PROOF_SESSION' && !message.success) {
        console.log('❌ Session start failed');
        send({ type: 'SESSION_ERROR', error: 'Failed to start session' });
      }
    };

    console.log('🔌 Setting up background event listener');
    browser.runtime.onMessage.addListener(handleBackgroundEvent);
    
    return () => {
      console.log('🔌 Removing background event listener');
      browser.runtime.onMessage.removeListener(handleBackgroundEvent);
    };
  }, [send]);

  // Action creators
  const selectPlatform = useCallback((platform: string) => {
    console.log('🏷️ Platform selected:', platform);
    send({ type: 'SELECT_PLATFORM', platform });
  }, [send]);

  const selectContentType = useCallback((contentType: string) => {
    console.log('🎯 Content type selected:', contentType);
    send({ type: 'SELECT_CONTENT_TYPE', contentType });
  }, [send]);

  const startVerification = useCallback((platform: string, contentType: string, targetId: string) => {
    console.log('🚀 Starting verification:', platform, contentType, 'target:', targetId);
    send({ 
      type: 'START_VERIFICATION',
      platform,
      contentType,
      targetId
    });
  }, [send]);

  const retry = useCallback(() => {
    console.log('🔄 Retrying verification');
    send({ type: 'RETRY' });
  }, [send]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting verification');
    send({ type: 'RESET' });
  }, [send]);

  // Computed state values
  const currentState = state.value as string;
  const context = state.context;

  return {
    // State machine
    state,
    send,
    context,

    // Actions
    selectPlatform,
    selectContentType,
    startVerification,
    retry,
    reset,

    // State checks
    isIdle: state.matches('idle'),
    isPlatformSelection: state.matches('platform_selection'),
    isContentSelection: state.matches('content_selection'),
    isStartingSession: state.matches('starting_session'),
    isWaitingForNavigation: state.matches('waiting_for_navigation'),
    isCapturingData: state.matches('capturing_data'),
    isShowingResults: state.matches('showing_results'),
    isCompleted: state.matches('completed'),
    hasError: state.matches('error'),

    // Context data
    selectedPlatform: context.selectedPlatform,
    selectedContentType: context.selectedContentType,
    activeSessionId: context.activeSessionId,
    contextData: context.contextData,
    actionData: context.actionData,
    completedProof: context.completedProof,
    error: context.error,
    currentState,

    // Progress indicators
    hasContextData: !!context.contextData,
    hasActionData: !!context.actionData,
    progressPercentage: (() => {
      if (state.matches('idle')) return 0;
      if (state.matches('starting_session')) return 10;
      if (state.matches('waiting_for_navigation')) return 25;
      if (state.matches('capturing_data')) {
        let progress = 50;
        if (context.contextData) progress += 20;
        if (context.actionData) progress += 20;
        return progress;
      }
      if (state.matches('showing_results') || state.matches('completed')) return 100;
      return 0;
    })()
  };
}