// Market-based pricing data (2025 benchmarks in cents)

interface PricingData {
  min: number;
  avg: number;
  max: number;
  marketAvg: number;
}

interface PlatformPricing {
  [actionType: string]: PricingData;
}

interface MarketPricing {
  [platform: string]: PlatformPricing;
}

interface LocationMultipliers {
  [location: string]: number;
}
export const MARKET_PRICING: MarketPricing = {
  tiktok: {
    like: { min: 2, avg: 5, max: 10, marketAvg: 5 },
    comment: { min: 15, avg: 30, max: 50, marketAvg: 30 },
    share: { min: 10, avg: 20, max: 40, marketAvg: 20 },
    follow: { min: 30, avg: 60, max: 100, marketAvg: 60 },
  },
  instagram: {
    like: { min: 1, avg: 3, max: 5, marketAvg: 3 },
    comment: { min: 10, avg: 25, max: 40, marketAvg: 25 },
    reel_share: { min: 15, avg: 25, max: 35, marketAvg: 25 },
    post_share: { min: 10, avg: 18, max: 30, marketAvg: 18 },
    story_share: { min: 5, avg: 12, max: 20, marketAvg: 12 },
    follow: { min: 30, avg: 55, max: 80, marketAvg: 55 },
  },
  x: {
    like: { min: 2, avg: 4, max: 6, marketAvg: 4 },
    comment: { min: 10, avg: 20, max: 30, marketAvg: 20 },
    retweet: { min: 8, avg: 15, max: 25, marketAvg: 15 },
    follow: { min: 101, avg: 150, max: 200, marketAvg: 150 },
  },
  facebook: {
    like: { min: 1, avg: 1.5, max: 2, marketAvg: 1.5 },
    comment: { min: 1, avg: 1.5, max: 2, marketAvg: 1.5 },
    story_share: { min: 1, avg: 1.5, max: 2, marketAvg: 1.5 },
    follow: { min: 30, avg: 60, max: 90, marketAvg: 60 },
  },
  reddit: {
    upvote: { min: 2, avg: 4, max: 6, marketAvg: 4 },
    comment: { min: 20, avg: 35, max: 50, marketAvg: 35 },
    award: { min: 50, avg: 100, max: 200, marketAvg: 100 },
  },
  farcaster: {
    like: { min: 10, avg: 15, max: 20, marketAvg: 15 },
    comment: { min: 40, avg: 60, max: 80, marketAvg: 60 },
    follow: { min: 60, avg: 90, max: 120, marketAvg: 90 },
  },
};

// Multipliers for targeting conditions
export const TARGETING_MULTIPLIERS = {
  // Location multipliers
  location: {
    'USA': 1.5,
    'UK': 1.4,
    'EU': 1.3,
    'Canada': 1.3,
    'Australia': 1.3,
    'Japan': 1.2,
    'default': 1.0,
  },
  
  // Follower count multipliers (higher followers = more valuable)
  followers: {
    micro: { min: 1000, max: 10000, multiplier: 1.0 },
    mid: { min: 10000, max: 100000, multiplier: 1.5 },
    macro: { min: 100000, max: 1000000, multiplier: 2.0 },
    mega: { min: 1000000, max: Infinity, multiplier: 3.0 },
  },
  
  // Engagement rate multipliers
  engagementRate: {
    low: { min: 0, max: 2, multiplier: 0.8 },
    average: { min: 2, max: 5, multiplier: 1.0 },
    good: { min: 5, max: 10, multiplier: 1.3 },
    excellent: { min: 10, max: 100, multiplier: 1.8 },
  },
  
  // Verification status
  verified: 1.5,
  
  // Gender audience concentration (how targeted)
  genderConcentration: {
    balanced: { min: 40, max: 60, multiplier: 1.0 }, // 40-60% single gender
    targeted: { min: 60, max: 80, multiplier: 1.2 }, // 60-80% single gender
    highly_targeted: { min: 80, max: 100, multiplier: 1.5 }, // 80%+ single gender
  },
};

