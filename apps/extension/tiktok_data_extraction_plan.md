# TikTok Data Extraction Strategy for Targeted Ads

## 🎯 Priority Data Points for Ad Targeting

Based on the API analysis, here are the key data points we need to extract:

### 1. **User Profile & Demographics** (HIGH PRIORITY)
- **Endpoint**: `/tiktokstudio/api/web/user`
- **Data Available**:
  - UserId, SecUid (unique identifiers)
  - NickName, UniqId (username)
  - Region (country/location for geo-targeting)
  - Language preferences
  - Account verification status
  - Account type (Creator/Business/Personal)
  - Profile bio (for interest analysis)

### 2. **Follower Analytics** (HIGH PRIORITY)
- **Endpoint**: `/tiktokstudio/api/web/relation/multiGetFollowRelationCount`
- **Data Available**:
  - followerCount (reach metric)
  - followingCount
  - mutualFollowerCount (engagement indicator)

### 3. **Audience Demographics** (CRITICAL FOR TARGETING)
- **Endpoint**: `/tiktokstudio/api/audience`
- **Expected Data**:
  - Age distribution (13-17, 18-24, 25-34, 35-44, 45+)
  - Gender split (male/female percentages)
  - Geographic distribution (top countries/cities)
  - Active times (when audience is most engaged)
  - Viewer types (new/returning/followers)

### 4. **Content Performance** (MEDIUM PRIORITY)
- **Endpoint**: `/tiktokstudio/api/videos`
- **Endpoint**: `/tiktokstudio/api/content`
- **Data Available**:
  - Video views, likes, comments, shares
  - Engagement rates
  - Completion rates
  - Top performing content categories

### 5. **Analytics & Insights** (HIGH PRIORITY)
- **Endpoint**: `/tiktokstudio/api/analytics`
- **Endpoint**: `/tiktokstudio/api/insights`
- **Endpoint**: `/tiktokstudio/api/performance`
- **Expected Data**:
  - Profile views (7d, 30d, 90d)
  - Video views trends
  - Engagement metrics
  - Growth rates

## 📊 Data Collection Strategy

### Phase 1: Profile Page Collection
```javascript
// When on profile page (https://www.tiktok.com/@username)
1. Extract from SIGI_STATE window object:
   - UserModule.users (profile data)
   - ItemModule (video statistics)
   
2. Extract from DOM:
   - data-e2e="followers-count"
   - data-e2e="following-count"
   - data-e2e="likes-count"
   - data-e2e="user-bio"
```

### Phase 2: Studio Analytics Collection
```javascript
// Navigate to TikTok Studio (https://www.tiktok.com/tiktokstudio/analytics)
1. Intercept API calls to:
   - /tiktokstudio/api/analytics/overview
   - /tiktokstudio/api/audience/demographics
   - /tiktokstudio/api/performance/metrics
   
2. Extract from API responses:
   - Audience age/gender/location
   - Engagement metrics
   - Growth trends
```

### Phase 3: Enhanced Network Interception
```javascript
// Priority API endpoints to monitor:
const priorityEndpoints = [
  '/tiktokstudio/api/analytics',
  '/tiktokstudio/api/audience',
  '/tiktokstudio/api/insights',
  '/tiktokstudio/api/performance',
  '/api/v1/user/detail',
  '/api/v2/user/info'
];
```

## 🔧 Implementation Updates Needed

### 1. Update Content Script Network Interceptor
```javascript
// Add specific endpoint detection
if (url.includes('/tiktokstudio/api/analytics')) {
  // Extract overview metrics
  this.collectedData.analytics = {
    overview: data.overview_metrics,
    trends: data.trend_data,
    period: data.time_period
  };
}

if (url.includes('/tiktokstudio/api/audience')) {
  // Extract demographic data
  this.collectedData.audience = {
    ageDistribution: data.age_groups,
    genderSplit: data.gender_distribution,
    topLocations: data.geo_distribution,
    viewerTypes: data.viewer_categories
  };
}
```

### 2. Add Studio-Specific Data Extraction
```javascript
private extractStudioAnalytics() {
  // Look for React props in Studio
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactRootContainer) {
    // Extract React props containing analytics
  }
  
  // Check for Next.js data
  if (window.__NEXT_DATA__?.props?.pageProps?.analytics) {
    this.collectedData.studioAnalytics = window.__NEXT_DATA__.props.pageProps.analytics;
  }
}
```

### 3. Add Cookie/Token Extraction for API Access
```javascript
private extractAuthTokens() {
  // Get necessary cookies for API access
  const cookies = {
    sessionid: document.cookie.match(/sessionid=([^;]+)/)?.[1],
    tt_csrf_token: document.cookie.match(/tt_csrf_token=([^;]+)/)?.[1],
    msToken: document.cookie.match(/msToken=([^;]+)/)?.[1]
  };
  return cookies;
}
```

## 🎯 Expected Final Data Structure

```javascript
{
  profile: {
    userId: "7123456789",
    uniqueId: "username",
    nickname: "Display Name",
    verified: true,
    followerCount: 125000,
    followingCount: 500,
    likeCount: 2500000,
    videoCount: 150,
    region: "US",
    language: "en"
  },
  demographics: {
    age: {
      "13-17": 15,
      "18-24": 45,
      "25-34": 25,
      "35-44": 10,
      "45+": 5
    },
    gender: {
      male: 40,
      female: 60
    },
    location: {
      countries: [
        { code: "US", percentage: 35 },
        { code: "UK", percentage: 15 },
        { code: "CA", percentage: 10 }
      ],
      cities: [
        { name: "Los Angeles", percentage: 8 },
        { name: "New York", percentage: 6 }
      ]
    }
  },
  analytics: {
    videoViews30d: 1500000,
    profileViews30d: 50000,
    shares30d: 10000,
    comments30d: 25000,
    engagementRate: 5.2,
    avgWatchTime: 45,
    completionRate: 62
  },
  audience: {
    viewerTypes: {
      newViewers: 60,
      returningViewers: 30,
      followers: 10
    },
    activeTimes: {
      peak: "18:00-21:00",
      timezone: "EST"
    }
  },
  topContent: [
    {
      videoId: "7234567890",
      views: 500000,
      likes: 50000,
      engagement: 12.5,
      category: "comedy"
    }
  ]
}
```

## 🚀 Next Steps

1. **Test Current Implementation** - See what data we're actually getting
2. **Add Missing Extractors** - Implement Studio-specific data extraction
3. **Enhance API Interception** - Add specific handlers for each endpoint
4. **Add Fallback Methods** - DOM scraping if APIs aren't available
5. **Implement Data Validation** - Ensure all required fields are collected

## 🔍 Debugging Checklist

- [ ] Check if SIGI_STATE is available on profile page
- [ ] Monitor all /tiktokstudio/api/* calls in Network tab
- [ ] Verify cookies are present (sessionid, msToken)
- [ ] Check if __NEXT_DATA__ contains analytics data
- [ ] Look for React props in Studio pages
- [ ] Test with both personal and business accounts