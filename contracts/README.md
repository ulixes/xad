# Campaign Payments Smart Contract

A minimal, gas-efficient smart contract for handling USDC campaign payments on Base blockchain.

## Features

- **USDC Payment Processing**: Accept USDC deposits tied to campaign IDs
- **Event Emission**: Indexed events for efficient API monitoring
- **Owner Controls**: Withdraw accumulated funds (owner-only)
- **Gas Efficient**: Deposits use < 45,000 gas (target: < 50,000)
- **Immutable Design**: No storage mappings, minimal state changes

## Contract Details

### Key Functions

1. **`depositForCampaign(string campaignId, uint256 amount)`**
   - Accepts USDC payment for a specific campaign
   - Emits indexed `CampaignPaymentReceived` event
   - Gas usage: ~44,809

2. **`withdrawUSDC(address to, uint256 amount)`**
   - Owner-only function to withdraw specific amount

3. **`withdrawAllUSDC(address to)`**
   - Owner-only function to withdraw entire balance

4. **`getUSDCBalance()`**
   - View current USDC balance

### Events

```solidity
event CampaignPaymentReceived(
    string indexed campaignId,
    address indexed sender,
    uint256 amount,
    uint256 timestamp
)
```

## Deployment

### Prerequisites

1. Copy `.env.example` to `.env`
2. Add your private key (without 0x prefix)
3. Optional: Add Basescan API key for verification

### Deploy to Base Sepolia (Testnet)

```bash
forge script script/DeployCampaignPayments.s.sol --rpc-url base_sepolia --broadcast
```

### Deploy to Base Mainnet

```bash
forge script script/DeployCampaignPayments.s.sol --rpc-url base_mainnet --broadcast
```

### Verify Contract

```bash
forge verify-contract <CONTRACT_ADDRESS> CampaignPayments --rpc-url base_sepolia
```

## USDC Addresses

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Testing

Run all tests:
```bash
forge test
```

Run with gas reporting:
```bash
forge test --gas-report
```

Run specific test:
```bash
forge test --match-test testGasUsage -vvv
```

## Security Features

- Immutable owner (set at deployment)
- No upgradability (simple, secure design)
- Custom errors for gas efficiency
- Input validation (campaign ID, amount)
- Safe ERC20 transfers with error handling

## Gas Optimization

- Uses `immutable` for owner and USDC address
- Custom errors instead of require strings
- No storage arrays or mappings
- Direct transfers without intermediate storage

## Integration

Your API should:
1. Listen for `CampaignPaymentReceived` events
2. Filter by `campaignId` (indexed field)
3. Activate campaign when payment detected
4. Track sender address for attribution
