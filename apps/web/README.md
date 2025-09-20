# zkAD Web

Frontend application for zkAD - Decentralized advertising platform.

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

Create a `.env` file in the web directory:

```env
# API URL (Required)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Wallet Connect Project ID (Required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=get_from_walletconnect_cloud

# Smart Contract Address (Required)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_contract

# Network: base | base-sepolia
NEXT_PUBLIC_NETWORK=base-sepolia

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## Wallet Setup

1. Get WalletConnect Project ID:
   - Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
   - Create new project
   - Copy Project ID to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

2. Supported wallets:
   - MetaMask
   - Coinbase Wallet
   - Rainbow
   - WalletConnect-compatible wallets

## Available Scripts

```bash
bun run dev           # Start dev server (port 3000)
bun run build         # Build for production
bun run start         # Start production server
bun run lint          # Run ESLint
bun run type-check    # Check TypeScript
```

## Features

### For Brands
- Create advertising campaigns
- Pay with USDC on Base network
- Track campaign performance
- Manage multiple campaigns

### For Users
- Install browser extension
- Complete social media tasks
- Earn rewards instantly
- Connect social accounts

## Payment Flow

1. **Create Campaign** → Draft saved to database
2. **Approve USDC** → Allow contract to spend tokens
3. **Send Payment** → USDC sent to smart contract
4. **Auto-Activation** → Webhook confirms payment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Blockchain**: Viem + Wagmi
- **Wallets**: RainbowKit
- **State**: React Query
- **Forms**: React Hook Form + Zod

## Project Structure

```
web/
├── app/              # Next.js app router pages
├── components/       # Reusable components
├── services/         # API & blockchain services
├── hooks/           # Custom React hooks
├── styles/          # Global styles
└── public/          # Static assets
```

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Self-hosted
```bash
# Build
bun run build

# Start
bun run start
```

## Browser Extension

Users need to install the zkAD extension:

1. Download from Chrome Web Store (coming soon)
2. Or load locally:
   ```bash
   cd ../extension
   bun run build
   # Load unpacked in Chrome://extensions
   ```

## Network Configuration

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

### Base Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org  
- Explorer: https://basescan.org
- USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

## Support

For support, please contact the development team.