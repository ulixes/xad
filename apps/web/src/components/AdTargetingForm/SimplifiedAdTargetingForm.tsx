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
import { AlertCircle, CheckCircle, Loader2, BadgeCheck, ArrowRight, MessageCircle, UserPlus, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { PaymentFlowEmbeddedService } from '../../services/paymentFlowEmbedded';
import { useWallets } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrivyAuth } from '../../hooks/usePrivyAuth';
import { CAMPAIGN_PAYMENTS_ABI, getNetworkConfig } from '../../config/networks';
import { useNavigate } from 'react-router-dom';
import { validateTikTokUrl } from '../../utils/urlEncoder';

type Platform = 'tiktok' | 'instagram' | 'x' | 'facebook' | 'reddit' | 'farcaster';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: '/social-logos/douyin.png', available: true },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png', available: false },
  { id: 'x', name: 'X', icon: '/social-logos/x.png', available: false },
  { id: 'facebook', name: 'Facebook', icon: '/social-logos/facebook.png', available: false },
  { id: 'reddit', name: 'Reddit', icon: '/social-logos/reddit.png', available: false },
  { id: 'farcaster', name: 'Farcaster', icon: '/social-logos/farcaster.png', available: false },
];

// Country list with codes matching contract (ALL COUNTRIES WITH 2025 CPM DATA)
const COUNTRIES = [
  { code: 'all', name: 'All Countries' },
  // High CPM Markets (1.0x - 1.5x)
  { code: 'US', name: 'United States' },      // 1.5x
  { code: 'CA', name: 'Canada' },              // 1.1x
  { code: 'UK', name: 'United Kingdom' },      // 1.0x
  { code: 'AU', name: 'Australia' },           // 0.9x
  // European Markets (0.6x - 0.8x)
  { code: 'DE', name: 'Germany' },             // 0.8x
  { code: 'FR', name: 'France' },              // 0.6x
  { code: 'ES', name: 'Spain' },               // 0.7x
  { code: 'IT', name: 'Italy' },               // 0.6x
  // Asian Markets - Developed (0.5x - 0.7x)
  { code: 'JP', name: 'Japan' },               // 0.5x
  { code: 'KR', name: 'South Korea' },         // 0.6x
  { code: 'TW', name: 'Taiwan' },              // 0.6x - NEW!
  // Asian Markets - Emerging (0.2x - 0.7x)
  { code: 'CN', name: 'China' },               // 0.4x - NEW!
  { code: 'IN', name: 'India' },               // 0.2x
  { code: 'ID', name: 'Indonesia' },           // 0.2x
  { code: 'PH', name: 'Philippines' },         // 0.7x
  { code: 'TH', name: 'Thailand' },            // 0.3x - NEW!
  { code: 'VN', name: 'Vietnam' },             // 0.2x - NEW!
  { code: 'MM', name: 'Myanmar' },             // 0.2x - NEW!
  { code: 'LA', name: 'Laos' },                // 0.2x - NEW!
  { code: 'MN', name: 'Mongolia' },            // 0.25x - NEW!
  // Latin America (0.4x)
  { code: 'BR', name: 'Brazil' },              // 0.4x
  { code: 'MX', name: 'Mexico' },              // 0.4x
  // Central Asia (0.35x)
  { code: 'KZ', name: 'Kazakhstan' },          // 0.35x - NEW!
  // Southeast Asia - Additional (0.5x - 1.0x)
  { code: 'SG', name: 'Singapore' },           // 1.0x - NEW!
  { code: 'MY', name: 'Malaysia' }             // 0.5x - NEW!
];

