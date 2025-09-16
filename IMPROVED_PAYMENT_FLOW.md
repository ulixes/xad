# Improved Campaign & Payment Flow

## Current Issues
1. Payment goes directly to wallet with no campaign reference
2. No way to link specific payment to specific campaign
3. Campaign created after payment (risky if creation fails)
4. No proper state tracking during the process

## Proposed Solution: Two-Phase Creation with State Tracking

### Campaign States
```
draft → pending_payment → payment_processing → active → completed
                        ↓
                    payment_failed → cancelled
```

### Implementation Plan

## Option 1: Campaign First, Then Payment (Recommended)

### Step 1: Create Campaign in Draft State
```typescript
// Frontend
POST /api/campaigns/draft
{
  platform: "tiktok",
  targetingRules: {...},
  actions: [...],
  totalAmount: "500",
  brandWalletAddress: "0xBrand..."
}

// Response
{
  campaign: {
    id: "c123",
    status: "pending_payment",
    paymentDetails: {
      amount: "0.1667",  // ETH amount
      currency: "ETH",
      toAddress: "0x16a527...",
      memo: "XAD_c123"  // Reference for tracking
    }
  }
}
```

### Step 2: Send Payment with Reference
```typescript
// Include campaign ID in transaction
const tx = await walletClient.sendTransaction({
  to: campaign.paymentDetails.toAddress,
  value: parseEther(campaign.paymentDetails.amount),
  data: toHex(campaign.paymentDetails.memo) // "XAD_c123" encoded
})
```

### Step 3: Confirm Payment
```typescript
POST /api/campaigns/{id}/confirm-payment
{
  transactionHash: "0x123..."
}

// Backend verifies:
// 1. Transaction exists
// 2. Amount matches
// 3. Updates campaign to 'active'
```

## Option 2: Payment Tracking Table

### Database Changes
```sql
-- Add payment_intents table
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  expected_amount INTEGER,
  expected_currency VARCHAR,
  payment_reference VARCHAR UNIQUE,
  transaction_hash VARCHAR,
  status VARCHAR, -- pending, completed, failed
  created_at TIMESTAMP,
  expires_at TIMESTAMP -- auto-cancel after 1 hour
);
```

### Flow
1. Create campaign → Generate payment intent
2. User pays → Include payment reference
3. Webhook/polling verifies payment
4. Match payment to campaign via reference
5. Activate campaign

## Option 3: Smart Contract Escrow (Best but Complex)

### Escrow Contract
```solidity
contract CampaignEscrow {
  mapping(bytes32 => Campaign) public campaigns;
  
  function depositForCampaign(
    string memory campaignId
  ) external payable {
    bytes32 id = keccak256(abi.encodePacked(campaignId));
    campaigns[id] = Campaign({
      depositor: msg.sender,
      amount: msg.value,
      timestamp: block.timestamp
    });
    emit CampaignFunded(campaignId, msg.sender, msg.value);
  }
}
```

### Benefits
- On-chain campaign reference
- Transparent fund tracking
- Event-based verification
- True escrow functionality

## Recommended Quick Fix (Without Smart Contract)

### 1. Update Campaign Creation Route
```typescript
// campaigns.ts - Create draft campaign first
campaignRoutes.post('/draft', authMiddleware, async (c) => {
  // Create campaign with status: 'pending_payment'
  // Return payment details including reference
})

// Separate confirmation endpoint
campaignRoutes.post('/:id/confirm-payment', authMiddleware, async (c) => {
  // Verify payment
  // Update campaign status to 'active'
})
```

### 2. Update Frontend Flow
```typescript
// paymentFlow.ts
class PaymentFlowService {
  static async createCampaignWithPayment(formData, walletAddress) {
    // Step 1: Create draft campaign
    const campaign = await this.createDraftCampaign(formData, walletAddress)
    
    // Step 2: Process payment with reference
    const paymentResult = await this.processPaymentWithReference(
      campaign.paymentDetails,
      walletClient
    )
    
    // Step 3: Confirm payment
    await this.confirmCampaignPayment(campaign.id, paymentResult.transactionHash)
    
    return campaign
  }
}
```

### 3. Add Payment Reference to Transaction
```typescript
// Include campaign ID in transaction data
const tx = await walletClient.sendTransaction({
  to: escrowAddress,
  value: ethAmount,
  data: encodePacked(['string'], [`XAD_${campaignId}`])
})
```

### 4. Backend Payment Verification
```typescript
// paymentVerification.ts
// Extract campaign reference from transaction input data
const inputData = transaction.input
if (inputData && inputData !== '0x') {
  const decoded = decodeAbiParameters(
    [{ type: 'string' }],
    inputData
  )
  const campaignRef = decoded[0] // "XAD_c123"
  const campaignId = campaignRef.replace('XAD_', '')
  
  // Link payment to specific campaign
  await linkPaymentToCampaign(campaignId, transactionHash)
}
```

## Benefits of This Approach
1. **Clear campaign-payment linking** via reference in transaction data
2. **Better state tracking** - know exactly where each campaign is
3. **Safer flow** - campaign exists before payment
4. **Recovery possible** - can retry payment if it fails
5. **Better UX** - user sees campaign ID before paying

## Migration Steps
1. Add payment_reference column to campaigns table
2. Update API to support draft campaign creation
3. Update frontend to use two-phase flow
4. Add transaction data encoding for references
5. Update verification to extract and match references