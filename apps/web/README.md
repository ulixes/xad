# zkAd Web Application

zkAd is a privacy-preserving advertising platform that connects brands with social media users through zero-knowledge proofs. Brands can create targeted campaigns while users maintain their privacy and get paid for engagement.

📋 **[View Product Roadmap](./ROADMAP.md)** - See our plans for targeting features, platform expansion, and more.

## Features

- **For Brands:**
  - Create campaigns on TikTok and Instagram (Beta)
  - Pay per action (likes, follows)
  - Simple campaign creation with no complex targeting (Beta)
  - Real-time campaign analytics
  - Secure crypto payments (ETH on testnet, USDC on mainnet)

- **For Users:**
  - Install browser extension to find paid actions
  - Complete actions and earn crypto
  - Privacy preserved through zero-knowledge proofs
  - Direct wallet payments

## Tech Stack

- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Wagmi + Viem for Web3 integration
- Reown AppKit for wallet connections
- Base network for payments

## Environment Configuration

### Prerequisites

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure environment variables based on your deployment:

### Test Environment (Base Sepolia)

For development and testing with testnet ETH:

```env
# Network Configuration
VITE_NETWORK_ENV=development

# API Configuration
VITE_API_URL=http://localhost:3000

# Escrow Contract (receives ETH payments)
VITE_ESCROW_CONTRACT_SEPOLIA=0x16a5274cCd454f90E99Ea013c89c38381b635f5b

# Reown AppKit (get from https://cloud.reown.com)
VITE_REOWN_PROJECT_ID=your_project_id_here
```

**Payment Details:**
- Network: Base Sepolia
- Payment Token: ETH
- Conversion Rate: $1 = 0.0002 ETH
- Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet

### Production Environment (Base Mainnet)

For production with USDC payments:

```env
# Network Configuration
VITE_NETWORK_ENV=production

# API Configuration
VITE_API_URL=https://api.your-domain.com

# Escrow Contract (receives USDC payments)
VITE_ESCROW_CONTRACT_MAINNET=0xYOUR_MAINNET_ESCROW_ADDRESS

# Reown AppKit
VITE_REOWN_PROJECT_ID=your_production_project_id
```

**Payment Details:**
- Network: Base Mainnet
- Payment Token: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
- Conversion Rate: 1 USDC = $1

## Installation

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── components/
│   ├── AdTargetingForm/      # Campaign creation forms
│   │   ├── AdTargetingForm.tsx       # Full form (all platforms)
│   │   └── AdTargetingFormBeta.tsx   # Beta form (TikTok/Instagram only)
│   ├── BrandDashboard/       # Brand campaign management
│   └── ui/                   # Reusable UI components
├── pages/
│   ├── Dashboard.tsx         # Brand dashboard
│   └── Advertise.tsx         # Campaign creation page
├── services/
│   └── paymentFlow.ts        # Blockchain payment handling
├── config/
│   └── networks.ts           # Network and payment configuration
└── types/                    # TypeScript type definitions
```

## Payment Flow

1. **Test Environment (Base Sepolia):**
   - User creates campaign with USD pricing
   - System converts to ETH at fixed rate ($1 = 0.0002 ETH)
   - Payment processed in ETH to escrow contract
   - Campaign activated immediately after blockchain confirmation

2. **Production Environment (Base Mainnet):**
   - User creates campaign with USD pricing
   - Payment processed in USDC (1:1 with USD)
   - USDC transferred to escrow contract
   - Campaign activated after verification

## API Integration

The web app communicates with the backend API for:
- Campaign creation and management
- Payment verification
- User authentication (wallet-based)
- Campaign analytics

Ensure the API server is running and accessible at the configured `VITE_API_URL`.

## Wallet Integration

Supported wallets through Reown AppKit:
- MetaMask
- Coinbase Wallet
- WalletConnect-compatible wallets

Users must connect their wallet to:
- Create campaigns (brands)
- Sign authentication messages
- Process payments

## Development

```bash
# Run with hot reload
bun run dev

# Run type checking
bun run type-check

# Run linting
bun run lint

# Run tests (if configured)
bun run test
```

## Deployment

### Vercel/Netlify

1. Set environment variables in deployment platform
2. Build command: `bun run build`
3. Output directory: `dist`

### API Proxy Configuration

**Development:** The Vite dev server proxies `/api` requests to `http://localhost:8787` (configured in `vite.config.ts`)

**Production Options:**

**Option 1: Same Domain (Recommended)**
Deploy your API and web app on the same domain with path-based routing:
- `your-domain.com` → Web app
- `your-domain.com/api/*` → API server

**Option 2: Separate Domains**
If deploying on separate domains, you'll need to:
1. Update all `/api` calls to use `VITE_API_URL` environment variable
2. Configure CORS on your API server
3. Example with Vercel:
   ```
   # vercel.json for web app
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://api.your-domain.com/:path*" }
     ]
   }
   ```

**Option 3: Cloudflare Pages + Workers**
Deploy together on Cloudflare:
- Pages for the web app
- Workers for the API (`/api/*` routes)
- Automatic routing handled by Cloudflare

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues:**
   - Ensure wallet is on correct network (Base Sepolia for test, Base for production)
   - Check that wallet has sufficient funds (ETH for test, USDC for production)

2. **Payment Failures:**
   - Verify escrow contract address is correct
   - Check network configuration matches environment
   - Ensure sufficient gas for transactions

3. **API Connection:**
   - Verify `VITE_API_URL` is correct
   - Check CORS settings on API server
   - Ensure authentication token is valid

## License

MIT