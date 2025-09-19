/**
 * Simplified Ad Targeting Form for Beta Release
 * - TikTok only (other platforms labeled as "coming soon")
 * - Limited to Gender, Age, and Country targeting
 * - Storybook-friendly (no wallet dependencies)
 */
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Loader2, Info, BadgeCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { PaymentFlowService } from '../../services/paymentFlow';
import { useWalletClient, usePublicClient } from 'wagmi';

type Platform = 'tiktok' | 'instagram' | 'x' | 'facebook' | 'reddit' | 'farcaster';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: '/social-logos/douyin.png', available: true },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png', available: false },
  { id: 'x', name: 'X', icon: '/social-logos/x.png', available: false },
  { id: 'facebook', name: 'Facebook', icon: '/social-logos/facebook.png', available: false },
  { id: 'reddit', name: 'Reddit', icon: '/social-logos/reddit.png', available: false },
  { id: 'farcaster', name: 'Farcaster', icon: '/social-logos/farcaster.png', available: false },
];

// Base rates for the "easiest" audience (worldwide, all demographics)
const BASE_RATES = {
  likes: { count: 20, basePrice: 0.05 }, // $0.05 per like base
  follows: { count: 10, basePrice: 0.50 }, // $0.50 per follow base
};

// Country tier multipliers based on advertising costs
const COUNTRY_MULTIPLIERS: Record<string, number> = {
  // Tier 1: High-value markets
  'us': 2.5, // USA
  'uk': 2.5, // United Kingdom
  'ca': 2.5, // Canada
  'au': 2.5, // Australia
  
  // Tier 2: Mid-value markets
  'de': 1.8, // Germany
  'fr': 1.8, // France
  'jp': 1.8, // Japan
  'kr': 1.8, // South Korea
  
  // Tier 3: Growing markets
  'es': 1.3, // Spain
  'it': 1.3, // Italy
  'br': 1.3, // Brazil
  'mx': 1.3, // Mexico
  'in': 1.3, // India
  
  // Default
  'all': 1.0, // All countries
};

// Calculate dynamic price based on targeting
const calculateDynamicPrice = (requirements: TargetingRequirements) => {
  // Get multipliers
  const countryMultiplier = COUNTRY_MULTIPLIERS[requirements.country || 'all'] || 1.0;
  const genderMultiplier = requirements.gender !== 'all' ? 1.2 : 1.0;
  const ageMultiplier = requirements.ageRange !== 'all' ? 1.4 : 1.0;
  const verifiedMultiplier = requirements.verifiedOnly ? 1.5 : 1.0;
  
  // Calculate final prices
  const combinedMultiplier = countryMultiplier * genderMultiplier * ageMultiplier * verifiedMultiplier;
  const likePrice = BASE_RATES.likes.basePrice * combinedMultiplier;
  const followPrice = BASE_RATES.follows.basePrice * combinedMultiplier;
  
  // Calculate total
  const total = (BASE_RATES.likes.count * likePrice) + (BASE_RATES.follows.count * followPrice);
  
  return {
    likePrice,
    followPrice,
    total,
    multipliers: {
      country: countryMultiplier,
      gender: genderMultiplier,
      age: ageMultiplier,
      verified: verifiedMultiplier,
      combined: combinedMultiplier
    }
  };
};

type CampaignTargets = {
  likeTarget: string;
  followTarget: string;
};

type TargetingRequirements = {
  gender?: 'all' | 'male' | 'female';
  ageRange?: string;
  country?: string;
  verifiedOnly?: boolean;
};

interface SimplifiedAdTargetingFormProps {
  onSave?: (data: any) => void;
  onCancel?: () => void;
  // Storybook-specific props
  mockWalletConnected?: boolean;
  mockWalletAddress?: string;
}

