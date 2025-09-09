import React, { useEffect } from 'react';
import { useVerificationMachine } from '../hooks/useVerificationMachine';
import { VerificationFlow, PlatformSelector } from '@xad/ui';

export function VerificationManager() {
  const {
    currentState,
    isIdle,
    isPlatformSelection,
    isContentSelection,
    isStartingSession, 
    isWaitingForNavigation,
    isCapturingData,
    isShowingResults,
    isCompleted,
    hasError,
    completedProof,
    error,
    contextData,
    actionData,
    selectedPlatform,
    selectedContentType,
    selectPlatform,
    selectContentType,
    startVerification,
    retry,
    reset
  } = useVerificationMachine();

  const targetTweetId = '1964998552331125110';
  const targetUsername = 'zkPass'; // Target user to verify following

  // Debug logging
  console.log('🎭 VerificationManager state:', {
    currentState,
    isShowingResults,
    isCompleted,
    hasError,
    completedProof: !!completedProof
  });

  // Remove auto-start logic - user will select platform/content type manually

  // Get descriptions from state once
  const getNavigateDescription = () => {
    switch (selectedContentType) {
      case 'comment': return 'Go to the Twitter user\'s replies page';
      case 'follow': return 'Go to the Twitter user\'s following page';
      case 'retweet': return 'Go to the Twitter user\'s replies page';
      default: return 'Go to the Twitter user\'s likes page';
    }
  };

  const getCaptureDescription = () => {
    switch (selectedContentType) {
      case 'comment': return 'Detecting comments and verifying target tweet';
      case 'follow': return 'Detecting follows and verifying target user';
      case 'retweet': return 'Detecting retweets and verifying target tweet';
      default: return 'Detecting likes and verifying target tweet';
    }
  };

  const getTargetUrl = () => {
    switch (selectedContentType) {
      case 'comment': return 'https://x.com/[username]/with_replies';
      case 'follow': return 'https://x.com/[username]/following';
      case 'retweet': return 'https://x.com/[username]/with_replies';
      default: return 'https://x.com/[username]/likes';
    }
  };

  // Create verification flow object for UI component
  const verificationFlow = {
    platform: 'x' as const,
    contentType: (selectedContentType || 'like') as const,
    currentStep: getCurrentStep(),
    steps: [
      {
        id: 'start',
        status: isIdle ? 'pending' : 'completed' as const,
        title: 'Start Verification',
        description: 'Initialize proof session'
      },
      {
        id: 'navigate', 
        status: isWaitingForNavigation ? 'active' : 
               (isCapturingData || isShowingResults || isCompleted) ? 'completed' : 'pending' as const,
        title: 'Navigate to Target Page',
        description: getNavigateDescription()
      },
      {
        id: 'capture',
        status: isCapturingData ? 'active' :
               (isShowingResults || isCompleted) ? 'completed' : 'pending' as const,
        title: 'Capture Proof Data',
        description: getCaptureDescription()
      },
      {
        id: 'complete',
        status: (isShowingResults || isCompleted) ? 'completed' : 'pending' as const,
        title: 'Verification Complete',
        description: 'Proof collection finished'
      }
    ],
    targetUrl: getTargetUrl(),
    contextData: contextData ? {
      id: contextData.id || 'unknown',
      username: contextData.handle || 'unknown',
      displayName: contextData.name || 'Unknown User',
      avatarUrl: contextData.avatar || '',
      verified: contextData.verified || false,
      followers: contextData.followers || 0,
      following: contextData.following || 0
    } : null,
    result: completedProof ? {
      proofResult: completedProof.action?.proofResult || false,
      targetId: selectedContentType === 'follow' ? targetUsername : targetTweetId,
      totalItems: completedProof.action?.totalLikes || completedProof.action?.totalComments || completedProof.action?.totalFollowing || completedProof.action?.totalRetweets || 0,
      timestamp: new Date(completedProof.timestamp || Date.now()).toISOString()
    } : undefined
  };

  function getCurrentStep(): number {
    if (isIdle) return 0;
    if (isStartingSession || isWaitingForNavigation) return 1;
    if (isCapturingData) return 2;
    if (isShowingResults || isCompleted) return 3;
    return 0;
  }

  const handleStepAction = (stepId: string) => {
    if (stepId === 'navigate') {
      window.open('https://x.com', '_blank');
    }
  };

  const handleComplete = () => {
    console.log('Verification completed - staying on results');
    // Don't auto-reset, let user manually start new verification
  };

  const handleCancel = () => {
    console.log('Verification cancelled');
    reset();
  };

  const handleStartVerification = () => {
    if (selectedPlatform && selectedContentType) {
      console.log('Starting verification:', selectedPlatform, selectedContentType);
      const targetId = selectedContentType === 'follow' ? targetUsername : targetTweetId;
      console.log('🎯 Target ID for verification:', targetId);
      startVerification(selectedPlatform, selectedContentType, targetId);
    } else {
      console.log('Cannot start verification - missing data:', { selectedPlatform, selectedContentType });
    }
  };

  // Platform Selection Screen
  if (isPlatformSelection || isContentSelection) {
    return (
      <PlatformSelector
        selectedPlatform={selectedPlatform}
        selectedContentType={selectedContentType}
        onPlatformSelect={selectPlatform}
        onContentTypeSelect={selectContentType}
        onStartVerification={handleStartVerification}
      />
    );
  }

  // Don't render anything if there's an error without completed proof
  if (hasError && !completedProof) {
    return null;
  }

  // Show VerificationFlow for active verification or results
  return (
    <VerificationFlow
      flow={verificationFlow}
      onStepAction={handleStepAction}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}