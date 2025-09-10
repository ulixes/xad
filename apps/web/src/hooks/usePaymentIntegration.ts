// Hook for integrating payment flow with the AdTargetingForm

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { usePaymentFlow } from '../services/paymentFlow'
import type { TargetingRule } from '../types/platform-schemas'

interface PaymentState {
  isProcessing: boolean
  error: string | null
  success: boolean
  transactionHash: string | null
  campaignId: string | null
}

export function usePaymentIntegration() {
  const { address, isConnected } = useAccount()
  const { processFullPayment } = usePaymentFlow()
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    success: false,
    transactionHash: null,
    campaignId: null
  })

  const submitCampaignWithPayment = async (
    platform: string,
    actionPricing: Record<string, any>,
    targetingRule: TargetingRule,
    estimatedCost: any
  ) => {
    if (!isConnected || !address) {
      setPaymentState(prev => ({ ...prev, error: 'Please connect your wallet first' }))
      return
    }

    if (estimatedCost.totalCost < 50) {
      setPaymentState(prev => ({ ...prev, error: 'Minimum campaign budget is $50' }))
      return
    }

    setPaymentState({
      isProcessing: true,
      error: null,
      success: false,
      transactionHash: null,
      campaignId: null
    })

    try {
      // Prepare campaign data
      const campaignData = {
        name: targetingRule.name || `${platform} Campaign`,
        description: targetingRule.description || '',
        platform,
        targetingRules: targetingRule,
        totalAmount: estimatedCost.totalCost.toString(), // Already in dollars from pricing calculator
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
          })
      }

      // Process the full payment flow
      const result = await processFullPayment(campaignData, address)

      if (result.success) {
        setPaymentState({
          isProcessing: false,
          error: null,
          success: true,
          transactionHash: result.transactionHash,
          campaignId: result.campaign.id
        })
      } else {
        setPaymentState({
          isProcessing: false,
          error: result.error || 'Payment failed',
          success: false,
          transactionHash: null,
          campaignId: null
        })
      }
    } catch (error) {
      setPaymentState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
        transactionHash: null,
        campaignId: null
      })
    }
  }

  const resetPaymentState = () => {
    setPaymentState({
      isProcessing: false,
      error: null,
      success: false,
      transactionHash: null,
      campaignId: null
    })
  }

  return {
    paymentState,
    submitCampaignWithPayment,
    resetPaymentState,
    isWalletConnected: isConnected,
    walletAddress: address
  }
}