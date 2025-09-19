// DEPRECATED: This service is no longer used.
// Payment verification is now handled through smart contract events and webhooks.
// Keeping minimal stub for backward compatibility during migration.

interface PaymentVerificationParams {
  transactionHash: string
  expectedAmount: number
  expectedFromAddress: string
  expectedToAddress: string
  network: 'base' | 'base-sepolia'
  paymentCurrency?: 'ETH' | 'USDC'
}

interface PaymentVerificationResult {
  valid: boolean
  reason?: string
  fromAddress?: string
  toAddress?: string
  actualAmount?: number
  blockNumber?: bigint
  gasUsed?: bigint
  currency?: string
}

// @deprecated - Use webhook events from smart contract instead
export async function verifyPaymentTransaction(
  params: PaymentVerificationParams
): Promise<PaymentVerificationResult> {
  // This function is deprecated and should not be used
  // Return a simple rejection to prevent accidental usage
  console.warn('⚠️ DEPRECATED: verifyPaymentTransaction is no longer used.')
  console.warn('Use smart contract events and webhook integration instead.')
  
  return {
    valid: false,
    reason: 'Payment verification has been migrated to smart contract events. This method is deprecated.',
  }
}