type CampaignTargets = {
  // Follow action (optional)
  followEnabled: boolean;
  followTarget: string;  // Single account URL for follows
  followCount: number;  // Number of follows
  
  // Like action (optional)
  likeEnabled: boolean;
  likeTargets: string[];  // Array of post URLs for likes
  likeCountPerPost: number;  // Number of likes per post
  
  // Comment action (optional)
  commentEnabled: boolean;
  commentTarget: string;  // Single post URL for comments
  commentEmojis: string[];  // Selected emojis
  commentCount: number;  // Number of comments
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
  const [campaignTargets, setCampaignTargets] = useState<CampaignTargets>({
    // Follow action
    followEnabled: true,  // Default enabled
    followTarget: '',
    followCount: 100,  // Default 100 follows
    
    // Like action
    likeEnabled: true,  // Default enabled
    likeTargets: [''],  // Start with one empty URL field
    likeCountPerPost: 50,  // Default 50 likes per post
    
    // Comment action
    commentEnabled: false,  // Default disabled
    commentTarget: '',
    commentEmojis: ['🔥', '😍', '💯'],  // Default selected emojis
    commentCount: 50  // Default 50 comments
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  
  // URL validation states
  const [urlErrors, setUrlErrors] = useState<{
    follow?: string;
    likes?: { [key: number]: string };
  }>({});
  
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
  
  // Contract data (updated pricing)
  const [contractData, setContractData] = useState({
    baseLikePrice: 300000, // $0.30 in USDC (6 decimals) - increased from $0.20
    baseFollowPrice: 600000, // $0.60 in USDC (6 decimals) - increased from $0.40
    baseCommentPrice: 150000, // $0.15 in USDC (6 decimals)
    loading: true
  });
  
  // Account requirements (optional - users can set to 0)
  const [requirements, setRequirements] = useState<AccountRequirements>({
    verifiedOnly: false,
    minFollowers: 0,  // Optional - no minimum required
    minUniqueViews28Days: 0,  // Optional - no minimum required
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
        // Use defaults for Storybook (updated pricing)
        setContractData({
          baseLikePrice: 300000,  // $0.30
          baseFollowPrice: 600000, // $0.60
          baseCommentPrice: 150000, // $0.15
          loading: false
        });
        return;
      }
      
      try {
        // TODO: Update this to fetch actual contract data once contract functions are available
        // const contractAddress = '0xf206c64836CA5Bba3198523911Aa4c06b49fc1E6' as const;
        
        // Use updated base prices from contract
        setContractData({
          baseLikePrice: 300000, // 0.3 USDC per like (6 decimals)
          baseFollowPrice: 600000, // 0.6 USDC per follow (6 decimals)
          baseCommentPrice: 150000, // 0.15 USDC per comment (6 decimals)
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
      const validLikeTargets = campaignTargets.likeEnabled 
        ? campaignTargets.likeTargets.filter(url => url.trim())
        : [];
      const likeTargetsCount = validLikeTargets.length; // 0 if disabled
      
      if (!publicClient) {
        // Mock calculation for Storybook
        const totalLikes = campaignTargets.likeEnabled 
          ? (likeTargetsCount || 1) * campaignTargets.likeCountPerPost 
          : 0;
        const totalFollows = campaignTargets.followEnabled 
          ? campaignTargets.followCount 
          : 0;
        const totalComments = campaignTargets.commentEnabled
          ? campaignTargets.commentCount
          : 0;
        const baseTotal = (totalLikes * contractData.baseLikePrice +
                          totalFollows * contractData.baseFollowPrice +
                          totalComments * contractData.baseCommentPrice);
        setCalculatedPrice(BigInt(baseTotal));
        return;
      }

      setIsCalculating(true);
      try {
        const networkConfig = getNetworkConfig();
        const contractAddress = networkConfig.campaignPaymentsContract as `0x${string}`;

        // Create dummy targets array for price calculation
        const dummyTargets = campaignTargets.likeEnabled 
          ? Array(Math.max(1, likeTargetsCount)).fill('post') 
          : [];
        const accountRequirements = {
          verifiedOnly: requirements.verifiedOnly || false,
          minFollowers: BigInt(requirements.minFollowers || 0),
          minUniqueViews28Days: BigInt(requirements.minUniqueViews28Days || 0),
          accountLocation: requirements.accountLocation || 'all',
          accountLanguage: requirements.accountLanguage || 'all'
        };
        
        const campaignActions = {
          followTarget: campaignTargets.followEnabled ? 'account' : '',
          followCount: BigInt(campaignTargets.followEnabled ? campaignTargets.followCount : 0),
          likeTargets: dummyTargets,
          likeCountPerPost: BigInt(campaignTargets.likeEnabled ? campaignTargets.likeCountPerPost : 0),
          commentTarget: campaignTargets.commentEnabled ? 'post' : '',
          commentContent: campaignTargets.commentEnabled ? campaignTargets.commentEmojis.join(',') : '',
          commentCount: BigInt(campaignTargets.commentEnabled ? campaignTargets.commentCount : 0)
        };
        
        console.log('Sending to contract - Requirements:', accountRequirements);
        console.log('Sending to contract - Actions:', campaignActions);
        
        const price = await publicClient.readContract({
          address: contractAddress,
          abi: CAMPAIGN_PAYMENTS_ABI,
          functionName: 'calculatePrice',
          args: [accountRequirements, campaignActions]
        });

        console.log('Calculated price from contract:', price, 'raw value');
        console.log('Calculated price in USD:', Number(price) / 1e6);
        setCalculatedPrice(price);
      } catch (error) {
        console.error('Error calculating price:', error);
        // Fallback to base price
        const totalLikes = campaignTargets.likeEnabled 
          ? (likeTargetsCount || 1) * campaignTargets.likeCountPerPost 
          : 0;
        const totalFollows = campaignTargets.followEnabled 
          ? campaignTargets.followCount 
          : 0;
        const totalComments = campaignTargets.commentEnabled
          ? campaignTargets.commentCount
          : 0;
        const baseTotal = (totalLikes * contractData.baseLikePrice +
                          totalFollows * contractData.baseFollowPrice +
                          totalComments * contractData.baseCommentPrice);
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
          address: usdcAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        }) as bigint;

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

    // Check that at least one action is enabled
    if (!campaignTargets.followEnabled && !campaignTargets.likeEnabled && !campaignTargets.commentEnabled) {
      setPaymentError('Please enable at least one action (follows, likes, or comments)');
      return;
    }
    
    // Validate follow action if enabled
    if (campaignTargets.followEnabled) {
      if (!campaignTargets.followTarget.trim()) {
        setPaymentError('Please provide a TikTok profile URL for follows');
        return;
      }
      if (campaignTargets.followCount < 1) {
        setPaymentError('Follow count must be at least 1');
        return;
      }
    }
    
    // Validate like action if enabled
    const validLikeTargets = campaignTargets.likeEnabled 
      ? campaignTargets.likeTargets.filter(url => url.trim())
      : [];
    
    if (campaignTargets.likeEnabled) {
      if (validLikeTargets.length === 0) {
        setPaymentError('Please provide at least one TikTok post URL for likes');
        return;
      }
      if (campaignTargets.likeCountPerPost < 1) {
        setPaymentError('Like count per post must be at least 1');
        return;
      }
    }
    
    // Validate emoji comment action if enabled
    if (campaignTargets.commentEnabled) {
      if (!campaignTargets.commentTarget.trim()) {
        setPaymentError('Please provide a TikTok post URL for comments');
        return;
      }
      if (campaignTargets.commentEmojis.length === 0) {
        setPaymentError('Please select at least one emoji for comments');
        return;
      }
      if (campaignTargets.commentCount < 1) {
        setPaymentError('Comment count must be at least 1');
        return;
      }
    }
    
    // Check minimum payment requirement
    if (estimatedCost < 40) {
      setPaymentError('Campaign must be at least $40. Please increase your actions or requirements.');
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
          platform: 'tiktok' as Platform,
          verifiedOnly: requirements.verifiedOnly,
          minFollowers: requirements.minFollowers,
          minUniqueViews28Days: requirements.minUniqueViews28Days,
          accountLocation: requirements.accountLocation,
          accountLanguage: requirements.accountLanguage,
          likeUrls: campaignTargets.likeEnabled ? validLikeTargets : [],
          likeCountPerPost: campaignTargets.likeEnabled ? campaignTargets.likeCountPerPost : 0,
          followUrl: campaignTargets.followEnabled ? campaignTargets.followTarget : '',
          followCount: campaignTargets.followEnabled ? campaignTargets.followCount : 0,
          commentUrl: campaignTargets.commentEnabled ? campaignTargets.commentTarget : '',
          commentEmojis: campaignTargets.commentEnabled ? campaignTargets.commentEmojis : [],
          commentCount: campaignTargets.commentEnabled ? campaignTargets.commentCount : 0
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
              platform: 'tiktok' as Platform,
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-left">Tiktok micro-influencer marketing at scale</h1>
          <p className="text-lg leading-relaxed tracking-tight text-muted-foreground mt-2">
            Pay humans, not bots, to like, follow, and engage with your content. Powered by{' '}
            <a
              href="https://self.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Self.xyz
            </a>
            .
          </p>
        </div>

        {/* Account Qualifications */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Account Requirements</h2>
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
                  Verified
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
                type="text"
                placeholder="500"
                value={requirements.minFollowers || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setRequirements({...requirements, minFollowers: Math.max(0, value)});
                }}
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
                type="text"
                placeholder="1000"
                value={requirements.minUniqueViews28Days || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setRequirements({...requirements, minUniqueViews28Days: Math.max(0, value)});
                }}
                className="w-full"
              />
            </div>

            {/* Account Location */}
            <div className="space-y-2">
              <Label htmlFor="account-location" className="text-base font-medium">
                Location
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
                Language
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
                  <SelectItem value="ms">Malay</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>



        {/* Campaign Actions - Configurable */}
        {(
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Actions</h2>

            {/* Actions Details Card */}
            <div className="p-4 border border-border rounded-lg bg-card">
              {contractData.loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading configuration...</span>
                </div>
              ) : (
                <>
                  {/* Follow Action */}
                  <div className="space-y-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="follow-toggle"
                        checked={campaignTargets.followEnabled}
                        onCheckedChange={(checked) =>
                          setCampaignTargets(prev => ({ ...prev, followEnabled: checked as boolean }))
                        }
                      />
                      <Label htmlFor="follow-toggle" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </Label>
                    </div>
                    {campaignTargets.followEnabled && (
                    <div className="flex items-end gap-4">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="follow-target" className="text-sm font-medium">
                          Account URL
                        </Label>
                        <Input
                          id="follow-target"
                          type="url"
                          placeholder="https://tiktok.com/@username"
                          value={campaignTargets.followTarget}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCampaignTargets(prev => ({ ...prev, followTarget: value }));
                            
                            // Validate URL
                            if (value.trim()) {
                              const validation = validateTikTokUrl(value, 'follow');
                              if (!validation.isValid) {
                                setUrlErrors(prev => ({ ...prev, follow: validation.error }));
                              } else {
                                setUrlErrors(prev => ({ ...prev, follow: undefined }));
                              }
                            } else {
                              setUrlErrors(prev => ({ ...prev, follow: undefined }));
                            }
                          }}
                          className={`font-mono text-base h-11 ${urlErrors.follow ? 'border-red-500' : ''}`}
                          required
                        />
                        {urlErrors.follow && (
                          <p className="text-sm text-red-500 mt-1">{urlErrors.follow}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="follow-count" className="text-sm font-medium">
                          Number of Follows
                        </Label>
                        <Input
                          id="follow-count"
                          type="text"
                          value={campaignTargets.followCount}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setCampaignTargets(prev => ({ ...prev, followCount: value }));
                          }}
                          className="h-11 w-32"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Like Actions */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="like-toggle"
                        checked={campaignTargets.likeEnabled}
                        onCheckedChange={(checked) =>
                          setCampaignTargets(prev => ({ ...prev, likeEnabled: checked as boolean }))
                        }
                      />
                      <Label htmlFor="like-toggle" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Like
                      </Label>
                    </div>
                    {campaignTargets.likeEnabled && (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-end gap-4">
                            <div className="flex-1 space-y-1">
                              <Label className="text-sm font-medium">Post URLs</Label>
                              <Input
                                type="url"
                                placeholder="https://tiktok.com/@username/video/123456789"
                                value={campaignTargets.likeTargets[0] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const newTargets = [...campaignTargets.likeTargets];
                                  newTargets[0] = value;
                                  setCampaignTargets(prev => ({ ...prev, likeTargets: newTargets }));

                                  // Validate URL
                                  if (value.trim()) {
                                    const validation = validateTikTokUrl(value, 'like');
                                    if (!validation.isValid) {
                                      setUrlErrors(prev => ({
                                        ...prev,
                                        likes: { ...prev.likes, [0]: validation.error }
                                      }));
                                    } else {
                                      setUrlErrors(prev => {
                                        const newLikes = { ...prev.likes };
                                        delete newLikes[0];
                                        return { ...prev, likes: newLikes };
                                      });
                                    }
                                  } else {
                                    setUrlErrors(prev => {
                                      const newLikes = { ...prev.likes };
                                      delete newLikes[0];
                                      return { ...prev, likes: newLikes };
                                    });
                                  }
                                }}
                                className={`font-mono text-base h-11 ${urlErrors.likes?.[0] ? 'border-red-500' : ''}`}
                                required
                              />
                              {urlErrors.likes?.[0] && (
                                <p className="text-sm text-red-500 pl-1">{urlErrors.likes[0]}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="like-count" className="text-sm font-medium">
                                Likes per Post
                              </Label>
                              <Input
                                id="like-count"
                                type="text"
                                value={campaignTargets.likeCountPerPost}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setCampaignTargets(prev => ({ ...prev, likeCountPerPost: value }));
                                }}
                                className="h-11 w-32"
                                placeholder="50"
                              />
                            </div>
                          </div>

                          {campaignTargets.likeTargets.slice(1).map((url, index) => (
                            <div key={index + 1} className="space-y-1">
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  placeholder="https://tiktok.com/@username/video/123456789"
                                  value={url}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newTargets = [...campaignTargets.likeTargets];
                                    newTargets[index + 1] = value;
                                    setCampaignTargets(prev => ({ ...prev, likeTargets: newTargets }));

                                    // Validate URL
                                    const actualIndex = index + 1;
                                    if (value.trim()) {
                                      const validation = validateTikTokUrl(value, 'like');
                                      if (!validation.isValid) {
                                        setUrlErrors(prev => ({
                                          ...prev,
                                          likes: { ...prev.likes, [actualIndex]: validation.error }
                                        }));
                                      } else {
                                        setUrlErrors(prev => {
                                          const newLikes = { ...prev.likes };
                                          delete newLikes[actualIndex];
                                          return { ...prev, likes: newLikes };
                                        });
                                      }
                                    } else {
                                      setUrlErrors(prev => {
                                        const newLikes = { ...prev.likes };
                                        delete newLikes[actualIndex];
                                        return { ...prev, likes: newLikes };
                                      });
                                    }
                                  }}
                                  className={`font-mono text-base h-11 flex-1 ${urlErrors.likes?.[index + 1] ? 'border-red-500' : ''}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    const newTargets = campaignTargets.likeTargets.filter((_, i) => i !== (index + 1));
                                    setCampaignTargets(prev => ({ ...prev, likeTargets: newTargets }));
                                  }}
                                  className="h-11 w-11"
                                >
                                  <span className="text-lg">×</span>
                                </Button>
                              </div>
                              {urlErrors.likes?.[index + 1] && (
                                <p className="text-sm text-red-500 pl-1">{urlErrors.likes[index + 1]}</p>
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
                            +
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comment Action */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="emoji-comment-toggle"
                        checked={campaignTargets.commentEnabled}
                        onCheckedChange={(checked) =>
                          setCampaignTargets(prev => ({ ...prev, commentEnabled: checked as boolean }))
                        }
                      />
                      <Label htmlFor="emoji-comment-toggle" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Comments
                      </Label>
                    </div>
                    {campaignTargets.commentEnabled && (
                      <div className="space-y-3">
                        {/* Target Post URL and Number aligned like the Like action */}
                        <div className="flex items-end gap-4">
                          <div className="flex-1 space-y-1">
                            <Label className="text-sm font-medium">Post URL</Label>
                            <Input
                              type="url"
                              placeholder="https://tiktok.com/@username/video/123456789"
                              value={campaignTargets.commentTarget}
                              onChange={(e) => {
                                setCampaignTargets(prev => ({ ...prev, commentTarget: e.target.value }));
                              }}
                              className="font-mono text-base h-11"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="emoji-comment-count" className="text-sm font-medium">
                              Number of Comments
                            </Label>
                            <Input
                              id="emoji-comment-count"
                              type="text"
                              value={campaignTargets.commentCount}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setCampaignTargets(prev => ({ ...prev, commentCount: value }));
                              }}
                              className="h-11 w-32"
                              placeholder="50"
                            />
                          </div>
                        </div>

                        {/* Emoji Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Select Emojis (will be randomly distributed)</Label>
                          <div className="flex flex-wrap gap-2">
                            {['🔥', '😍', '💯', '🤩', '👏', '❤️', '😂', '🙌', '💪', '✨', '🎉', '🚀'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setCampaignTargets(prev => ({
                                    ...prev,
                                    commentEmojis: prev.commentEmojis.includes(emoji)
                                      ? prev.commentEmojis.filter(e => e !== emoji)
                                      : [...prev.commentEmojis, emoji]
                                  }));
                                }}
                                className={`text-2xl p-2 rounded border-2 transition-all ${
                                  campaignTargets.commentEmojis.includes(emoji)
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          {campaignTargets.commentEmojis.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {campaignTargets.commentEmojis.join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Total Campaign Cost with Minimum Requirement */}
        <div className="border-t border-border pt-6">
          <div className="space-y-4">
            {/* Pricing Breakdown - Only show if there are multipliers */}
            {(requirements.minFollowers >= 1000 || requirements.minUniqueViews28Days >= 10000 || requirements.verifiedOnly) && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                {requirements.minFollowers >= 1000 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quality Multiplier ({requirements.minFollowers.toLocaleString()}+ followers):</span>
                    <span>×{requirements.minFollowers >= 1000000 ? '2.0' : requirements.minFollowers >= 500000 ? '1.75' : requirements.minFollowers >= 100000 ? '1.5' : requirements.minFollowers >= 50000 ? '1.35' : requirements.minFollowers >= 10000 ? '1.2' : '1.1'}</span>
                  </div>
                )}
                {requirements.minUniqueViews28Days >= 10000 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Views Multiplier ({requirements.minUniqueViews28Days.toLocaleString()}+ views):</span>
                    <span>×{requirements.minUniqueViews28Days >= 10000000 ? '2.1' : requirements.minUniqueViews28Days >= 5000000 ? '1.85' : requirements.minUniqueViews28Days >= 1000000 ? '1.6' : requirements.minUniqueViews28Days >= 500000 ? '1.45' : requirements.minUniqueViews28Days >= 100000 ? '1.3' : requirements.minUniqueViews28Days >= 50000 ? '1.2' : '1.1'}</span>
                  </div>
                )}
                {requirements.verifiedOnly && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Verified Accounts Only:</span>
                    <span>×1.5</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Total */}
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-bold">Total</h3>
              <div className="text-right">
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg">Calculating...</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      ${estimatedCost.toFixed(2)}
                    </div>
                    {estimatedCost < 40 && (
                      <p className="text-sm text-orange-500 mt-1">
                        Minimum: $40.00
                      </p>
                    )}
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
              (!campaignTargets.followEnabled && !campaignTargets.likeEnabled && !campaignTargets.commentEnabled) ||  // At least one action
              (campaignTargets.likeEnabled && campaignTargets.likeTargets.filter(url => url.trim()).length === 0) ||
              (campaignTargets.followEnabled && !campaignTargets.followTarget.trim()) ||
              (campaignTargets.commentEnabled && (!campaignTargets.commentTarget.trim() || campaignTargets.commentEmojis.length === 0)) ||
              contractData.loading ||
              isCalculating ||
              (campaignTargets.followEnabled && !!urlErrors.follow) ||
              (campaignTargets.likeEnabled && !!(urlErrors.likes && Object.keys(urlErrors.likes).length > 0)) ||
              estimatedCost < 40  // Minimum $40 requirement
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