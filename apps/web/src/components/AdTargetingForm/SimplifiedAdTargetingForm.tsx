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
import { AlertCircle, CheckCircle, Loader2, BadgeCheck, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { PaymentFlowEmbeddedService } from '../../services/paymentFlowEmbedded';
import { useWallets } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrivyAuth } from '../../hooks/usePrivyAuth';
import { CAMPAIGN_PAYMENTS_ABI, getNetworkConfig } from '../../config/networks';
import { useNavigate } from 'react-router-dom';

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
  likeTargets: string[];  // Array of post URLs for likes
  likeCountPerPost: number;  // Number of likes per post
  followTarget: string;  // Single account URL for follows
  followCount: number;  // Number of follows
};

type AccountRequirements = {
  verifiedOnly?: boolean;
  minFollowers?: number;
  minUniqueViews28Days?: number;
  accountLocation?: string;
  accountLanguage?: string;
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
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [campaignTargets, setCampaignTargets] = useState<CampaignTargets>({
    likeTargets: [''],  // Start with one empty URL field
    likeCountPerPost: 20,  // Default 20 likes per post
    followTarget: '',
    followCount: 10  // Default 10 follows
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
    walletAddress,
    triggerSignIn, 
    checkAuthStatus 
  } = usePrivyAuth();
  
  // Contract data
  const [contractData, setContractData] = useState({
    baseLikePrice: 200000, // in USDC (6 decimals)
    baseFollowPrice: 400000,
    loading: true
  });
  
  // Account requirements
  const [requirements, setRequirements] = useState<AccountRequirements>({
    verifiedOnly: false,
    minFollowers: 1000,
    minUniqueViews28Days: 10000,
    accountLocation: 'all',
    accountLanguage: 'all'
  });
  
  // Calculated price from contract
  const [calculatedPrice, setCalculatedPrice] = useState<bigint>(0n);
  const [isCalculating, setIsCalculating] = useState(false);

  // USDC Balance
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Load contract configuration
  useEffect(() => {
    const loadContractData = async () => {
      if (!publicClient) {
        // Use defaults for Storybook
        setContractData({
          baseLikePrice: 200000,
          baseFollowPrice: 400000,
          loading: false
        });
        return;
      }
      
      try {
        // TODO: Update this to fetch actual contract data once contract functions are available
        // const contractAddress = '0xf206c64836CA5Bba3198523911Aa4c06b49fc1E6' as const;
        
        // Use default base prices
        setContractData({
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
      // Get valid like targets for calculation
      const validLikeTargets = campaignTargets.likeTargets.filter(url => url.trim());
      const likeTargetsCount = validLikeTargets.length || 1; // At least 1 for price estimate
      
      if (!publicClient) {
        // Mock calculation for Storybook
        const totalLikes = likeTargetsCount * campaignTargets.likeCountPerPost;
        const totalFollows = campaignTargets.followCount;
        const baseTotal = (totalLikes * contractData.baseLikePrice +
                          totalFollows * contractData.baseFollowPrice);
        setCalculatedPrice(BigInt(baseTotal));
        return;
      }

      setIsCalculating(true);
      try {
        const networkConfig = getNetworkConfig();
        const contractAddress = networkConfig.campaignPaymentsContract as `0x${string}`;

        // Create dummy targets array for price calculation
        const dummyTargets = Array(likeTargetsCount).fill('post');
        
        const price = await publicClient.readContract({
          address: contractAddress,
          abi: CAMPAIGN_PAYMENTS_ABI,
          functionName: 'calculatePrice',
          args: [
            {
              verifiedOnly: requirements.verifiedOnly || false,
              minFollowers: BigInt(requirements.minFollowers || 0),
              minUniqueViews28Days: BigInt(requirements.minUniqueViews28Days || 0),
              accountLocation: requirements.accountLocation || 'all',
              accountLanguage: requirements.accountLanguage || 'all'
            },
            {
              followTarget: 'account',
              followCount: BigInt(campaignTargets.followCount),
              likeTargets: dummyTargets,
              likeCountPerPost: BigInt(campaignTargets.likeCountPerPost)
            }
          ]
        });

        setCalculatedPrice(price);
      } catch (error) {
        console.error('Error calculating price:', error);
        // Fallback to base price
        const totalLikes = likeTargetsCount * campaignTargets.likeCountPerPost;
        const totalFollows = campaignTargets.followCount;
        const baseTotal = (totalLikes * contractData.baseLikePrice +
                          totalFollows * contractData.baseFollowPrice);
        setCalculatedPrice(BigInt(baseTotal));
      }
      setIsCalculating(false);
    };

    calculatePrice();
  }, [requirements, contractData, publicClient, campaignTargets]);

  // Load USDC balance when wallet connects
  useEffect(() => {
    const loadUsdcBalance = async () => {
      if (!publicClient || !walletAddress) {
        console.log('[USDC Balance] Skipping load - missing publicClient or walletAddress', {
          hasPublicClient: !!publicClient,
          walletAddress
        });
        return;
      }

      setIsLoadingBalance(true);
      try {
        const address = walletAddress;

        // Get network config to determine USDC address
        const networkConfig = getNetworkConfig();
        const usdcAddress = networkConfig.usdcAddress;
        
        console.log('[USDC Balance] Loading balance for:', {
          walletAddress: address,
          usdcAddress,
          chainId: networkConfig.chainId,
          network: networkConfig.networkName
        });

        // ERC20 ABI for balanceOf function
        const erc20Abi = [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function'
          }
        ] as const;

        const balance = await publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });

        console.log('[USDC Balance] Loaded balance:', {
          balanceRaw: balance.toString(),
          balanceFormatted: formatUnits(balance, 6)
        });

        setUsdcBalance(balance);
      } catch (error) {
        console.error('[USDC Balance] Error loading balance:', error);
        setUsdcBalance(0n);
      }
      setIsLoadingBalance(false);
    };

    loadUsdcBalance();
  }, [publicClient, walletAddress, mockWalletConnected]);
  
  // Convert price to USD string
  const formatPrice = (price: bigint) => {
    return formatUnits(price, 6); // USDC has 6 decimals
  };
  
  const estimatedCost = Number(formatPrice(calculatedPrice));
  const validLikeTargets = campaignTargets.likeTargets.filter(url => url.trim());
  const totalActions = (validLikeTargets.length || 1) * campaignTargets.likeCountPerPost + campaignTargets.followCount;

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
    const validLikeTargets = campaignTargets.likeTargets.filter(url => url.trim());
    if (validLikeTargets.length === 0) {
      setPaymentError('Please provide at least one TikTok post URL for likes');
      return;
    }
    
    if (!campaignTargets.followTarget.trim()) {
      setPaymentError('Please provide a TikTok profile URL for follows');
      return;
    }
    
    if (campaignTargets.likeCountPerPost < 1) {
      setPaymentError('Like count per post must be at least 1');
      return;
    }
    
    if (campaignTargets.followCount < 1) {
      setPaymentError('Follow count must be at least 1');
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
          verifiedOnly: requirements.verifiedOnly,
          minFollowers: requirements.minFollowers,
          minUniqueViews28Days: requirements.minUniqueViews28Days,
          accountLocation: requirements.accountLocation,
          accountLanguage: requirements.accountLanguage,
          likeUrls: validLikeTargets,  // Array of post URLs
          likeCountPerPost: campaignTargets.likeCountPerPost,
          followUrl: campaignTargets.followTarget,
          followCount: campaignTargets.followCount
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
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Create Campaign</h1>
        </div>

        {/* Platform Selection */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Platform</h2>
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
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                  }
                `}
              >
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="w-8 h-8 mx-auto mb-2 object-contain rounded-lg"
                />
                <p className="text-xs font-medium">{platform.name}</p>
                {!platform.available && (
                  <p className="text-[10px] text-muted-foreground">Coming Soon</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Account Qualifications */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Account Qualifications</h2>
          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            {/* Verified Account */}
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
                <span className="text-base font-medium">
                  Verified Account
                </span>
                <BadgeCheck className="w-5 h-5 text-primary" />
              </Label>
            </div>

            {/* Minimum Followers */}
            <div className="space-y-2">
              <Label htmlFor="min-followers" className="text-base font-medium">
                Minimum Followers
              </Label>
              <Input
                id="min-followers"
                type="number"
                min="0"
                placeholder="Enter minimum followers (e.g., 1000)"
                value={requirements.minFollowers || ''}
                onChange={(e) => setRequirements({...requirements, minFollowers: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            {/* Minimum Unique Views (28 days) */}
            <div className="space-y-2">
              <Label htmlFor="min-views" className="text-base font-medium">
                Minimum Unique Views (Last 28 Days)
              </Label>
              <Input
                id="min-views"
                type="number"
                min="0"
                placeholder="Enter minimum views (e.g., 10000)"
                value={requirements.minUniqueViews28Days || ''}
                onChange={(e) => setRequirements({...requirements, minUniqueViews28Days: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            {/* Account Location */}
            <div className="space-y-2">
              <Label htmlFor="account-location" className="text-base font-medium">
                Account Location
              </Label>
              <Select 
                value={requirements.accountLocation} 
                onValueChange={(value) => setRequirements({...requirements, accountLocation: value})}
              >
                <SelectTrigger id="account-location" className="w-full">
                  <SelectValue placeholder="Select account location" />
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

            {/* Account Language */}
            <div className="space-y-2">
              <Label htmlFor="account-language" className="text-base font-medium">
                Account Language
              </Label>
              <Select 
                value={requirements.accountLanguage} 
                onValueChange={(value) => setRequirements({...requirements, accountLanguage: value})}
              >
                <SelectTrigger id="account-language" className="w-full">
                  <SelectValue placeholder="Select account language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="id">Indonesian</SelectItem>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="vi">Vietnamese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>



        {/* Campaign Actions - Configurable */}
        {selectedPlatform === 'tiktok' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Campaign Actions</h2>

            {/* Actions Details Card */}
            <div className="p-4 border border-border rounded-lg bg-card space-y-6">
              {contractData.loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading configuration...</span>
                </div>
              ) : (
                <>
                  {/* Follow Action */}
                  <div className="space-y-4 pb-4 border-b border-border">
                    <h3 className="text-base font-semibold">Follow Action</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="follow-target" className="text-sm font-medium">
                          Account URL
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="follow-count" className="text-sm font-medium">
                          Number of Follows
                        </Label>
                        <Input
                          id="follow-count"
                          type="number"
                          min="1"
                          value={campaignTargets.followCount}
                          onChange={(e) => setCampaignTargets(prev => ({ ...prev, followCount: parseInt(e.target.value) || 1 }))}
                          className="text-base h-11"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Like Actions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Like Actions</h3>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="like-count" className="text-sm font-medium">
                          Likes per Post:
                        </Label>
                        <Input
                          id="like-count"
                          type="number"
                          min="1"
                          value={campaignTargets.likeCountPerPost}
                          onChange={(e) => setCampaignTargets(prev => ({ ...prev, likeCountPerPost: parseInt(e.target.value) || 1 }))}
                          className="w-24 text-base h-9"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {campaignTargets.likeTargets.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://tiktok.com/@username/video/123456789"
                            value={url}
                            onChange={(e) => {
                              const newTargets = [...campaignTargets.likeTargets];
                              newTargets[index] = e.target.value;
                              setCampaignTargets(prev => ({ ...prev, likeTargets: newTargets }));
                            }}
                            className="font-mono text-base h-11 flex-1"
                            required={index === 0}
                          />
                          {campaignTargets.likeTargets.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newTargets = campaignTargets.likeTargets.filter((_, i) => i !== index);
                                setCampaignTargets(prev => ({ ...prev, likeTargets: newTargets }));
                              }}
                              className="h-11 w-11"
                            >
                              <span className="text-lg">×</span>
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCampaignTargets(prev => ({ 
                            ...prev, 
                            likeTargets: [...prev.likeTargets, ''] 
                          }));
                        }}
                        className="w-full"
                      >
                        + Add Another Post URL
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Total Campaign Cost - Simplified Display */}
        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-bold">Total</h3>
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

        {/* Payment Status Alerts */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {paymentSuccess && (
          <div className="space-y-4">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Success!</AlertTitle>
              <AlertDescription className="text-green-600">{paymentSuccess}</AlertDescription>
            </Alert>
            
            {/* Dashboard Prompt */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Your campaign has been created!</h3>
              <p className="text-muted-foreground mb-4">
                Track your campaign performance, view analytics, and manage your advertising campaigns in the dashboard.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="w-full sm:w-auto"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
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
              <>Pay</>
            )}
          </Button>
          {mockWalletConnected && (
            <p className="text-muted-foreground text-center mt-2">
              Pay ${estimatedCost.toFixed(2)} to launch your campaign
            </p>
          )}

          {/* USDC Balance Display */}
          <div className="text-left mt-3">
            <p className="text-base text-muted-foreground">
              Base USDC Balance: {' '}
              {isLoadingBalance ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span className="font-medium">
                  ${formatPrice(usdcBalance)}
                </span>
              )}
            </p>
          </div>
        </div>
    </div>
  );
}