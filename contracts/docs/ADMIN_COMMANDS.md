# Campaign Payments Contract - Admin Commands

This guide provides all the cast commands needed to manage and configure the CampaignPayments contract.

## Contract Information

- **Base Sepolia Contract**: `0xB32856642B5Ec5742ed979D31B82AB5CE30383FB`
- **Owner**: The address that deployed the contract
- **Network**: Base Sepolia (Chain ID: 84532)

## Prerequisites

1. Install Foundry (includes cast): https://book.getfoundry.sh/getting-started/installation
2. Set up environment variables:
```bash
export CONTRACT_ADDRESS="0xB32856642B5Ec5742ed979D31B82AB5CE30383FB"
export RPC_URL="https://sepolia.base.org"
export PRIVATE_KEY="your-owner-private-key-here"
```

## View Current Configuration

### Check Current Values
```bash
# View campaign package
cast call $CONTRACT_ADDRESS "campaignLikes()" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "campaignFollows()" --rpc-url $RPC_URL

# View base prices (in USDC with 6 decimals)
cast call $CONTRACT_ADDRESS "baseLikePrice()" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "baseFollowPrice()" --rpc-url $RPC_URL

# View targeting multipliers (1000 = 1.0x)
cast call $CONTRACT_ADDRESS "genderMultiplier()" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "ageMultiplier()" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "verifiedMultiplier()" --rpc-url $RPC_URL

# View country multipliers
cast call $CONTRACT_ADDRESS "countryMultipliers(string)" "US" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "countryMultipliers(string)" "UK" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "countryMultipliers(string)" "IN" --rpc-url $RPC_URL
```

### Calculate Price for Specific Configuration
```bash
# Calculate price for US, with all targeting enabled
cast call $CONTRACT_ADDRESS "calculatePrice(string,bool,bool,bool)" "US" true true true --rpc-url $RPC_URL

# Calculate base price (no targeting)
cast call $CONTRACT_ADDRESS "calculatePrice(string,bool,bool,bool)" "all" false false false --rpc-url $RPC_URL
```

## Configuration Commands

### 1. Update Campaign Package

Change the number of likes and follows in the package:
```bash
# Set to 30 likes and 15 follows
cast send $CONTRACT_ADDRESS "updatePackage(uint256,uint256)" 30 15 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: Smaller package (10 likes, 5 follows)
cast send $CONTRACT_ADDRESS "updatePackage(uint256,uint256)" 10 5 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: Larger package (50 likes, 25 follows)
cast send $CONTRACT_ADDRESS "updatePackage(uint256,uint256)" 50 25 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2. Update Base Prices

Change the base price per action (in USDC with 6 decimals):
```bash
# Set like price to $0.25 (250000) and follow price to $0.50 (500000)
cast send $CONTRACT_ADDRESS "updateBasePrices(uint256,uint256)" 250000 500000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: Lower prices - $0.15 like, $0.30 follow
cast send $CONTRACT_ADDRESS "updateBasePrices(uint256,uint256)" 150000 300000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: Premium prices - $0.50 like, $1.00 follow
cast send $CONTRACT_ADDRESS "updateBasePrices(uint256,uint256)" 500000 1000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 3. Update Targeting Multipliers

Adjust multipliers for targeting options (1000 = 1.0x):
```bash
# Set gender 1.3x (1300), age 1.5x (1500), verified 2.0x (2000)
cast send $CONTRACT_ADDRESS "updateTargetingMultipliers(uint256,uint256,uint256)" 1300 1500 2000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: Lower multipliers - gender 1.1x, age 1.2x, verified 1.3x
cast send $CONTRACT_ADDRESS "updateTargetingMultipliers(uint256,uint256,uint256)" 1100 1200 1300 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Example: No premium for targeting (all 1.0x)
cast send $CONTRACT_ADDRESS "updateTargetingMultipliers(uint256,uint256,uint256)" 1000 1000 1000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 4. Update Single Country Multiplier

Update multiplier for a specific country:
```bash
# Set US multiplier to 2.0x (2000)
cast send $CONTRACT_ADDRESS "updateCountryMultiplier(string,uint256)" "US" 2000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set India multiplier to 0.8x (800)
cast send $CONTRACT_ADDRESS "updateCountryMultiplier(string,uint256)" "IN" 800 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Add new country - South Korea at 1.3x
cast send $CONTRACT_ADDRESS "updateCountryMultiplier(string,uint256)" "KR" 1300 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 5. Batch Update Country Multipliers

