# Contract Deployments

## Base Sepolia (Testnet)

### CampaignPayments Contract
- **Address**: `0x2C37Bb6265579c74F333108020B561A2153C924f`
- **Transaction**: `0xd33761d72931eaa0a863addf339c3bb19ea4ad58db6b235565db00076e37dec3`
- **Block**: `31136480`
- **Network**: Base Sepolia
- **Chain ID**: 84532
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0x2C37Bb6265579c74F333108020B561A2153C924f)

### Verified Functions
- `depositForCampaign(string campaignId, uint256 amount)`
- `withdrawUSDC(address to, uint256 amount)` - Owner only
- `withdrawAllUSDC(address to)` - Owner only
- `getUSDCBalance()` - View function

### Event
```solidity
event CampaignPaymentReceived(
    string indexed campaignId,
    address indexed sender,
    uint256 amount,
    uint256 timestamp
)
```

### USDC Token Address
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Base Mainnet (Production)

⚠️ Not deployed yet

### USDC Token Address
- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`