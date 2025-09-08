import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PLATFORM_CONFIGS, VERIFICATION_STEP_ICONS } from '../../config/platform-configs';
import { VerificationFlow as VerificationFlowType, NormalizedUser } from '../../types/proof-config';
import { getUIText } from '../../config/ui-templates';
import { cn } from '@/lib/utils';

interface VerificationFlowProps {
  flow: VerificationFlowType;
  onStepAction?: (stepId: string) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  flow,
  onStepAction,
  onComplete,
  onCancel,
  className
}) => {
  const platformConfig = PLATFORM_CONFIGS.find(
    config => config.platform === flow.platform
  );

  const contentTypeConfig = platformConfig?.contentTypes.find(
    ct => ct.type === flow.contentType
  );

  const currentStep = flow.steps[flow.currentStep];
  const completedSteps = flow.steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / flow.steps.length) * 100;

  const getStepIcon = (step: any) => {
    if (step.icon) return step.icon;
    return VERIFICATION_STEP_ICONS[step.status] || VERIFICATION_STEP_ICONS.pending;
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {platformConfig && (
                <platformConfig.icon 
                  size={24} 
                  style={{ color: platformConfig.color }} 
                  weight="fill"
                />
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {platformConfig?.displayName} {contentTypeConfig?.label}
                </CardTitle>
                <CardDescription>
                  Verification in progress
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              {completedSteps}/{flow.steps.length} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Context Information */}
      {flow.contextData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Context</CardTitle>
            <CardDescription>
              Information about the account being verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={flow.contextData.avatarUrl} />
                <AvatarFallback>
                  {flow.contextData.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{flow.contextData.displayName}</h3>
                  {flow.contextData.verified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{flow.contextData.username}
                </p>
                {(flow.contextData.followers || flow.contextData.following) && (
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    {flow.contextData.followers && (
                      <span>{flow.contextData.followers.toLocaleString()} followers</span>
                    )}
                    {flow.contextData.following && (
                      <span>{flow.contextData.following.toLocaleString()} following</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Steps</CardTitle>
          <CardDescription>
            Follow these steps to complete your verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flow.steps.map((step, index) => {
            const StepIcon = getStepIcon(step);
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            const isError = step.status === 'error';
            
            return (
              <div key={step.id}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    isCompleted && "bg-green-100 border-green-600",
                    isActive && "bg-blue-100 border-blue-600",
                    isError && "bg-red-100 border-red-600",
                    step.status === 'pending' && "bg-gray-100 border-gray-300"
                  )}>
                    <StepIcon 
                      size={16} 
                      className={getStepStatusColor(step.status)}
                      weight={isCompleted || isActive ? "fill" : "regular"}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(
                        "font-medium",
                        isActive && "text-blue-600",
                        isCompleted && "text-green-600",
                        isError && "text-red-600"
                      )}>
                        {step.title}
                      </h4>
                      
                      {isActive && onStepAction && (
                        <Button 
                          size="sm" 
                          onClick={() => onStepAction(step.id)}
                        >
                          Continue
                        </Button>
                      )}
                    </div>
                    
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                    
                    {step.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">
                        {step.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                
                {index < flow.steps.length - 1 && (
                  <div className="ml-4 mt-2 mb-2">
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Target URL */}
      {flow.targetUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target URL</CardTitle>
            <CardDescription>
              Navigate to this URL to complete the verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono">
                {flow.targetUrl}
              </code>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(flow.targetUrl, '_blank')}
              >
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {flow.result && flow.contextData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const uiText = getUIText(
                flow.platform,
                flow.contentType,
                {
                  username: flow.contextData.username,
                  displayName: flow.contextData.displayName
                },
                flow.result
              );
              
              const isVerified = flow.result.proofResult === true;
              const hasError = !!flow.result.errorMessage;
              
              return (
                <>
                  <div className={cn(
                    "p-3 rounded-lg font-medium",
                    isVerified && "bg-green-50 text-green-800 border border-green-200",
                    !isVerified && !hasError && "bg-red-50 text-red-800 border border-red-200",
                    hasError && "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  )}>
                    {uiText.status}
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>User: {uiText.user}</p>
                    <p>{uiText.target}</p>
                    <p>{uiText.stats}</p>
                    <p>{uiText.timestamp}</p>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {completedSteps === flow.steps.length && (
          <Button onClick={onComplete}>
            Complete Verification
          </Button>
        )}
      </div>
    </div>
  );
};