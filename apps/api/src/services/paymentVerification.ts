// Payment verification service using blockchain RPC
import { createPublicClient, http, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'

interface PaymentVerificationParams {
  transactionHash: string
  expectedAmount: number // Amount in cents
  expectedFromAddress: string
  expectedToAddress: string
  network: 'base' | 'base-sepolia'
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

export async function verifyPaymentTransaction(
  params: PaymentVerificationParams
): Promise<PaymentVerificationResult> {
  const { transactionHash, expectedAmount, expectedFromAddress, expectedToAddress, network } = params
  
  try {
    // Create public client for the specified network
    const chain = network === 'base' ? base : baseSepolia
    const rpcUrl = network === 'base' 
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org'
    
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })
    
    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    })
    
    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return {
        valid: false,
        reason: 'Transaction failed on blockchain'
      }
    }
    
    // Get full transaction details
    const transaction = await client.getTransaction({
      hash: transactionHash as `0x${string}`
    })
    
    // Verify from address matches expected brand wallet
    if (transaction.from.toLowerCase() !== expectedFromAddress.toLowerCase()) {
      return {
        valid: false,
        reason: `From address mismatch. Expected: ${expectedFromAddress}, Got: ${transaction.from}`
      }
    }
    
    // For USDC transfers, we need to check the logs for Transfer events
    // For now, let's implement ETH verification first
    if (transaction.to?.toLowerCase() === expectedToAddress.toLowerCase()) {
      // Direct ETH transfer verification
      const actualAmountEth = formatUnits(transaction.value, 18)
      const actualAmountCents = Math.round(parseFloat(actualAmountEth) * 2000 * 100) // $2000/ETH estimate
      
      // Allow 1% tolerance for gas price fluctuations in ETH estimation
      const tolerance = expectedAmount * 0.01
      if (Math.abs(actualAmountCents - expectedAmount) > tolerance) {
        return {
          valid: false,
          reason: `Amount mismatch. Expected: $${expectedAmount/100}, Got: ~$${actualAmountCents/100} (ETH conversion)`
        }
      }
      
      return {
        valid: true,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        actualAmount: actualAmountCents,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        currency: 'ETH'
      }
    }
    
    // For USDC transfers, check if this is a contract call to USDC token
    // Base mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    // Base sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    const usdcContractAddress = network === 'base' 
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' 
      : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
      
    if (usdcContractAddress && transaction.to?.toLowerCase() === usdcContractAddress.toLowerCase()) {
      // Parse USDC transfer from logs
      const transferLog = receipt.logs.find(log => 
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
      )
      
      if (!transferLog || !transferLog.topics[2]) {
        return {
          valid: false,
          reason: 'USDC transfer log not found'
        }
      }
      
      // Decode transfer event (simplified)
      const toAddressFromLog = `0x${transferLog.topics[2].slice(-40)}`
      const amountHex = transferLog.data
      const actualAmountUsdc = parseInt(amountHex, 16)
      const actualAmountCents = Math.round(actualAmountUsdc / 10000) // USDC has 6 decimals, convert to cents
      
      // Verify to address
      if (toAddressFromLog.toLowerCase() !== expectedToAddress.toLowerCase()) {
        return {
          valid: false,
          reason: `USDC recipient address mismatch. Expected: ${expectedToAddress}, Got: ${toAddressFromLog}`
        }
      }
      
      // Verify amount (allow small tolerance for rounding)
      const tolerance = 1 // 1 cent tolerance
      if (Math.abs(actualAmountCents - expectedAmount) > tolerance) {
        return {
          valid: false,
          reason: `USDC amount mismatch. Expected: $${expectedAmount/100}, Got: $${actualAmountCents/100}`
        }
      }
      
      return {
        valid: true,
        fromAddress: transaction.from,
        toAddress: toAddressFromLog,
        actualAmount: actualAmountCents,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        currency: 'USDC'
      }
    }
    
    return {
      valid: false,
      reason: `Transaction does not match expected payment pattern. To: ${transaction.to}, Expected: ${expectedToAddress}`
    }
    
  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      valid: false,
      reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}