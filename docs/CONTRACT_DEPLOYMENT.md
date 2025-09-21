# Contract Deployment Guide

## Quick Deploy

From the project root, run:
```bash
./deploy-contracts.sh
```

This interactive script will:
1. Check your environment setup
2. Let you choose the network (Sepolia testnet or Base mainnet)
3. Deploy the CampaignPayments contract
4. Show the deployed contract address

## Available Commands

```bash
# Interactive deployment
./deploy-contracts.sh

# Check deployment status
./deploy-check.sh

# Using npm/bun scripts
bun contract:build           # Build contracts
bun contract:test            # Run tests
bun contract:test:gas        # Run tests with gas report
bun contract:deploy          # Interactive deploy
bun contract:deploy:sepolia  # Direct deploy to Sepolia
bun contract:deploy:mainnet  # Direct deploy to mainnet
bun contract:check           # Check deployment status
```

## First Time Setup

1. **Configure Environment**
   ```bash
   cd contracts
   cp .env.example .env
   ```

2. **Edit `contracts/.env`**
   ```env
   PRIVATE_KEY=your_private_key_without_0x
   BASESCAN_API_KEY=your_basescan_api_key_optional
   ```

3. **Deploy**
   ```bash
   ./deploy-contracts.sh
   # Select option 1 for testnet first
   ```

## Contract Addresses

### USDC Token Addresses
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Your Deployed Contracts
Run `./deploy-check.sh` to see your deployed contract addresses.

## Verification

After deployment, verify your contract on Basescan:
```bash
cd contracts
forge verify-contract YOUR_CONTRACT_ADDRESS CampaignPayments --rpc-url base_sepolia
```

## Testing Before Deploy

Always test before deploying:
```bash
cd contracts
forge test -vvv
forge test --gas-report
```

## Troubleshooting

- **"Private key not set"**: Add your key to `contracts/.env`
- **"Insufficient funds"**: Get testnet ETH from [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- **Deployment fails**: Check your RPC connection and gas settings