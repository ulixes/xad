# XAD - Decentralized Advertising Platform

Connecting brands with users through social media engagement.


## Project Structure

```
xad/
├── apps/
│   ├── api/          # Backend API (Hono + Cloudflare Workers)
│   ├── web/          # Frontend app (Next.js)
│   └── extension/    # Browser extension
├── contracts/        # Smart contracts (Solidity + Foundry)
└── packages/        # Shared packages
```


## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Web App   │────▶│     API      │────▶│  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     
       ▼                    ▼                     
┌─────────────┐     ┌──────────────┐             
│   Wallet    │────▶│   Contract   │             
└─────────────┘     └──────────────┘             
                            │                     
                            ▼                     
                    ┌──────────────┐             
                    │   Webhook    │             
                    └──────────────┘             

## Support

- [Discord](https://discord.gg/xad)
- [GitHub Issues](https://github.com/xad/xad/issues)
- [Documentation](https://docs.xad.com)