// Calculate multiplier based on targeting complexity
export function calculateTargetingMultiplier(conditions: any[]): number {
  let multiplier = 1.0;
  
  // More conditions = more specific = higher price
  const conditionCount = conditions.length;
  if (conditionCount > 0) {
    multiplier += conditionCount * 0.1; // +10% per condition
  }
  
  // Check for high-value conditions
  conditions.forEach(condition => {
    // Verified accounts
    if (condition.schemaId?.includes('verified')) {
      multiplier *= TARGETING_MULTIPLIERS.verified;
    }
    
    // High follower counts
    if (condition.schemaId?.includes('follower') && condition.operator === '>=') {
      const followers = parseInt(condition.value);
      if (followers >= 1000000) multiplier *= 2.0;
      else if (followers >= 100000) multiplier *= 1.5;
      else if (followers >= 10000) multiplier *= 1.2;
    }
    
    // High engagement rates
    if (condition.schemaId?.includes('engagement') && condition.operator === '>=') {
      const rate = parseFloat(condition.value);
      if (rate >= 10) multiplier *= 1.5;
      else if (rate >= 5) multiplier *= 1.3;
    }
    
    // Premium locations
    if (condition.schemaId?.includes('location')) {
      const location = condition.value;
      multiplier *= (TARGETING_MULTIPLIERS.location as LocationMultipliers)[location] || 1.0;
    }
  });
  
  return Math.min(multiplier, 5.0); // Cap at 5x
}

// Calculate volume discount
export function calculateVolumeDiscount(volume: number): number {
  if (volume >= 10000) return 0.7; // 30% discount
  if (volume >= 5000) return 0.8; // 20% discount
  if (volume >= 1000) return 0.9; // 10% discount
  if (volume >= 500) return 0.95; // 5% discount
  return 1.0; // No discount
}

// Main pricing calculator
export interface PricingResult {
  basePrice: number;
  targetingMultiplier: number;
  volumeDiscount: number;
  platformFee: number;
  totalCost: number;
  costPerAction: number;
  breakdown: {
    action: string;
    volume: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export function calculateCampaignPrice(
  _platform: string,
  actions: Record<string, { enabled: boolean; price: number; maxVolume: number }>,
  _conditions: any[],
  _platformFeeRate: number = 0.2 // 20% platform fee
): PricingResult {
  const breakdown = [];
  let totalBaseCost = 0;
  
  // Calculate base cost for each action
  for (const [key, config] of Object.entries(actions)) {
    if (!config.enabled) continue;
    
    const [platformKey, actionType] = key.split('_');
    const marketData = (MARKET_PRICING as MarketPricing)[platformKey]?.[actionType];
    
    if (!marketData) continue;
    
    // Use brand's set price but ensure it's above market minimum
    const unitPrice = Math.max(config.price, marketData.min);
    const volume = config.maxVolume;
    const subtotal = unitPrice * volume;
    
    breakdown.push({
      action: actionType,
      volume,
      unitPrice,
      subtotal,
    });
    
    totalBaseCost += subtotal;
  }
  
  // Calculate total volume for volume discount
  const totalVolume = breakdown.reduce((sum, item) => sum + item.volume, 0);
  const volumeDiscount = calculateVolumeDiscount(totalVolume);
  
  // Calculate final price - just base cost with volume discount, no hidden fees or multipliers
  const adjustedCost = totalBaseCost * volumeDiscount;
  const targetingMultiplier = 1.0; // Remove hidden multipliers
  const platformFee = 0; // Platform fee is already included in the base prices
  const totalCost = adjustedCost;
  
  return {
    basePrice: totalBaseCost / 100, // Convert to dollars
    targetingMultiplier,
    volumeDiscount,
    platformFee: platformFee / 100,
    totalCost: totalCost / 100,
    costPerAction: totalVolume > 0 ? totalCost / totalVolume / 100 : 0,
    breakdown: breakdown.map(item => ({
      ...item,
      unitPrice: item.unitPrice / 100,
      subtotal: item.subtotal / 100,
    })),
  };
}

// Suggest optimal pricing based on market data
export function suggestOptimalPrice(
  platform: string,
  actionType: string,
  conditions: any[]
): number {
  const marketData = (MARKET_PRICING as MarketPricing)[platform]?.[actionType];
  if (!marketData) return 10; // Default fallback
  
  // Start with market average
  let suggestedPrice = marketData.marketAvg;
  
  // Adjust based on targeting
  const targetingMultiplier = calculateTargetingMultiplier(conditions);
  suggestedPrice *= Math.min(targetingMultiplier, 2.0); // Cap multiplier for suggestions
  
  // Round to nearest cent
  return Math.round(suggestedPrice);
}