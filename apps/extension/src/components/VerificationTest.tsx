import React from 'react';
import { useVerificationMachine } from '../hooks/useVerificationMachine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@xad/ui';
import { Button } from '@xad/ui';
import { Badge } from '@xad/ui';
import { Alert, AlertDescription } from '@xad/ui';
import { CheckCircle, Clock, AlertCircle, Play, RotateCcw, Home } from 'lucide-react';

export function VerificationTest() {
  const {
    currentState,
    isIdle,
    isStartingSession,
    isWaitingForNavigation,
    isCapturingData,
    isCompleted,
    hasError,
    selectedPlatform,
    selectedContentType,
    activeSessionId,
    contextData,
    actionData,
    completedProof,
    error,
    progressPercentage,
    selectPlatform,
    selectContentType,
    startVerification,
    retry,
    reset
  } = useVerificationMachine();

  const getStateIcon = () => {
    if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getStateColor = () => {
    if (isCompleted) return 'text-green-600';
    if (hasError) return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStateIcon()}
            Verification State Test
          </CardTitle>
          <CardDescription>
            Testing the generic proof detection engine
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current State */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current State:</span>
            <Badge variant="outline" className={getStateColor()}>
              {currentState}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Session Info */}
          {activeSessionId && (
            <div className="text-xs text-muted-foreground">
              Session: {activeSessionId}
            </div>
          )}

          {/* Error Display */}
          {hasError && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* State-specific UI */}
          {isIdle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectPlatform('x')}
                  className={selectedPlatform === 'x' ? 'bg-blue-50' : ''}
                >
                  X (Twitter)
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => selectContentType('like')}
                  className={selectedContentType === 'like' ? 'bg-blue-50' : ''}
                >
                  Like
                </Button>
              </div>
              
              <Button
                onClick={() => startVerification('x', 'like')}
                disabled={!selectedPlatform || !selectedContentType}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start X Likes Verification
              </Button>
            </div>
          )}

          {isStartingSession && (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Starting verification session...
              </p>
            </div>
          )}

          {isWaitingForNavigation && (
            <div className="text-center py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Navigate to Target Page</p>
                <p className="text-xs text-muted-foreground">
                  Go to a Twitter user's likes page (x.com/username/likes)
                </p>
                <p className="text-xs text-blue-600">
                  Background script is monitoring for navigation...
                </p>
              </div>
            </div>
          )}

          {isCapturingData && (
            <div className="space-y-3">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Capturing Proof Data</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded border ${contextData ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                  <span className={contextData ? 'text-green-700' : 'text-gray-500'}>
                    Context Data {contextData ? '✓' : '⏳'}
                  </span>
                </div>
                <div className={`p-2 rounded border ${actionData ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                  <span className={actionData ? 'text-green-700' : 'text-gray-500'}>
                    Action Data {actionData ? '✓' : '⏳'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isCompleted && completedProof && (
            <div className="space-y-3">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Verification Complete!</p>
              </div>
              
              <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
                <div><strong>Type:</strong> {completedProof.type}</div>
                <div><strong>Platform:</strong> {completedProof.platform}</div>
                <div><strong>Content Type:</strong> {completedProof.contentType}</div>
                <div><strong>Timestamp:</strong> {new Date(completedProof.timestamp).toLocaleTimeString()}</div>
                <div><strong>Context:</strong> {JSON.stringify(completedProof.context).slice(0, 100)}...</div>
                <div><strong>Actions:</strong> {completedProof.action.length} items</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {hasError && (
              <Button onClick={retry} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
            
            {(hasError || isCompleted) && (
              <Button onClick={reset} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}