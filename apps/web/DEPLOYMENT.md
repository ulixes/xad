# Deployment Configuration

## Environment-Based Network Setup

### Local Development (Base Sepolia)
```bash
VITE_NETWORK_ENV=development
```
- Uses Base Sepolia testnet
- ETH payments (fallback)
- Test funds available via Coinbase faucet

### Production (Base Mainnet)
```bash
VITE_NETWORK_ENV=production  
```
- Uses Base mainnet
- USDC payments
- Real transactions

## Fleek Dashboard Configuration

Add these environment variables to your Fleek project:

```bash
# Production deployment
VITE_NETWORK_ENV=production
VITE_REOWN_PROJECT_ID=your_actual_project_id_here

# Smart contract addresses (deploy your contracts first)
VITE_ESCROW_CONTRACT_MAINNET=0xYourDeployedContractAddress
VITE_PAYMENT_TOKEN_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Optional: Custom RPC if needed
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

## Automatic Environment Detection

The app automatically detects the network based on `VITE_NETWORK_ENV`:

- **Development**: Base Sepolia + ETH payments + faucet links
- **Production**: Base mainnet + USDC payments + no faucet

## Payment Flow Summary

1. **Local/Staging**: ETH transfer to demo address on Base Sepolia
2. **Production**: USDC transfer to escrow contract on Base mainnet
3. **Wallet signatures**: Required for all transactions
4. **Network validation**: Automatically checks correct network
5. **Transaction confirmations**: Waits for blockchain confirmation

## Next Steps

1. Deploy escrow smart contract to Base mainnet
2. Update `VITE_ESCROW_CONTRACT_MAINNET` with real address
3. Set production environment variables in Fleek
4. Test with small amounts first