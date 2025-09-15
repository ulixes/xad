import { useState, useEffect } from 'react';
import type { TargetingRule } from '../../types/platform-schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { PaymentFlowService } from '../../services/paymentFlow';
import { getNetworkConfig } from '../../config/networks';

type Platform = 'tiktok' | 'instagram';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: '/social-logos/douyin.png' },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png' },
];

// Beta: Only like and follow actions with minimum prices (in cents)
const platformActions = {
  tiktok: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
  instagram: [
    { id: 'like', name: 'Like', minPrice: 5 },
    { id: 'follow', name: 'Follow', minPrice: 50 },
  ],
};

type ActionConfig = { 
  enabled: boolean; 
  price: number;
  target: string; // URL for posts or profiles
  maxVolume: number; // Maximum number of actions to pay for
};

type ActionPricing = Record<string, ActionConfig>;

interface AdTargetingFormBetaProps {
  initialRule?: TargetingRule;
  onSave?: (rule: TargetingRule) => void;
  onCancel?: () => void;
}

export function AdTargetingFormBeta({ initialRule, onSave }: AdTargetingFormBetaProps) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork, switchNetwork } = useAppKitNetwork()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const networkConfig = getNetworkConfig()
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [actionPricing, setActionPricing] = useState<ActionPricing>({});
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  
  // Beta: No targeting rules, just empty conditions
  const [rule] = useState<TargetingRule>(
    initialRule || {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      rootGroup: {
        id: `group-root`,
        operator: 'AND',
        conditions: [] // No conditions for beta
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    }
  );

  // Calculate estimated cost whenever actions change
  useEffect(() => {
    const enabledActions = Object.values(actionPricing).filter(p => p.enabled);
    if (enabledActions.length > 0) {
      const totalCost = enabledActions.reduce((sum, action) => {
        return sum + (action.price * action.maxVolume / 100); // Convert cents to dollars
      }, 0);
      setEstimatedCost(totalCost);
    } else {
      setEstimatedCost(null);
    }
  }, [actionPricing]);

  const handleSave = async () => {
    // Reset previous states
    setPaymentError(null)
    setPaymentSuccess(null)
    
    // Check wallet connection
    if (!isConnected || !address) {
      setPaymentError('Please connect your wallet first')
      open()
      return
    }

    // Check network
    if (caipNetwork && caipNetwork.id !== networkConfig.chainId) {
      setPaymentError(`Please switch to ${networkConfig.networkName} network`)
      await switchNetwork(networkConfig.network)
      return
    }

    // Validate minimum amount
    if (!estimatedCost || estimatedCost < 5) {
      setPaymentError('Minimum campaign budget is $5')
      return
    }

    // Validate actions selected
    const enabledActions = Object.values(actionPricing).filter(p => p.enabled)
    if (enabledActions.length === 0) {
      setPaymentError('Please select at least one action')
      return
    }

    // Validate targets are filled
    const invalidTargets = Object.entries(actionPricing)
      .filter(([_, config]: [string, any]) => config.enabled && !config.target.trim())
    
    if (invalidTargets.length > 0) {
      setPaymentError('Please fill in all URLs for selected actions')
      return
    }

    setIsProcessingPayment(true)

    try {
      // Prepare campaign data
      const campaignData = {
        platform: selectedPlatform as any,
        targetingRules: rule,
        totalAmount: estimatedCost.toString(),
        actions: Object.entries(actionPricing)
          .filter(([_, config]: [string, any]) => config.enabled)
          .map(([key, config]: [string, any]) => {
            const [, actionType] = key.split('_')
            return {
              type: actionType,
              target: config.target,
              price: config.price,
              maxVolume: config.maxVolume
            }
          }),
        brandWalletAddress: address
      }

      console.log('Campaign data:', campaignData)

      if (!walletClient) {
        throw new Error('Wallet not connected')
      }

      if (!publicClient) {
        throw new Error('Network connection failed')
      }

      // Step 1: Process blockchain payment FIRST
      console.log('Step 1: Processing blockchain payment...')
      const paymentResult = await PaymentFlowService.processPayment(
        campaignData,
        address,
        walletClient,
        publicClient
      )
      
      console.log('Payment transaction submitted:', paymentResult.transactionHash)
      
      // Step 2: Wait for transaction confirmation
      console.log('Step 2: Waiting for transaction confirmation...')
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentResult.transactionHash,
        timeout: 60_000 // 60 second timeout
      })
      
      if (receipt.status === 'success') {
        console.log('Transaction confirmed!', {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed
        })
        
        // Step 3: Create campaign with payment data (only after payment is confirmed)
        console.log('Step 3: Creating campaign with payment data...')
        const campaign = await PaymentFlowService.createCampaignWithPayment(
          campaignData,
          address,
          {
            transactionHash: paymentResult.transactionHash,
            amount: paymentResult.amount,
            currency: paymentResult.currency,
            network: paymentResult.network,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed?.toString()
          }
        )
        
        console.log('Campaign created and activated successfully!', campaign)
        
        setPaymentSuccess(
          `Payment successful! Campaign created with ${paymentResult.currency} on ${paymentResult.network}. Transaction: ${paymentResult.transactionHash?.slice(0, 10)}...`
        )
        
        // Call original onSave if provided
        if (onSave) {
          onSave({
            ...rule,
            updatedAt: new Date()
          })
        }
      } else {
        throw new Error('Transaction failed on blockchain')
      }
      
    } catch (error) {
      console.error('Payment failed:', error)
      setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
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
                  setSelectedPlatform(platform.id as Platform);
                  // Reset action pricing when switching platforms
                  setActionPricing({});
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

        {/* Beta Notice */}
        <Alert className="border-blue-500/50 text-blue-700 [&>svg]:text-blue-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Beta Release</AlertTitle>
          <AlertDescription>
            This is a simplified version for beta testing. No targeting requirements needed - your campaign will be available to all users.
          </AlertDescription>
        </Alert>

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
                      {/* Target URL */}
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-target`} className="text-base font-medium">
                          {isFollowAction ? 'Profile URL' : 'Post URL'}
                        </Label>
                        <Input
                          id={`${key}-target`}
                          type="url"
                          placeholder={
                            isFollowAction 
                              ? selectedPlatform === 'tiktok'
                                ? 'https://tiktok.com/@username'
                                : 'https://instagram.com/username/'
                              : selectedPlatform === 'tiktok'
                                ? 'https://tiktok.com/@user/video/123456789'
                                : 'https://instagram.com/p/ABC123/'
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
        {estimatedCost && estimatedCost > 0 && (
          <div className="py-6 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-semibold">Total</span>
              <div className="text-right">
                <span className={`text-2xl font-semibold ${estimatedCost < 5 ? 'text-red-500' : 'text-foreground'}`}>
                  ${estimatedCost.toFixed(2)}
                </span>
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

        {/* Pay Button */}
        <div className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={
              isProcessingPayment ||
              Object.values(actionPricing).filter(p => p.enabled).length === 0 ||
              (estimatedCost && estimatedCost < 5)
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
            {!isConnected ? 'Connect your wallet to proceed' : 'Minimum: $5'}
          </p>
        </div>
    </div>
  );
}