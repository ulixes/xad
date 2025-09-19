/**
 * Storybook-friendly version of AdTargetingForm
 * This version removes wallet dependencies for proper Storybook rendering
 */
import { useState, useEffect } from 'react';
import type { TargetingRule, ConditionGroup as ConditionGroupType } from '../../types/platform-schemas';
import { allPlatformSchemas, OPERATOR_LABELS } from '../../types/platform-schemas';
import { ConditionGroup } from './ConditionGroup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { calculateCampaignPrice } from '../../utils/pricing-calculator';

type Platform = 'tiktok' | 'reddit' | 'x' | 'instagram' | 'facebook' | 'farcaster';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: '/social-logos/douyin.png' },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png' },
  { id: 'x', name: 'X', icon: '/social-logos/x.png' },
  { id: 'facebook', name: 'Facebook', icon: '/social-logos/facebook.png' },
  { id: 'reddit', name: 'Reddit', icon: '/social-logos/reddit.png' },
  { id: 'farcaster', name: 'Farcaster', icon: '/social-logos/farcaster.png' },
];

const platformActions = {
  tiktok: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'comment', name: 'Comment', minPrice: 25 },
    { id: 'share', name: 'Share', minPrice: 15 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
  instagram: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'comment', name: 'Comment', minPrice: 25 },
    { id: 'reel_share', name: 'Share Reel', minPrice: 20 },
    { id: 'post_share', name: 'Share Post', minPrice: 15 },
    { id: 'story_share', name: 'Share Story', minPrice: 10 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
  x: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'comment', name: 'Comment', minPrice: 25 },
    { id: 'retweet', name: 'Retweet', minPrice: 15 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
  facebook: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'comment', name: 'Comment', minPrice: 25 },
    { id: 'story_share', name: 'Share Story', minPrice: 10 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
  reddit: [
    { id: 'upvote', name: 'Upvote', minPrice: 3 },
    { id: 'comment', name: 'Comment', minPrice: 30 },
    { id: 'award', name: 'Award', minPrice: 100 },
  ],
  farcaster: [
    { id: 'like', name: 'Like', minPrice: 10 },
    { id: 'comment', name: 'Comment', minPrice: 50 },
    { id: 'follow', name: 'Follow', minPrice: 75 },
  ],
};

type ActionConfig = { 
  enabled: boolean; 
  price: number;
  target: string;
  maxVolume: number;
};

type ActionPricing = Record<string, ActionConfig>;

interface AdTargetingFormStorybookProps {
  initialRule?: TargetingRule;
  onSave?: (rule: TargetingRule) => void;
  onCancel?: () => void;
  // Storybook-specific props
  mockWalletConnected?: boolean;
  mockWalletAddress?: string;
}

