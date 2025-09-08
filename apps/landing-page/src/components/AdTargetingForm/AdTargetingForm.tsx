import { useState } from 'react';
import type { TargetingRule, ConditionGroup as ConditionGroupType } from '../../types/platform-schemas';
import { allPlatformSchemas } from '../../types/platform-schemas';
import { ConditionGroup } from './ConditionGroup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

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

export function AdTargetingForm({ initialRule, onSave, onCancel }: AdTargetingFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [actionPricing, setActionPricing] = useState<ActionPricing>({});
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
          let text = `${schema.platform}: ${schema.displayName}`;
          
          // Add operator and value
          if (cond.operator && cond.value !== undefined) {
            text += ` ${cond.operator} ${cond.value}`;
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
    <div className="flex gap-6">
      {/* Main Form */}
      <div className="flex-1 space-y-6">
        {/* Platform Selection */}
        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Platform</h2>
          <div className="flex flex-wrap gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setSelectedPlatform(platform.id as Platform);
                  // Clear conditions when switching platforms
                  setRule({
                    ...rule,
                    rootGroup: {
                      ...rule.rootGroup,
                      conditions: []
                    }
                  });
                }}
                className={`flex items-center gap-2 w-[140px] justify-center px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${
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
        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Targeting</h2>
            <ConditionGroup
              group={rule.rootGroup}
              onUpdate={handleUpdateRootGroup}
              isRoot={true}
              platform={selectedPlatform}
            />
        </div>

        {/* Actions & Pricing */}
        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="space-y-3">
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
                <div key={key} className="relative p-4 rounded-lg bg-card border border-border space-y-3">
                  {/* Action Header with Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={config.enabled}
                      onChange={(e) => {
                        setActionPricing(prev => ({
                          ...prev,
                          [key]: { ...config, enabled: e.target.checked }
                        }));
                      }}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={checkboxId} className="text-base font-medium cursor-pointer">
                      {action.name}
                    </Label>
                  </div>

                  {config.enabled && (
                    <>
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
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-price`} className="text-base font-medium">
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
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-volume`} className="text-base font-medium">
                            Maximum Actions
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {rule.rootGroup.conditions.length > 0 && (
          <div className="rounded-lg bg-card border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <p className="text-base text-muted-foreground font-mono">
              {generateHumanReadable(rule.rootGroup) || 'No conditions defined'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={
              !rule.name || 
              rule.rootGroup.conditions.length === 0 ||
              Object.values(actionPricing).filter(p => p.enabled).length === 0
            }
          >
            Save Campaign
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}