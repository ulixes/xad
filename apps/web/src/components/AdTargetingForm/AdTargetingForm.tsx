import { useState, useEffect } from 'react';
import type { TargetingRule, ConditionGroup as ConditionGroupType } from '../../types/platform-schemas';
import { allPlatformSchemas, OPERATOR_LABELS } from '../../types/platform-schemas';
import { ConditionGroup } from './ConditionGroup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
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

// Define actions per platform with minimum prices (in cents)
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
  target: string; // URL for posts, @handle for follows
  maxVolume: number; // Maximum number of actions to pay for
};

type ActionPricing = Record<string, ActionConfig>;

interface AdTargetingFormProps {
  initialRule?: TargetingRule;
  onSave?: (rule: TargetingRule) => void;
  onCancel?: () => void;
}

export function AdTargetingForm({ initialRule, onSave }: AdTargetingFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [actionPricing, setActionPricing] = useState<ActionPricing>({});
  const [estimatedCost, setEstimatedCost] = useState<any>(null);
  const [rule, setRule] = useState<TargetingRule>(
    initialRule || {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      rootGroup: {
        id: `group-root`,
        operator: 'AND',
        conditions: []
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

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...rule,
        updatedAt: new Date()
      });
    }
  };

  const handleUpdateRootGroup = (updatedGroup: ConditionGroupType) => {
    setRule({
      ...rule,
      rootGroup: updatedGroup
    });
  };

  const generateHumanReadable = (group: ConditionGroupType, depth = 0): string => {
    if (group.conditions.length === 0) return '';
    
    let result = '';
    group.conditions.forEach((cond, index) => {
      if ('schemaId' in cond) {
        const schema = allPlatformSchemas.find(s => s.id === cond.schemaId);
        if (!schema) {
          result += 'Unknown condition';
        } else {
          let text = schema.displayName;
          
          // Add operator and value
          if (cond.operator && cond.value !== undefined) {
            const operatorLabel = OPERATOR_LABELS[cond.operator] || cond.operator;
            text += ` ${operatorLabel} ${cond.value}`;
          }
          
          // Add params if present
          if (cond.params && schema.params) {
            const paramDisplay = schema.params.map(p => {
              const value = cond.params?.[p.name];
              if (value && p.options) {
                const option = p.options.find(o => o.value === value);
                return option?.label || value;
              }
              return value;
            }).filter(Boolean);
            
            if (paramDisplay.length > 0) {
              text += ` (${paramDisplay.join(', ')})`;
            }
          }
          result += text;
        }
        
        // Add the logical operator if not the last condition
        if (index < group.conditions.length - 1) {
          result += ` ${cond.logicalOperator || 'AND'} `;
        }
      } else {
        // Nested group
        if (index > 0) result += ` ${group.operator} `;
        result += `(${generateHumanReadable(cond, depth + 1)})`;
      }
    });
    
    return result;
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
                  // Add a default condition when switching platforms
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
                    {/* Action Header with Checkbox */}
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
                      {/* Target URL or Handle */}
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
                                : selectedPlatform === 'instagram'
                                  ? 'https://instagram.com/p/ABC123/'
                                  : selectedPlatform === 'x'
                                    ? 'https://x.com/user/status/123456789'
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
                      
                      {/* Price and Volume Grid */}
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
                <span className={`text-2xl font-semibold ${estimatedCost.totalCost < 30 ? 'text-red-500' : 'text-foreground'}`}>
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

        {/* Pay Button */}
        <div className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={
              rule.rootGroup.conditions.length === 0 ||
              Object.values(actionPricing).filter(p => p.enabled).length === 0 ||
              (estimatedCost && estimatedCost.totalCost < 30)
            }
            size="lg"
            className="w-full"
          >
            Pay ${estimatedCost?.totalCost?.toFixed(2) || '0.00'}
          </Button>
        </div>
    </div>
  );
}