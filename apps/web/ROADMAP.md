# zkAd Platform Roadmap

## Current State: Beta Release
- **Platforms**: TikTok & Instagram only
- **Actions**: Like & Follow only  
- **Targeting**: None (open to all users)
- **Payments**: ETH on testnet, USDC planned for mainnet

## Phase 1: Complete Targeting System (Q1 2025)

### Platform-Specific Targeting

#### TikTok Targeting Conditions
- **Follower count** (min/max ranges)
- **Video views** (average per video)
- **Engagement rate** (likes + comments / views)
- **Account age** (days since creation)
- **Verification status** (blue checkmark)
- **Content categories** (music, comedy, education, etc.)
- **Audience demographics**:
  - Age distribution (13-17, 18-24, 25-34, 35-44, 45+)
  - Gender distribution
  - Top countries/regions
- **FYP eligibility** (appears on For You Page)

#### Instagram Targeting Conditions  
- **Follower count** (min/max ranges)
- **Account type** (personal, business, creator)
- **Engagement rate** (interactions / reach)
- **Story views** (average)
- **Reels performance** (avg views)
- **Audience demographics**:
  - Age distribution
  - Gender distribution  
  - Top locations (cities/countries)
- **Account insights**:
  - Profile visits (30-day)
  - Accounts reached (7-day)
  - Content interactions

### Zero-Knowledge Proof Integration
- Users prove they meet criteria without revealing exact data
- Privacy-preserving verification using Lit Protocol
- Secure credential storage and attestation

## Phase 2: Platform Expansion (Q2 2025)

### Additional Platforms
- **X (Twitter)**
  - Followers, engagement, tweet impressions
  - Account age, verification
  - Topic interests
  
- **Reddit**  
  - Karma score (post/comment)
  - Account age
  - Subreddit participation
  - Awards received
  
- **Facebook**
  - Page likes/followers
  - Post reach
  - Page insights
  - Audience demographics

- **Farcaster**
  - Follower count
  - Cast engagement
  - Channel participation

### Additional Actions
- **Comment** (with sentiment requirements)
- **Share/Repost** 
- **Story mention**
- **Save/Bookmark**
- **Watch time** (for video content)

## Phase 3: Advanced Features (Q3 2025)

### Campaign Optimization
- **A/B Testing**: Test different targeting combinations
- **Budget pacing**: Automatic spend optimization
- **Performance analytics**: 
  - Real-time completion rates
  - Audience quality metrics
  - ROI tracking

### Creator Features
- **Reputation system**: Track completion quality
- **Earnings dashboard**: Detailed payment history
- **Batch actions**: Complete multiple actions efficiently
- **Referral program**: Earn from inviting quality users

### Brand Features  
- **Campaign templates**: Save successful targeting configs
- **Bulk campaign creation**: Launch multiple campaigns
- **Team accounts**: Multi-user brand accounts
- **Invoice generation**: For accounting purposes

## Phase 4: Scale & Enterprise (Q4 2025)

### Enterprise Features
- **API access**: Programmatic campaign creation
- **Custom targeting**: Company-specific requirements
- **White-label**: Branded campaign interfaces
- **Compliance tools**: GDPR/CCPA data handling

### Scale Improvements
- **Multi-chain support**: Ethereum, Polygon, Arbitrum
- **Fiat on-ramps**: Credit card payments
- **Batch payments**: Gas-optimized payouts
- **Liquidity pools**: Instant payments

### AI Integration
- **Targeting suggestions**: ML-based optimization
- **Fraud detection**: Identify fake engagement
- **Content matching**: Match ads with relevant creators
- **Budget recommendations**: Predictive pricing

## Technical Architecture Evolution

### Current (Beta)
```
Web App → API → Database
    ↓
Payment (ETH/USDC) → Escrow Contract
    ↓
Extension → Social Platforms
```

### Future (Full Platform)
```
Web App → API → Database
    ↓
ZK Proof System → Lit Protocol
    ↓
Smart Contracts (Multi-chain)
    ↓
Extension → Social APIs → Verification
    ↓
Payment Router → Multiple Tokens
```

## Success Metrics

### Beta Goals
- 100 campaigns created
- 1,000 actions completed
- $10,000 in payments processed

### Year 1 Goals  
- 10,000 active brands
- 100,000 active users
- $1M in monthly volume
- 5 platforms supported

### Long-term Vision
- Become the standard for privacy-preserving social media advertising
- Enable micro-influencers to monetize authentically
- Provide brands with genuine engagement at scale
- Maintain user privacy as a core principle

## Implementation Priority

1. **Security First**: Audit smart contracts, secure payment flow
2. **User Experience**: Simplify onboarding, improve UI/UX
3. **Targeting Power**: Add conditions gradually, test thoroughly
4. **Platform Coverage**: Expand based on user demand
5. **Scale Infrastructure**: Optimize for thousands of concurrent users

## Migration Plan from Beta

### For Existing Campaigns
- Beta campaigns continue running as-is
- No targeting requirements remain optional
- Grandfathered pricing for early adopters

### For New Features
- Gradual rollout to test users
- Feature flags for A/B testing
- Backward compatibility maintained

### Database Changes
- Add targeting_conditions table
- Add zk_proofs table  
- Extend actions with new types
- Version campaign schemas

This roadmap will evolve based on user feedback and market conditions.