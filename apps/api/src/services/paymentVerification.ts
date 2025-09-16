// Payment verification service using blockchain RPC
import { createPublicClient, http, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'

interface PaymentVerificationParams {
  transactionHash: string
  expectedAmount: number // Amount in cents
  expectedFromAddress: string
  expectedToAddress: string
  network: 'base' | 'base-sepolia'
  paymentCurrency?: 'ETH' | 'USDC' // Optional, defaults based on environment
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
  const { transactionHash, expectedAmount, expectedFromAddress, expectedToAddress, network, paymentCurrency } = params
  
  // Determine payment currency based on environment config or parameter
  const currency = paymentCurrency || 
    (process.env.PAYMENT_CURRENCY as 'ETH' | 'USDC') || 
    (network === 'base' ? 'USDC' : 'ETH') // Default: USDC for mainnet, ETH for testnet
  
  console.log('=== PAYMENT VERIFICATION START ===');
  console.log('Transaction hash:', transactionHash);
  console.log('Network:', network);
  console.log('Currency:', currency);
  console.log('Expected from:', expectedFromAddress);
  console.log('Expected to:', expectedToAddress);
  console.log('Expected amount (cents):', expectedAmount);
  
  try {
    // Create public client for the specified network
    const chain = network === 'base' ? base : baseSepolia
    const rpcUrl = network === 'base' 
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org'
    
    console.log('Using RPC URL:', rpcUrl);
    
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })
    
    // Get transaction receipt with multiple retries for blockchain propagation delays
    let receipt;
    let retryCount = 0;
    const maxRetries = 10; // Increased from 5 to 10
    
    while (retryCount < maxRetries) {
      try {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s, then 30s for remaining attempts
        const delay = Math.min(2000 * Math.pow(2, retryCount), 30000);
        
        if (retryCount > 0) {
          console.log(`Retry ${retryCount}/${maxRetries}: Waiting ${delay/1000}s before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`Attempting to fetch transaction receipt (attempt ${retryCount + 1}/${maxRetries})...`);
        receipt = await client.getTransactionReceipt({
          hash: transactionHash as `0x${string}`
        })
        console.log('Transaction receipt found!', { 
          blockNumber: receipt.blockNumber,
          status: receipt.status,
          gasUsed: receipt.gasUsed 
        });
        break; // Successfully got receipt
      } catch (error: any) {
        retryCount++;
        console.error(`Failed to get receipt (attempt ${retryCount}/${maxRetries}):`, error.message);
        if (retryCount >= maxRetries) {
          console.error('Max retries reached. Transaction may still be pending.');
          throw error; // Max retries reached, throw the error
        }
      }
    }
    
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
    
    // Handle ETH transfers
    if (currency === 'ETH') {
      // Verify it's a direct ETH transfer to the escrow address
      if (transaction.to?.toLowerCase() !== expectedToAddress.toLowerCase()) {
        return {
          valid: false,
          reason: `ETH recipient mismatch. Expected: ${expectedToAddress}, Got: ${transaction.to}`
        }
      }
      
      // Calculate ETH amount in cents
      const actualAmountEth = formatUnits(transaction.value, 18)
      const ethToUsdRate = process.env.ETH_USD_RATE ? parseFloat(process.env.ETH_USD_RATE) : 3000 // Default $3000/ETH
      const actualAmountCents = Math.round(parseFloat(actualAmountEth) * ethToUsdRate * 100)
      
      console.log('ETH Payment Details:');
      console.log('- Amount (ETH):', actualAmountEth);
      console.log('- ETH/USD Rate:', ethToUsdRate);
      console.log('- Amount (USD):', actualAmountCents / 100);
      
      // Verify amount with tolerance (5% for ETH due to price volatility)
      const tolerance = expectedAmount * 0.05
      if (Math.abs(actualAmountCents - expectedAmount) > tolerance) {
        return {
          valid: false,
          reason: `ETH amount mismatch. Expected: $${expectedAmount/100}, Got: $${actualAmountCents/100} (at $${ethToUsdRate}/ETH)`
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
    
    // Handle USDC transfers
    // Base mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    // Base sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    const usdcContractAddress = network === 'base' 
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' 
      : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
      
    if (transaction.to?.toLowerCase() !== usdcContractAddress.toLowerCase()) {
      return {
        valid: false,
        reason: `Transaction is not a USDC transfer. Expected USDC contract: ${usdcContractAddress}, Got: ${transaction.to}`
      }
    }
    
    // Parse USDC transfer from logs
    const transferLog = receipt.logs.find(log => 
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' && // Transfer event signature
      log.address.toLowerCase() === usdcContractAddress.toLowerCase() // Ensure it's from USDC contract
    )
    
    if (!transferLog || !transferLog.topics[2]) {
      return {
        valid: false,
        reason: 'USDC transfer log not found in transaction'
      }
    }
    
    // Decode transfer event
    const fromAddressFromLog = `0x${transferLog.topics[1].slice(-40)}`
    const toAddressFromLog = `0x${transferLog.topics[2].slice(-40)}`
    const amountHex = transferLog.data
    const actualAmountUsdc = parseInt(amountHex, 16)
    const actualAmountCents = Math.round(actualAmountUsdc / 10000) // USDC has 6 decimals, convert to cents
    
    console.log('=== PAYMENT VERIFICATION ===');
    console.log('Network:', network);
    console.log('USDC Contract:', usdcContractAddress);
    console.log('From:', fromAddressFromLog);
    console.log('To:', toAddressFromLog);
    console.log('Amount (USDC):', actualAmountUsdc / 1000000); // Show in USDC units
    console.log('Amount (USD):', actualAmountCents / 100);
    
    // Verify from address
    if (fromAddressFromLog.toLowerCase() !== expectedFromAddress.toLowerCase()) {
      return {
        valid: false,
        reason: `USDC sender address mismatch. Expected: ${expectedFromAddress}, Got: ${fromAddressFromLog}`
      }
    }
    
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
    
    console.log('=== PAYMENT VERIFICATION SUCCESS ===');
    
    return {
      valid: true,
      fromAddress: fromAddressFromLog,
      toAddress: toAddressFromLog,
      actualAmount: actualAmountCents,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      currency: 'USDC'
    }
    
  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      valid: false,
      reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}