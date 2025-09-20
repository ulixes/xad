/**
 * Simplified Ad Targeting Form for Beta Release
 * - TikTok only (other platforms labeled as "coming soon")
 * - Limited to Gender, Age, and Country targeting
 * - Fetches package and pricing data from smart contract
 */
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Loader2, BadgeCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { PaymentFlowEmbeddedService } from '../../services/paymentFlowEmbedded';
import { useWallets } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrivyAuth } from '../../hooks/usePrivyAuth';
import { CAMPAIGN_PAYMENTS_ABI } from '../../config/networks';

type Platform = 'tiktok' | 'instagram' | 'x' | 'facebook' | 'reddit' | 'farcaster';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: '/social-logos/douyin.png', available: true },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png', available: false },
  { id: 'x', name: 'X', icon: '/social-logos/x.png', available: false },
  { id: 'facebook', name: 'Facebook', icon: '/social-logos/facebook.png', available: false },
  { id: 'reddit', name: 'Reddit', icon: '/social-logos/reddit.png', available: false },
  { id: 'farcaster', name: 'Farcaster', icon: '/social-logos/farcaster.png', available: false },
];

// Country list with codes matching contract
const COUNTRIES = [
  { code: 'all', name: 'All Countries' },
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' }
];

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
}

export function SimplifiedAdTargetingForm({ 
  onSave,
  mockWalletConnected = false
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
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Debug log hook values on mount/update
  useEffect(() => {
    console.log('[SimplifiedAdTargetingForm] Hook values:', {
      walletsLength: wallets?.length,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient,
      walletTypes: wallets?.map(w => w.walletClientType)
    });
  }, [wallets, walletClient, publicClient]);
  
  // Privy auth hook
  const { 
    isPrivyAuthenticated,
    triggerSignIn, 
    checkAuthStatus 
  } = usePrivyAuth();
  
  // Contract data
  const [contractData, setContractData] = useState({
    likes: 20,
    follows: 10,
    baseLikePrice: 200000, // in USDC (6 decimals)
    baseFollowPrice: 400000,
    loading: true
  });
  
  // Simplified targeting requirements
  const [requirements, setRequirements] = useState<TargetingRequirements>({
    gender: 'all',
    ageRange: 'all',
    country: 'all',
    verifiedOnly: false
  });
  
  // Calculated price from contract
  const [calculatedPrice, setCalculatedPrice] = useState<bigint>(0n);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Load contract configuration
  useEffect(() => {
    const loadContractData = async () => {
      if (!publicClient) {
        // Use defaults for Storybook
        setContractData({
          likes: 20,
          follows: 10,
          baseLikePrice: 200000,
          baseFollowPrice: 400000,
          loading: false
        });
        return;
      }
      
      try {
        // TODO: Update this to fetch actual contract data once contract functions are available
        // const contractAddress = '0xf206c64836CA5Bba3198523911Aa4c06b49fc1E6' as const;
        
        // Use default package values - these define the campaign package
        setContractData({
          likes: 20,
          follows: 10,
          baseLikePrice: 200000, // 0.2 USDC per like (6 decimals)
          baseFollowPrice: 400000, // 0.4 USDC per follow (6 decimals)
          loading: false
        });
      } catch (error) {
        console.error('Error loading contract data:', error);
        setContractData(prev => ({ ...prev, loading: false }));
      }
    };
    
    loadContractData();
  }, [publicClient]);
  
  // Calculate price when requirements change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!publicClient) {
        // Mock calculation for Storybook
        const baseTotal = (contractData.likes * contractData.baseLikePrice + 
                          contractData.follows * contractData.baseFollowPrice);
        setCalculatedPrice(BigInt(baseTotal));
        return;
      }
      
      setIsCalculating(true);
      try {
        const contractAddress = '0xf206c64836CA5Bba3198523911Aa4c06b49fc1E6' as const;
        
        const price = await publicClient.readContract({
          address: contractAddress,
          abi: CAMPAIGN_PAYMENTS_ABI,
          functionName: 'calculatePrice',
          args: [
            requirements.country || 'all',
            requirements.gender !== 'all',
            requirements.ageRange !== 'all',
            requirements.verifiedOnly || false
          ]
        });
        
        setCalculatedPrice(price);
      } catch (error) {
        console.error('Error calculating price:', error);
        // Fallback to base price
        const baseTotal = (contractData.likes * contractData.baseLikePrice + 
                          contractData.follows * contractData.baseFollowPrice);
        setCalculatedPrice(BigInt(baseTotal));
      }
      setIsCalculating(false);
    };
    
    calculatePrice();
  }, [requirements, contractData, publicClient]);
  
  // Convert price to USD string
  const formatPrice = (price: bigint) => {
    return formatUnits(price, 6); // USDC has 6 decimals
  };
  
  const estimatedCost = Number(formatPrice(calculatedPrice));
  const basePackagePrice = (contractData.likes * contractData.baseLikePrice + 
                           contractData.follows * contractData.baseFollowPrice) / 1000000;

  const handleSave = async () => {
    // Reset previous states
    setPaymentError(null);
    setPaymentSuccess(null);
    
    // Check wallet connection (use real wallet if available, otherwise mock)
    const isWalletConnected = isPrivyAuthenticated || mockWalletConnected;
    // const walletAddress = connectedAddress || mockWalletAddress;
    
    if (!isWalletConnected) {
      setPaymentError('Please connect your wallet first');
      return;
    }
    
    // Check authentication for real wallet connections
    if (!mockWalletConnected && !checkAuthStatus()) {
      console.log('User not authenticated, triggering sign-in...');
      const signedIn = await triggerSignIn();
      if (!signedIn) {
        setPaymentError('Please sign the message with your wallet to continue');
        return;
      }
    }
    
    // Get connected external wallet (users must connect their own wallet)
    console.log('[SimplifiedAdTargetingForm] Available wallets:', wallets?.map(w => ({
      type: w.walletClientType,
      address: w.address,
      chainId: w.chainId
    })));
    const connectedWallet = wallets?.[0]; // Get the first connected wallet
    if (!mockWalletConnected && (!connectedWallet || !publicClient || !walletClient)) {
      setPaymentError('Please connect your wallet to continue');
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
      // If we have connected wallet and publicClient, use actual payment flow
      console.log('[Payment] Check conditions:', {
        hasConnectedWallet: !!connectedWallet,
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        walletType: connectedWallet?.walletClientType
      });
      if (connectedWallet && publicClient && walletClient) {
        console.log('Processing payment with connected wallet...');
        console.log('Connected wallet:', connectedWallet.address);
        
        const formData = {
          platform: selectedPlatform,
          country: requirements.country,
          gender: requirements.gender,
          ageRange: requirements.ageRange,
          verifiedOnly: requirements.verifiedOnly,
          likeUrl: campaignTargets.likeTarget,    // Changed from likeTarget to likeUrl
          followUrl: campaignTargets.followTarget  // Changed from followTarget to followUrl
        };
        
        const result = await PaymentFlowEmbeddedService.createCampaignWithPayment(
          formData,
          connectedWallet.address,
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
          });
        }
      } else {
        // Mock payment for Storybook
        console.log('Mock payment processing...');
        setTimeout(() => {
          setPaymentSuccess('Campaign created successfully! (Mock payment)');
          if (onSave) {
            onSave({
              platform: selectedPlatform,
              requirements,
              targets: campaignTargets,
              totalAmount: estimatedCost,
              mockTransaction: true
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'Transaction failed. Please try again.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Your Campaign</h1>
          <p className="text-muted-foreground">Launch your TikTok engagement campaign in minutes</p>
        </div>

        {/* Platform Selection */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Select Platform</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => platform.available && setSelectedPlatform(platform.id as Platform)}
                disabled={!platform.available}
                className={`
                  relative p-3 rounded-lg border-2 transition-all
                  ${selectedPlatform === platform.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-muted-foreground/50'
                  }
                  ${!platform.available 
                    ? 'cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                `}
              >
                <img 
                  src={platform.icon} 
                  alt={platform.name}
                  className="w-8 h-8 mx-auto mb-2 object-contain"
                />
                <p className="text-xs font-medium">{platform.name}</p>
                {!platform.available && (
                  <p className="text-[10px] text-muted-foreground">Coming Soon</p>
                )}
              </button>
            ))}
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
                  {COUNTRIES.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
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
                    <li>• Audience Location: {COUNTRIES.find(c => c.code === requirements.country)?.name}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Creator Targeting */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Creator Targeting</h2>
          <p className="text-sm text-muted-foreground mb-3">Select the type of creators you want to engage with</p>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="verified-only"
                checked={requirements.verifiedOnly}
                onCheckedChange={(checked) => 
                  setRequirements({...requirements, verifiedOnly: checked as boolean})
                }
              />
              <Label 
                htmlFor="verified-only" 
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <BadgeCheck className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">
                    Verified Creators Only
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Get engagement from creators with verified accounts (blue checkmark)
                  </p>
                </div>
              </Label>
            </div>
          </div>
        </div>

        {/* Fixed Campaign Package - Fetched from Contract */}
        {selectedPlatform === 'tiktok' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Campaign Package</h2>
            
            {/* Package Details Card */}
            <div className="p-4 border border-border rounded-lg bg-card space-y-4">
              {contractData.loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading package details...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Campaign Package:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{contractData.likes}</span>
                          <span className="text-base">Likes</span>
                          <span className="text-sm text-muted-foreground">
                            @ ${(contractData.baseLikePrice / 1000000).toFixed(2)}/like
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{contractData.follows}</span>
                          <span className="text-base">Follows</span>
                          <span className="text-sm text-muted-foreground">
                            @ ${(contractData.baseFollowPrice / 1000000).toFixed(2)}/follow
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total Package</p>
                      <p className="text-2xl font-bold text-primary">
                        ${basePackagePrice.toFixed(2)}
                      </p>
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
                        This post will receive {contractData.likes} likes
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
                        This profile will receive {contractData.follows} new followers
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Total Campaign Cost - Simplified Display */}
        <div className="border-t border-border">
          <div className="py-6 px-4 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Total Campaign Cost</h3>
              <div className="text-right">
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg">Calculating...</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    ${estimatedCost.toFixed(2)}
                  </div>
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
              !campaignTargets.followTarget.trim() ||
              contractData.loading ||
              isCalculating
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