export function AdTargetingFormStorybook({ 
  initialRule, 
  onSave,
  mockWalletConnected = false,
  mockWalletAddress = '0x1234567890123456789012345678901234567890'
}: AdTargetingFormStorybookProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [actionPricing, setActionPricing] = useState<ActionPricing>({});
  const [estimatedCost, setEstimatedCost] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  
  const [rule, setRule] = useState<TargetingRule>(
    initialRule || {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      rootGroup: {
        id: `group-root`,
        operator: 'AND',
        conditions: [{
          id: `cond-${Date.now()}`,
          schemaId: '',
          params: {},
          logicalOperator: 'AND'
        }]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    }
  );

  // Calculate estimated cost whenever actions or conditions change
  useEffect(() => {
    const hasEnabledActions = Object.values(actionPricing).some(p => p.enabled);
    if (hasEnabledActions) {
      const cost = calculateCampaignPrice(
        selectedPlatform,
        actionPricing,
        rule.rootGroup.conditions
      );
      setEstimatedCost(cost);
    } else {
      setEstimatedCost(null);
    }
  }, [actionPricing, rule.rootGroup.conditions, selectedPlatform]);

  const handleSave = async () => {
    // Reset previous states
    setPaymentError(null);
    setPaymentSuccess(null);
    
    // Mock wallet connection check
    if (!mockWalletConnected) {
      setPaymentError('Please connect your wallet first (Storybook Mock)');
      console.log('[Storybook] Would open wallet modal here');
      return;
    }

    // Validate minimum amount
    if (!estimatedCost || estimatedCost.totalCost < 5) {
      setPaymentError('Minimum campaign budget is $5');
      return;
    }

    // Validate actions selected
    const enabledActions = Object.values(actionPricing).filter(p => p.enabled);
    if (enabledActions.length === 0) {
      setPaymentError('Please select at least one action');
      return;
    }

    // Validate targets are filled
    const invalidTargets = Object.entries(actionPricing)
      .filter(([_, config]: [string, any]) => config.enabled && !config.target.trim());
    
    if (invalidTargets.length > 0) {
      setPaymentError('Please fill in all target URLs/handles for selected actions');
      return;
    }

    setIsProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      console.log('[Storybook] Mock payment processed for campaign:', {
        platform: selectedPlatform,
        targetingRules: rule,
        totalAmount: estimatedCost.totalCost,
        walletAddress: mockWalletAddress
      });
      
      setPaymentSuccess(
        `Payment successful! Campaign activated (Storybook Mock)`
      );
      
      if (onSave) {
        onSave({
          ...rule,
          updatedAt: new Date()
        });
      }
      
      setIsProcessingPayment(false);
    }, 2000);
  };

  const handleUpdateRootGroup = (updatedGroup: ConditionGroupType) => {
    setRule({
      ...rule,
      rootGroup: updatedGroup
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
        {/* Platform Selection */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Platform</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  const newPlatform = platform.id as Platform;
                  setSelectedPlatform(newPlatform);
                  setRule(prevRule => ({
                    ...prevRule,
                    rootGroup: {
                      ...prevRule.rootGroup,
                      conditions: [{
                        id: `cond-${Date.now()}`,
                        schemaId: '',
                        params: {},
                        logicalOperator: 'AND'
                      }]
                    }
                  }));
                }}
                className={`flex items-center gap-2 w-full sm:w-[140px] justify-center px-3 sm:px-4 py-2 rounded-lg border-2 transition-colors duration-150 cursor-pointer text-sm sm:text-base ${
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary/20 text-foreground'
                    : 'border-border hover:border-primary/50 hover:bg-primary/10 text-foreground'
                }`}
              >
                <img 
                  src={platform.icon} 
                  alt={platform.name}
                  className="w-4 h-4 rounded"
                />
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Condition Builder */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Targeting</h2>
            <ConditionGroup
              group={rule.rootGroup}
              onUpdate={handleUpdateRootGroup}
              isRoot={true}
              platform={selectedPlatform}
            />
        </div>

        {/* Actions & Pricing */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Actions</h2>
          
          <div>
            {platformActions[selectedPlatform]?.map((action) => {
              const key = `${selectedPlatform}_${action.id}`;
              const config = actionPricing[key] || { 
                enabled: false, 
                price: action.minPrice, 
                target: '',
                maxVolume: 100 
              };
              const isFollowAction = action.id === 'follow';
              const checkboxId = `action-${key}`;
              
              return (
                <div key={key} className="relative border-b border-border last:border-0">
                  <div className="py-4">
                    <div className="flex items-center space-x-3">
                    <Checkbox
                      id={checkboxId}
                      checked={config.enabled}
                      onCheckedChange={(checked) => {
                        setActionPricing(prev => ({
                          ...prev,
                          [key]: { ...config, enabled: !!checked }
                        }));
                      }}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={checkboxId} className="text-base font-medium cursor-pointer">
                      {action.name}
                    </Label>
                  </div>

                  {config.enabled && (
                    <div className="mt-4 space-y-4 pb-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-target`} className="text-base font-medium">
                          {isFollowAction ? 'Account to Follow' : 'URL'}
                        </Label>
                        <Input
                          id={`${key}-target`}
                          type={isFollowAction ? 'text' : 'url'}
                          placeholder={
                            isFollowAction 
                              ? '@username' 
                              : selectedPlatform === 'tiktok'
                                ? 'https://tiktok.com/@user/video/123456789'
                                : 'https://...'
                          }
                          value={config.target}
                          onChange={(e) => {
                            setActionPricing(prev => ({
                              ...prev,
                              [key]: { ...config, target: e.target.value }
                            }));
                          }}
                          className="font-mono text-base h-11"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`${key}-price`} className="text-base font-medium block mb-2">
                            Price per {action.name}
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              id={`${key}-price`}
                              type="number"
                              min={action.minPrice / 100}
                              step="0.01"
                              value={(config.price / 100).toFixed(2)}
                              onChange={(e) => {
                                const cents = Math.round(parseFloat(e.target.value) * 100);
                                if (cents >= action.minPrice) {
                                  setActionPricing(prev => ({
                                    ...prev,
                                    [key]: { ...config, price: cents }
                                  }));
                                }
                              }}
                              className="pl-7 text-base h-11"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground/80 mt-2">
                            Minimum: ${(action.minPrice / 100).toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor={`${key}-volume`} className="text-base font-medium block mb-2">
                            Quantity
                          </Label>
                          <Input
                            id={`${key}-volume`}
                            type="number"
                            min="1"
                            max="10000"
                            value={config.maxVolume}
                            onChange={(e) => {
                              setActionPricing(prev => ({
                                ...prev,
                                [key]: { ...config, maxVolume: parseInt(e.target.value) || 1 }
                              }));
                            }}
                            className="text-base h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        {estimatedCost && estimatedCost.breakdown.length > 0 && (
          <div className="py-6 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-semibold">Total</span>
              <div className="text-right">
                <span className={`text-2xl font-semibold ${estimatedCost.totalCost < 50 ? 'text-red-500' : 'text-foreground'}`}>
                  ${estimatedCost.totalCost.toFixed(2)}
                </span>
                {estimatedCost.volumeDiscount < 1 && (
                  <p className="text-sm text-green-600">
                    {((1 - estimatedCost.volumeDiscount) * 100).toFixed(0)}% discount applied
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Alerts */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {paymentSuccess && (
          <Alert className="border-green-500/50 text-green-700 [&>svg]:text-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Payment Successful!</AlertTitle>
            <AlertDescription>{paymentSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Storybook Mock Wallet Status */}
        {!mockWalletConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Storybook Mock</AlertTitle>
            <AlertDescription>
              In production, this would prompt wallet connection. 
              Set `mockWalletConnected` prop to true to simulate connected state.
            </AlertDescription>
          </Alert>
        )}

        {/* Pay Button */}
        <div className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={
              isProcessingPayment ||
              rule.rootGroup.conditions.length === 0 ||
              Object.values(actionPricing).filter(p => p.enabled).length === 0 ||
              (estimatedCost && estimatedCost.totalCost < 5)
            }
            size="lg"
            className="w-full"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              'Pay'
            )}
          </Button>
          <p className="text-muted-foreground mt-2">
            {!mockWalletConnected ? 'Connect your wallet to proceed (Storybook Mock)' : 'Minimum: $5'}
          </p>
        </div>
    </div>
  );
}