Update multiple countries at once:
```bash
# Update US, UK, and Canada
cast send $CONTRACT_ADDRESS "updateCountryMultipliersBatch(string[],uint256[])" \
  '["US","UK","CA"]' '[1600,1500,1500]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Add/Update Asian markets
cast send $CONTRACT_ADDRESS "updateCountryMultipliersBatch(string[],uint256[])" \
  '["JP","KR","SG","HK"]' '[1300,1250,1400,1450]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Update emerging markets
cast send $CONTRACT_ADDRESS "updateCountryMultipliersBatch(string[],uint256[])" \
  '["BR","MX","IN","ID","PH","TH","VN"]' '[1000,950,850,700,750,800,750]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Common Scenarios

### Scenario 1: Holiday Promotion (25% off everything)
```bash
# Reduce base prices by 25%
cast send $CONTRACT_ADDRESS "updateBasePrices(uint256,uint256)" 150000 300000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Scenario 2: Premium Market Focus
```bash
# Increase multipliers for premium markets
cast send $CONTRACT_ADDRESS "updateCountryMultipliersBatch(string[],uint256[])" \
  '["US","UK","CA","AU","DE","FR"]' '[2000,1800,1800,1700,1700,1600]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Scenario 3: Verified-Only Campaign Push
```bash
# Reduce verified multiplier to encourage verified-only campaigns
cast send $CONTRACT_ADDRESS "updateTargetingMultipliers(uint256,uint256,uint256)" 1200 1400 1200 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Scenario 4: Bulk Campaign Special
```bash
# Larger package at better unit price
cast send $CONTRACT_ADDRESS "updatePackage(uint256,uint256)" 100 50 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Withdrawal Commands

### Withdraw Specific Amount
```bash
# Withdraw 100 USDC to treasury
cast send $CONTRACT_ADDRESS "withdrawUSDC(address,uint256)" \
  "0xYourTreasuryAddress" 100000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Withdraw All Funds
```bash
# Withdraw all USDC to treasury
cast send $CONTRACT_ADDRESS "withdrawAllUSDC(address)" \
  $CONTRACT_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Check Contract Balance
```bash
cast call $CONTRACT_ADDRESS "getUSDCBalance()" --rpc-url $RPC_URL
```

## Price Reference Table

### USDC Amount Conversion
- $0.10 = 100000 (6 decimals)
- $0.20 = 200000
- $0.25 = 250000
- $0.50 = 500000
- $1.00 = 1000000
- $2.00 = 2000000

### Multiplier Reference
- 0.5x = 500
- 0.7x = 700
- 0.9x = 900
- 1.0x = 1000 (no change)
- 1.2x = 1200
- 1.5x = 1500
- 2.0x = 2000
- 3.0x = 3000

### Current Default Values
- **Package**: 20 likes, 10 follows
- **Base Prices**: $0.20 per like, $0.40 per follow
- **Targeting Multipliers**:
  - Gender: 1.2x (1200)
  - Age: 1.4x (1400)
  - Verified: 1.5x (1500)
- **Country Multipliers**:
  - US: 1.5x (1500)
  - UK: 1.4x (1400)
  - CA: 1.4x (1400)
  - AU: 1.3x (1300)
  - DE: 1.3x (1300)
  - FR: 1.2x (1200)
  - JP: 1.2x (1200)
  - BR: 1.1x (1100)
  - MX: 1.0x (1000)
  - IN: 0.9x (900)
  - PH: 0.8x (800)
  - ID: 0.7x (700)

## Validation Limits

- **Package**: Both likes and follows must be > 0
- **Base Prices**: Both prices must be > 0
- **Targeting Multipliers**: Must be between 500 (0.5x) and 5000 (5x)
- **Country Multipliers**: Must be between 100 (0.1x) and 10000 (10x)

## Monitoring Events

Watch for configuration changes:
```bash
# Listen for all events from the contract
cast logs --address $CONTRACT_ADDRESS \
  --rpc-url $RPC_URL \
  --from-block latest
```

## Testing Price Changes

Before making changes, test the impact:
```bash
# Test price with current configuration
cast call $CONTRACT_ADDRESS "calculatePrice(string,bool,bool,bool)" "US" true true true --rpc-url $RPC_URL

# Convert result from hex to decimal (result is in USDC with 6 decimals)
# Example: 0x000000000000000000000000000000000000000000000000000000000c9ff3c0 = 212070336
# Which equals $212.07
```

## Emergency Contacts

- **Technical Issues**: Check contract on BaseScan
- **Contract Address**: `0xB32856642B5Ec5742ed979D31B82AB5CE30383FB`
- **Network Status**: https://status.base.org/

---

**Note**: Always test commands on testnet first. Keep your private key secure and never share it.