export function SimplifiedAdTargetingForm({ 
  onSave,
  onCancel,
  mockWalletConnected = false,
  mockWalletAddress = '0x1234567890123456789012345678901234567890'
}: SimplifiedAdTargetingFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [campaignTargets, setCampaignTargets] = useState<CampaignTargets>({
    likeTarget: '',
    followTarget: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  
  // Real wallet hooks (will be undefined in Storybook)
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Simplified targeting requirements
  const [requirements, setRequirements] = useState<TargetingRequirements>({
    gender: 'all',
    ageRange: 'all',
    country: 'all',
    verifiedOnly: false
  });

  // Calculate dynamic pricing based on targeting
  const pricing = calculateDynamicPrice(requirements);
  const estimatedCost = pricing.total;

  const handleSave = async () => {
    // Reset previous states
    setPaymentError(null);
    setPaymentSuccess(null);
    
    // Check wallet connection (use real wallet if available, otherwise mock)
    const isWalletConnected = walletClient ? true : mockWalletConnected;
    const walletAddress = walletClient?.account?.address || mockWalletAddress;
    
    if (!isWalletConnected) {
      setPaymentError('Please connect your wallet first');
      return;
    }

    // Validate targets are filled
    if (!campaignTargets.likeTarget.trim()) {
      setPaymentError('Please provide a TikTok post URL for likes');
      return;
    }
    
    if (!campaignTargets.followTarget.trim()) {
      setPaymentError('Please provide a TikTok profile URL for follows');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // If we have real wallet clients, use actual payment flow
      if (walletClient && publicClient) {
        console.log('Processing real payment...');
        
        const formData = {
          platform: selectedPlatform,
          country: requirements.country,
          gender: requirements.gender,
          ageRange: requirements.ageRange,
          verifiedOnly: requirements.verifiedOnly,
          likeTarget: campaignTargets.likeTarget,
          followTarget: campaignTargets.followTarget
        };
        
        const result = await PaymentFlowService.createCampaignWithPayment(
          formData,
          walletAddress,
          walletClient,
          publicClient
        );
        
        setPaymentSuccess(
          `Payment submitted successfully! Transaction: ${result.transactionHash.slice(0, 8)}...`
        );
        
        if (onSave) {
          onSave({
            ...formData,
            campaignId: result.campaignId,
            transactionHash: result.transactionHash,
            totalAmount: estimatedCost,
            walletAddress
          });
        }
      } else {
        // Fallback to demo mode for Storybook
        console.log('[Demo] Processing campaign...');
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const campaignData = {
          platform: selectedPlatform,
          requirements,
          package: {
            likes: { count: FIXED_CAMPAIGN_PACKAGE.likes.count, target: campaignTargets.likeTarget },
            follows: { count: FIXED_CAMPAIGN_PACKAGE.follows.count, target: campaignTargets.followTarget }
          },
          totalAmount: estimatedCost,
          walletAddress
        };
        
        setPaymentSuccess(`Campaign created successfully! (Demo Mode)`);
        
        if (onSave) {
          onSave(campaignData);
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
        {/* Platform Selection */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Platform</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  if (platform.available) {
                    setSelectedPlatform(platform.id as Platform);
                    // Reset campaign targets when switching platforms
                    setCampaignTargets({ likeTarget: '', followTarget: '' });
                  }
                }}
                disabled={!platform.available}
                className={`relative flex items-center gap-2 justify-center px-3 sm:px-4 py-3 rounded-lg border-2 transition-all duration-150 ${
                  platform.available
                    ? selectedPlatform === platform.id
                      ? 'border-primary bg-primary/20 text-foreground cursor-pointer'
                      : 'border-border hover:border-primary/50 hover:bg-primary/10 text-foreground cursor-pointer'
                    : 'border-border/50 bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                <img 
                  src={platform.icon} 
                  alt={platform.name}
                  className={`w-4 h-4 rounded ${!platform.available ? 'opacity-50' : ''}`}
                />
                <span className="text-sm sm:text-base">{platform.name}</span>
                {!platform.available && (
                  <span className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full border border-border">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Creator Requirements */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Creator Requirements</h2>
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
            {/* Account Verified Checkbox */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors bg-background">
              <Checkbox
                id="verified-only"
                checked={requirements.verifiedOnly}
                onCheckedChange={(checked) => 
                  setRequirements({...requirements, verifiedOnly: !!checked})
                }
                className="h-5 w-5"
              />
              <Label 
                htmlFor="verified-only" 
                className="flex items-center gap-2 cursor-pointer select-none flex-1"
              >
                <BadgeCheck className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <span className="text-base font-medium block">Verified Creators Only</span>
                  <span className="text-sm text-muted-foreground">Only blue checkmark accounts can participate</span>
                </div>
              </Label>
            </div>
          </div>
        </div>

        {/* Audience Targeting */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Audience Targeting</h2>
          <p className="text-sm text-muted-foreground mb-3">Target creators whose audience matches these criteria</p>
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
            
            {/* Gender Targeting */}
            <div className="space-y-2">
              <Label htmlFor="gender-select" className="text-base font-medium">
                Audience Gender
              </Label>
              <Select 
                value={requirements.gender} 
                onValueChange={(value) => setRequirements({...requirements, gender: value as any})}
              >
                <SelectTrigger id="gender-select" className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Primarily Male (60%+)</SelectItem>
                  <SelectItem value="female">Primarily Female (60%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range Targeting */}
            <div className="space-y-2">
              <Label htmlFor="age-select" className="text-base font-medium">
                Audience Age Range
              </Label>
              <Select 
                value={requirements.ageRange} 
                onValueChange={(value) => setRequirements({...requirements, ageRange: value})}
              >
                <SelectTrigger id="age-select" className="w-full">
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="13-17">13-17 years</SelectItem>
                  <SelectItem value="18-24">18-24 years</SelectItem>
                  <SelectItem value="25-34">25-34 years</SelectItem>
                  <SelectItem value="35-44">35-44 years</SelectItem>
                  <SelectItem value="45-54">45-54 years</SelectItem>
                  <SelectItem value="55+">55+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country Targeting */}
            <div className="space-y-2">
              <Label htmlFor="country-select" className="text-base font-medium">
                Audience Country
              </Label>
              <Select 
                value={requirements.country} 
                onValueChange={(value) => setRequirements({...requirements, country: value})}
              >
                <SelectTrigger id="country-select" className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
                  <SelectItem value="es">Spain</SelectItem>
                  <SelectItem value="it">Italy</SelectItem>
                  <SelectItem value="br">Brazil</SelectItem>
                  <SelectItem value="mx">Mexico</SelectItem>
                  <SelectItem value="jp">Japan</SelectItem>
                  <SelectItem value="kr">South Korea</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Audience Targeting Summary */}
            {(requirements.gender !== 'all' || requirements.ageRange !== 'all' || requirements.country !== 'all') && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium mb-1">Audience Filters:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {requirements.gender !== 'all' && (
                    <li>• Audience Gender: {requirements.gender === 'male' ? 'Primarily Male (60%+)' : 'Primarily Female (60%+)'}</li>
                  )}
                  {requirements.ageRange !== 'all' && (
                    <li>• Audience Age: {requirements.ageRange}</li>
                  )}
                  {requirements.country !== 'all' && (
                    <li>• Audience Location: {requirements.country?.toUpperCase()}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Campaign Package */}
        {selectedPlatform === 'tiktok' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Campaign Package</h2>
            
            {/* Package Details Card */}
            <div className="p-4 border border-border rounded-lg bg-card space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Campaign Package:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{BASE_RATES.likes.count}</span>
                      <span className="text-base">Likes</span>
                      <span className="text-sm text-muted-foreground">
                        @ ${pricing.likePrice.toFixed(2)}/like
                        {pricing.multipliers.combined > 1 && (
                          <span className="text-xs ml-1">
                            (base: ${BASE_RATES.likes.basePrice.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{BASE_RATES.follows.count}</span>
                      <span className="text-base">Follows</span>
                      <span className="text-sm text-muted-foreground">
                        @ ${pricing.followPrice.toFixed(2)}/follow
                        {pricing.multipliers.combined > 1 && (
                          <span className="text-xs ml-1">
                            (base: ${BASE_RATES.follows.basePrice.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Package</p>
                  <p className="text-2xl font-bold text-primary">${estimatedCost.toFixed(2)}</p>
                  {pricing.multipliers.combined > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {pricing.multipliers.combined.toFixed(1)}x base price
                    </p>
                  )}
                </div>
              </div>

              {/* Target URLs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="like-target" className="text-base font-medium">
                    TikTok Post URL for Likes
                  </Label>
                  <Input
                    id="like-target"
                    type="url"
                    placeholder="https://tiktok.com/@username/video/123456789"
                    value={campaignTargets.likeTarget}
                    onChange={(e) => setCampaignTargets(prev => ({ ...prev, likeTarget: e.target.value }))}
                    className="font-mono text-base h-11"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This post will receive {BASE_RATES.likes.count} likes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follow-target" className="text-base font-medium">
                    TikTok Profile URL for Follows
                  </Label>
                  <Input
                    id="follow-target"
                    type="url"
                    placeholder="https://tiktok.com/@username"
                    value={campaignTargets.followTarget}
                    onChange={(e) => setCampaignTargets(prev => ({ ...prev, followTarget: e.target.value }))}
                    className="font-mono text-base h-11"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This profile will receive {BASE_RATES.follows.count} new followers
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total - Shows dynamic pricing breakdown */}
        <div className="border-t border-border">
          <div className="py-6 px-4 sm:px-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Total Campaign Cost</h3>
                {pricing.multipliers.combined === 1 ? (
                  <p className="text-sm text-muted-foreground">Base package price</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Price multipliers applied:
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {pricing.multipliers.country !== 1 && (
                        <span className="px-2 py-1 bg-muted rounded-md">
                          Country: {pricing.multipliers.country}x
                        </span>
                      )}
                      {pricing.multipliers.gender !== 1 && (
                        <span className="px-2 py-1 bg-muted rounded-md">
                          Gender: {pricing.multipliers.gender}x
                        </span>
                      )}
                      {pricing.multipliers.age !== 1 && (
                        <span className="px-2 py-1 bg-muted rounded-md">
                          Age: {pricing.multipliers.age}x
                        </span>
                      )}
                      {pricing.multipliers.verified !== 1 && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-700 rounded-md border border-blue-500/20">
                          Verified: {pricing.multipliers.verified}x
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Total multiplier: {pricing.multipliers.combined.toFixed(2)}x
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <div className="text-3xl font-bold text-primary">
                  ${estimatedCost.toFixed(2)}
                </div>
                {pricing.multipliers.combined === 1 ? (
                  <p className="text-sm text-green-600">
                    Base rate
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Base: ${(BASE_RATES.likes.count * BASE_RATES.likes.basePrice + BASE_RATES.follows.count * BASE_RATES.follows.basePrice).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Alerts */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {paymentSuccess && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Success!</AlertTitle>
            <AlertDescription className="text-green-600">{paymentSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Launch Campaign Button */}
        <div className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={
              isProcessingPayment ||
              !campaignTargets.likeTarget.trim() ||
              !campaignTargets.followTarget.trim()
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
              <>Launch Campaign - ${estimatedCost.toFixed(2)}</>
            )}
          </Button>
          {mockWalletConnected && (
            <p className="text-muted-foreground text-center mt-2">
              Pay ${estimatedCost.toFixed(2)} to launch your campaign
            </p>
          )}
        </div>
    </div>
  );
}