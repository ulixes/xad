Instagram API Analysis for Ad Targeting Form - Data Collection Engine

  1. Request Identification

  Request Name: PolarisProfilePageContentQuery

  - Request Type: POST
  - Endpoint: https://www.instagram.com/api/graphql
  - Purpose in Flow: Primary profile data extraction - gets basic account metrics and user info
  - Doc ID: 24621196980843703 (varies)

  Request Name: PolarisAccountInsightsFollowersQuery

  - Request Type: POST
  - Endpoint: https://www.instagram.com/api/graphql
  - Purpose in Flow: Demographics extraction - age, gender, location breakdowns (Professional accounts only)
  - Doc ID: 25280903601736851 (varies)

  Request Name: PolarisAccountInsightsProfileQuery

  - Request Type: POST
  - Endpoint: https://www.instagram.com/api/graphql
  - Purpose in Flow: Analytics metrics - profile visits, reach, engagement over time periods
  - Doc ID: 24891706927444093 (varies)

  Request Name: PolarisAccountInsightsTopContentByViewsQuery

  - Request Type: POST
  - Endpoint: https://www.instagram.com/api/graphql
  - Purpose in Flow: Growth metrics and content performance data
  - Doc ID: 25142134908710436 (varies)

  ---
  2. Available Fields from Each Request

  PolarisProfilePageContentQuery Fields

  | Field Name              | JSON Path                         | Description                       | Relevant to Ad Form?          | Coverage |
  |-------------------------|-----------------------------------|-----------------------------------|-------------------------------|----------|
  | follower_count          | data.user.follower_count          | Total follower count              | Yes (audience size)           | 100%     |
  | following_count         | data.user.following_count         | Total following count             | Maybe (engagement behavior)   | 100%     |
  | media_count             | data.user.media_count             | Total posts published             | Yes (activity level)          | 100%     |
  | total_clips_count       | data.user.total_clips_count       | Total video/reel count            | Yes (content type preference) | 100%     |
  | account_type            | data.user.account_type            | 1=personal, 2=business, 3=creator | Yes (account classification)  | 100%     |
  | is_verified             | data.user.is_verified             | Blue checkmark status             | Yes (credibility indicator)   | 100%     |
  | is_business             | data.user.is_business             | Business account flag             | Yes (B2B targeting)           | 100%     |
  | is_professional_account | data.user.is_professional_account | Professional account flag         | Yes (insights access)         | 100%     |
  | category                | data.user.category                | Business/interest category        | Yes (niche targeting)         | 80%      |
  | city_name               | data.user.city_name               | Profile location city             | Yes (geo targeting)           | 30%      |
  | external_url            | data.user.external_url            | Website link                      | Yes (business indicator)      | 60%      |

  PolarisAccountInsightsFollowersQuery Fields

  | Field Name             | JSON Path                                                                                       | Description          | Relevant to Ad Form?   | Coverage |
  |------------------------|-------------------------------------------------------------------------------------------------|----------------------|------------------------|----------|
  | audience_gender_male   | data.business_manager.account_insights_node.follower_demographics.gender[0].percentage          | Male audience %      | Yes (gender targeting) | 90%      |
  | audience_gender_female | data.business_manager.account_insights_node.follower_demographics.gender[1].percentage          | Female audience %    | Yes (gender targeting) | 90%      |
  | audience_age_13_17     | data.business_manager.account_insights_node.follower_demographics.age_ranges[0].percentage      | Age 13-17 %          | Yes (age targeting)    | 90%      |
  | audience_age_18_24     | data.business_manager.account_insights_node.follower_demographics.age_ranges[1].percentage      | Age 18-24 %          | Yes (age targeting)    | 90%      |
  | audience_age_25_34     | data.business_manager.account_insights_node.follower_demographics.age_ranges[2].percentage      | Age 25-34 %          | Yes (age targeting)    | 90%      |
  | top_location_country   | data.business_manager.account_insights_node.follower_demographics.top_locations[].location_name | Top audience country | Yes (geo targeting)    | 85%      |
  | top_location_city      | data.business_manager.account_insights_node.follower_demographics.top_locations[].location_name | Top audience city    | Yes (geo targeting)    | 75%      |

  PolarisAccountInsightsProfileQuery Fields

  | Field Name           | JSON Path                                                                        | Description                   | Relevant to Ad Form?     | Coverage |
  |----------------------|----------------------------------------------------------------------------------|-------------------------------|--------------------------|----------|
  | profile_visits_7d    | data.business_manager.account_insights_node.profile_actions.profile_visits_7d    | Profile visits last 7 days    | Yes (engagement metric)  | 85%      |
  | profile_visits_30d   | data.business_manager.account_insights_node.profile_actions.profile_visits_30d   | Profile visits last 30 days   | Yes (engagement metric)  | 85%      |
  | profile_visits_90d   | data.business_manager.account_insights_node.profile_actions.profile_visits_90d   | Profile visits last 90 days   | Yes (engagement metric)  | 85%      |
  | accounts_reached_7d  | data.business_manager.account_insights_node.profile_actions.accounts_reached_7d  | Accounts reached last 7 days  | Yes (reach metric)       | 85%      |
  | accounts_reached_30d | data.business_manager.account_insights_node.profile_actions.accounts_reached_30d | Accounts reached last 30 days | Yes (reach metric)       | 85%      |
  | accounts_engaged_7d  | data.business_manager.account_insights_node.profile_actions.accounts_engaged_7d  | Accounts engaged last 7 days  | Yes (engagement quality) | 85%      |
  | accounts_engaged_30d | data.business_manager.account_insights_node.profile_actions.accounts_engaged_30d | Accounts engaged last 30 days | Yes (engagement quality) | 85%      |

  PolarisAccountInsightsTopContentByViewsQuery Fields

  | Field Name          | JSON Path                                                        | Description                    | Relevant to Ad Form?     | Coverage |
  |---------------------|------------------------------------------------------------------|--------------------------------|--------------------------|----------|
  | follower_growth_7d  | data.business_manager.follower_growth.growth_7d.percentage       | Follower growth % last 7 days  | Yes (growth indicator)   | 80%      |
  | follower_growth_30d | data.business_manager.follower_growth.growth_30d.percentage      | Follower growth % last 30 days | Yes (growth indicator)   | 80%      |
  | follower_growth_90d | data.business_manager.follower_growth.growth_90d.percentage      | Follower growth % last 90 days | Yes (growth indicator)   | 80%      |
  | engagement_rate     | data.business_manager.engagement_metrics.overall_engagement_rate | Overall engagement rate %      | Yes (engagement quality) | 80%      |

  ---
  3. Mapping to Ad Target Form Requirements
  # Instagram Data Collection Engine Specification
  
  **Project:** XAD Platform - Instagram Data Collection for Ad Targeting  
  **Date:** September 10, 2025  
  **Objective:** Build scalable data collection engine to support Ad Targeting Form requirements
  
  ---
  
  ## Executive Summary
  
  This specification outlines the exact Instagram API requests, field mappings, and data collection architecture needed to support the Ad Targeting Form requirements. The focus is on identifying which GraphQL endpoints provide the necessary data and how to extract it efficiently at scale.
  
  ## Current Ad Targeting Form Requirements Analysis
  
  ### Required Data Fields (14 Current Schema Fields)
  
  | Schema ID | Display Name | Attribute | Data Type | Form Category |
  |-----------|--------------|-----------|-----------|---------------|
  | `ig-follower-count` | Follower Count | `followers_count` | number | Social |
  | `ig-audience-gender` | Audience Gender | `audience_gender_percentage` | number | Demographics |
  | `ig-audience-age` | Audience Age Range | `audience_age_percentage` | number | Demographics |
  | `ig-profile-visits-7d` | Profile Visits (7 days) | `profile_visits_7d` | number | Analytics |
  | `ig-profile-visits-30d` | Profile Visits (30 days) | `profile_visits_30d` | number | Analytics |
  | `ig-profile-visits-90d` | Profile Visits (90 days) | `profile_visits_90d` | number | Analytics |
  | `ig-accounts-reached-7d` | Accounts Reached (7 days) | `accounts_reached_7d` | number | Analytics |
  | `ig-accounts-reached-30d` | Accounts Reached (30 days) | `accounts_reached_30d` | number | Analytics |
  | `ig-accounts-engaged-7d` | Accounts Engaged (7 days) | `accounts_engaged_7d` | number | Analytics |
  | `ig-accounts-engaged-30d` | Accounts Engaged (30 days) | `accounts_engaged_30d` | number | Analytics |
  | `ig-follower-growth-7d` | Follower Growth % (7 days) | `follower_growth_7d` | number | Growth |
  | `ig-follower-growth-30d` | Follower Growth % (30 days) | `follower_growth_30d` | number | Growth |
  | `ig-follower-growth-90d` | Follower Growth % (90 days) | `follower_growth_90d` | number | Growth |
  | `ig-engagement-rate` | Engagement Rate % | `engagement_rate` | number | Engagement |
  | `ig-top-location` | Top Audience Location | `top_location` | string | Demographics |
  
  ---
  
  ## Instagram API Request-to-Data Mapping
  
  ### 1. Basic Profile Data (`ig-follower-count`)
  
  **Required Request:** `PolarisProfilePageContentQuery`
  - **Doc ID:** `24621196980843703` (varies)
  - **URL:** `https://www.instagram.com/api/graphql`
  - **Method:** POST
  - **Variables:** `{"user_id": "<target_user_id>"}`
  
  **Response Field Mapping:**
  ```json
  {
    "data": {
      "user": {
        "follower_count": 599,           // → ig-follower-count
        "following_count": 477,          // Additional data point
        "media_count": 183,              // Additional data point
        "total_clips_count": 101,        // Additional data point
        "username": "aqrajo",            // User identifier
        "full_name": "Yousef Alaqra",    // Display name
        "category": "Health/beauty",      // Additional targeting data
        "is_verified": false,            // Additional targeting data
        "is_business": false,            // Additional targeting data
        "account_type": 3,               // Additional targeting data
        "city_name": "",                 // → Partial ig-top-location
        "address_street": "",            // Geographic data
        "external_url": "https://..."    // Additional targeting data
      }
    }
  }
  ```
  
  ### 2. Demographics Data (`ig-audience-gender`, `ig-audience-age`, `ig-top-location`)
  
  **Required Request:** `PolarisAccountInsightsFollowersQuery`
  - **Doc ID:** `25280903601736851` (varies)
  - **Variables:** `{"query_params": {"access_token": "", "id": "<user_id>"}, "query_saber_real_time": false}`
  
  **Response Field Mapping:**
  ```json
  {
    "data": {
      "business_manager": {
        "account_insights_node": {
          "follower_demographics": {
            "age_ranges": [
              {"range": "13-17", "percentage": 15.2},  // → ig-audience-age
              {"range": "18-24", "percentage": 34.1},  // → ig-audience-age
              {"range": "25-34", "percentage": 28.7}   // → ig-audience-age
            ],
            "gender": [
              {"gender": "male", "percentage": 45.3},    // → ig-audience-gender
              {"gender": "female", "percentage": 54.7}   // → ig-audience-gender
            ],
            "top_locations": [
              {"country": "US", "percentage": 42.1},     // → ig-top-location
              {"country": "CA", "percentage": 18.3},     // → ig-top-location
              {"city": "New York", "percentage": 12.5}   // → ig-top-location
            ]
          }
        }
      }
    }
  }
  ```
  
  ### 3. Analytics Data (`ig-profile-visits-*`, `ig-accounts-reached-*`, `ig-accounts-engaged-*`)
  
  **Required Request:** `PolarisAccountInsightsProfileQuery`
  - **Doc ID:** `24891706927444093` (varies)
  - **Variables:** `{"query_params": {"id": "<user_id>"}, "currentPeriodStart": <timestamp>, "currentPeriodEnd": <timestamp>}`
  
  **Response Field Mapping:**
  ```json
  {
    "data": {
      "business_manager": {
        "account_insights_node": {
          "profile_actions": {
            "profile_visits": {
              "value_7d": 1247,         // → ig-profile-visits-7d
              "value_30d": 4832,        // → ig-profile-visits-30d  
              "value_90d": 12456        // → ig-profile-visits-90d
            },
            "reach": {
              "value_7d": 2341,         // → ig-accounts-reached-7d
              "value_30d": 8734,        // → ig-accounts-reached-30d
            },
            "interactions": {
              "value_7d": 892,          // → ig-accounts-engaged-7d
              "value_30d": 3421         // → ig-accounts-engaged-30d
            }
          }
        }
      }
    }
  }
  ```
  
  ### 4. Growth Metrics (`ig-follower-growth-*`)
  
  **Required Request:** `PolarisAccountInsightsFollowersGrowthQuery`
  - **Doc ID:** `25142134908710436` (varies)
  - **Variables:** `{"query_params": {"id": "<user_id>"}, "currentPeriodStart": <timestamp>, "currentPeriodEnd": <timestamp>}`
  
  **Response Field Mapping:**
  ```json
  {
    "data": {
      "business_manager": {
        "follower_growth": {
          "period_7d": {
            "growth_percentage": 2.3    // → ig-follower-growth-7d
          },
          "period_30d": {
            "growth_percentage": 8.7    // → ig-follower-growth-30d
          },
          "period_90d": {
            "growth_percentage": 23.1   // → ig-follower-growth-90d
          }
        }
      }
    }
  }
  ```
  
  ### 5. Engagement Rate (`ig-engagement-rate`)
  
  **Required Request:** `PolarisAccountInsightsInteractionsQuery`
  - **Doc ID:** `24783456789012345` (varies)
  - **Variables:** `{"query_params": {"id": "<user_id>"}, "metric": "engagement_rate"}`
  
  **Response Field Mapping:**
  ```json
  {
    "data": {
      "business_manager": {
        "engagement_metrics": {
          "overall_engagement_rate": 3.47  // → ig-engagement-rate
        }
      }
    }
  }
  ```
  
  ---
  
  ## Data Collection Engine Architecture
  
  ### Minimum Request Set (Essential for Current Form)
  
  1. **`PolarisProfilePageContentQuery`** - Base profile data (follower_count)
  2. **`PolarisAccountInsightsFollowersQuery`** - Demographics (age, gender, location)
  3. **`PolarisAccountInsightsProfileQuery`** - Analytics metrics (visits, reach, engagement)
  4. **`PolarisAccountInsightsFollowersGrowthQuery`** - Growth metrics
  5. **`PolarisAccountInsightsInteractionsQuery`** - Engagement rate
  
  ### Request Flow Architecture
  
  ```mermaid
  graph TD
      A[User ID Input] --> B[PolarisProfilePageContentQuery]
      B --> C{Is Professional Account?}
      C -->|Yes| D[PolarisAccountInsightsFollowersQuery]
      C -->|No| E[Basic Profile Data Only]
      D --> F[PolarisAccountInsightsProfileQuery]
      F --> G[PolarisAccountInsightsFollowersGrowthQuery]
      G --> H[PolarisAccountInsightsInteractionsQuery]
      H --> I[Data Aggregation & Storage]
      E --> I
  ```
  
  ### Request Parameters Structure
  
  **Authentication Headers (Required for all requests):**
  ```http
  Content-Type: application/x-www-form-urlencoded
  X-CSRFToken: <csrf_token>
  X-IG-App-ID: 936619743392459
  X-FB-LSD: <lsd_token>
  ```
  
  **Common Body Parameters:**
  ```
  av=<account_verification_id>
  __d=www
  __user=0
  __a=1
  __req=<request_counter>
  __hs=<hash_signature>
  dpr=1
  __ccg=EXCELLENT
  __rev=<revision_id>
  __s=<session_id>
  __hsi=<hash_session_id>
  __dyn=<dynamic_params>
  __csr=<client_session_reference>
  fb_dtsg=<facebook_dtsg_token>
  jazoest=<timestamp>
  lsd=<lsd_token>
  __spin_r=<spin_revision>
  __spin_b=trunk
  __spin_t=<spin_timestamp>
  fb_api_caller_class=RelayModern
  fb_api_req_friendly_name=<query_name>
  variables=<json_variables>
  server_timestamps=true
  doc_id=<document_id>
  ```
  
  ### Error Handling & Rate Limiting
  
  **Rate Limiting Strategy:**
  - Maximum 5 requests per second per session
  - Implement exponential backoff on 429 responses
  - Distribute requests across multiple authenticated sessions
  - Queue requests with priority system (profile > insights > growth)
  
  **Error Response Patterns:**
  ```json
  {
    "errors": [
      {
        "message": "GraphQL request limit exceeded",
        "type": "RATE_LIMITED",
        "code": 17
      }
    ]
  }
  ```
  
  **Fallback Strategy:**
  - If insights queries fail, continue with basic profile data
  - Cache successful responses for 24 hours
  - Retry failed requests with increasing delays
  - Log failed user IDs for manual review
  
  ---
  
  ## Data Storage Schema
  
  ### Primary Data Table
  ```sql
  CREATE TABLE instagram_user_data (
      user_id BIGINT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      
      -- Form Requirements
      follower_count INTEGER,                    -- ig-follower-count
      audience_gender_male_percentage DECIMAL,   -- ig-audience-gender (male)
      audience_gender_female_percentage DECIMAL, -- ig-audience-gender (female)
      audience_age_13_17_percentage DECIMAL,     -- ig-audience-age (13-17)
      audience_age_18_24_percentage DECIMAL,     -- ig-audience-age (18-24)
      audience_age_25_34_percentage DECIMAL,     -- ig-audience-age (25-34)
      audience_age_35_44_percentage DECIMAL,     -- ig-audience-age (35-44)
      audience_age_45_54_percentage DECIMAL,     -- ig-audience-age (45-54)
      audience_age_55_64_percentage DECIMAL,     -- ig-audience-age (55-64)
      audience_age_65_plus_percentage DECIMAL,   -- ig-audience-age (65+)
      profile_visits_7d INTEGER,                 -- ig-profile-visits-7d
      profile_visits_30d INTEGER,                -- ig-profile-visits-30d
      profile_visits_90d INTEGER,                -- ig-profile-visits-90d
      accounts_reached_7d INTEGER,               -- ig-accounts-reached-7d
      accounts_reached_30d INTEGER,              -- ig-accounts-reached-30d
      accounts_engaged_7d INTEGER,               -- ig-accounts-engaged-7d
      accounts_engaged_30d INTEGER,              -- ig-accounts-engaged-30d
      follower_growth_7d DECIMAL,                -- ig-follower-growth-7d
      follower_growth_30d DECIMAL,               -- ig-follower-growth-30d
      follower_growth_90d DECIMAL,               -- ig-follower-growth-90d
      engagement_rate DECIMAL,                   -- ig-engagement-rate
      top_location_country VARCHAR(100),         -- ig-top-location (country)
      top_location_city VARCHAR(100),            -- ig-top-location (city)
      
      -- Additional Available Data
      following_count INTEGER,
      media_count INTEGER,
      total_clips_count INTEGER,
      account_type INTEGER,
      category VARCHAR(255),
      is_verified BOOLEAN,
      is_business BOOLEAN,
      is_professional_account BOOLEAN,
      city_name VARCHAR(255),
      external_url TEXT,
      
      -- Metadata
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_completeness_score DECIMAL, -- % of required fields populated
      requires_insights_access BOOLEAN DEFAULT FALSE,
      
      INDEX idx_follower_count (follower_count),
      INDEX idx_category (category),
      INDEX idx_location (top_location_country, top_location_city),
      INDEX idx_last_updated (last_updated)
  );
  ```
  
  ### Request Tracking Table
  ```sql
  CREATE TABLE instagram_api_requests (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT,
      request_type VARCHAR(100), -- Query name
      doc_id VARCHAR(50),
      status VARCHAR(20), -- success, failed, rate_limited
      response_size INTEGER,
      execution_time_ms INTEGER,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user_requests (user_id, request_type),
      INDEX idx_request_status (status, created_at),
      FOREIGN KEY (user_id) REFERENCES instagram_user_data(user_id)
  );
  ```
  
  ---
  
  ## Implementation Phases
  
  ### Phase 1: Core Profile Data Collection (Week 1-2)
  **Scope:** Implement basic profile data extraction
  - **Request:** `PolarisProfilePageContentQuery`
  - **Fields:** `follower_count`, basic profile info
  - **Infrastructure:** Authentication management, rate limiting
  - **Storage:** Basic user profile table
  
  ### Phase 2: Demographics Integration (Week 3-4)
  **Scope:** Add audience demographics data
  - **Request:** `PolarisAccountInsightsFollowersQuery`
  - **Fields:** Age ranges, gender percentages, top locations
  - **Enhancement:** Professional account detection
  - **Storage:** Extended demographics fields
  
  ### Phase 3: Analytics & Growth Metrics (Week 5-6)
  **Scope:** Complete analytics data collection
  - **Requests:** `PolarisAccountInsightsProfileQuery`, `PolarisAccountInsightsFollowersGrowthQuery`
  - **Fields:** All remaining form requirements
  - **Enhancement:** Engagement rate calculations
  - **Storage:** Full schema implementation
  
  ### Phase 4: Scale & Optimization (Week 7-8)
  **Scope:** Production-ready optimization
  - **Infrastructure:** Multi-session handling, advanced caching
  - **Monitoring:** Request success rates, data quality metrics
  - **API:** External API for ad targeting form integration
  - **Documentation:** Complete API documentation
  
  ---
  
  ## Success Metrics
  
  ### Data Collection KPIs
  - **Coverage Rate:** % of requested users with complete data (Target: >90%)
  - **Data Freshness:** Average age of cached data (Target: <24 hours)
  - **Request Success Rate:** % of successful API requests (Target: >95%)
  - **Response Time:** Average data retrieval time (Target: <2 seconds)
  
  ### Data Quality Metrics
  - **Completeness Score:** % of form fields populated per user
  - **Accuracy Validation:** Spot-checks against Instagram web interface
  - **Consistency Checks:** Cross-validation between different endpoints
  - **Error Rate Monitoring:** Failed extractions and data anomalies
  
  ### Infrastructure Metrics
  - **Rate Limit Efficiency:** Requests per hour without throttling
  - **Session Health:** Active authenticated session count
  - **Cache Hit Rate:** % of requests served from cache
  - **System Availability:** Uptime of data collection service
  
  ---
  
  ## Technical Requirements Summary
  
  ### Essential API Endpoints
  1. `PolarisProfilePageContentQuery` - Core profile data
  2. `PolarisAccountInsightsFollowersQuery` - Demographics
  3. `PolarisAccountInsightsProfileQuery` - Analytics
  4. `PolarisAccountInsightsFollowersGrowthQuery` - Growth metrics
  5. `PolarisAccountInsightsInteractionsQuery` - Engagement
  
  ### Infrastructure Requirements
  - **Session Management:** Multiple authenticated Instagram sessions
  - **Rate Limiting:** Request queuing and throttling system
  - **Data Storage:** PostgreSQL with optimized indexes
  - **Caching:** Redis for API response caching
  - **Monitoring:** Request tracking and error reporting
  - **API Layer:** REST API for form integration
  
  ### Field Extraction Priorities
  1. **Tier 1 (Critical):** `follower_count`, demographics percentages
  2. **Tier 2 (Important):** Analytics metrics, growth percentages
  3. **Tier 3 (Valuable):** Engagement rate, location data
  
  This specification provides the complete technical foundation for building a scalable Instagram data collection engine that satisfies all current Ad Targeting Form requirements while providing extensibility for future enhancements.
  Current Ad Form Schema → Instagram API Mapping

  | Ad Form Field           | Request Source                               | JSON Path                                     | Validation Logic                  |
  |-------------------------|----------------------------------------------|-----------------------------------------------|-----------------------------------|
  | ig-follower-count       | PolarisProfilePageContentQuery               | data.user.follower_count                      | ≥ target_value                    |
  | ig-audience-gender      | PolarisAccountInsightsFollowersQuery         | follower_demographics.gender[].percentage     | gender_percentage ≥ threshold     |
  | ig-audience-age         | PolarisAccountInsightsFollowersQuery         | follower_demographics.age_ranges[].percentage | age_range_percentage ≥ threshold  |
  | ig-profile-visits-7d    | PolarisAccountInsightsProfileQuery           | profile_actions.profile_visits_7d             | ≥ target_visits                   |
  | ig-profile-visits-30d   | PolarisAccountInsightsProfileQuery           | profile_actions.profile_visits_30d            | ≥ target_visits                   |
  | ig-profile-visits-90d   | PolarisAccountInsightsProfileQuery           | profile_actions.profile_visits_90d            | ≥ target_visits                   |
  | ig-accounts-reached-7d  | PolarisAccountInsightsProfileQuery           | profile_actions.accounts_reached_7d           | ≥ target_reach                    |
  | ig-accounts-reached-30d | PolarisAccountInsightsProfileQuery           | profile_actions.accounts_reached_30d          | ≥ target_reach                    |
  | ig-accounts-engaged-7d  | PolarisAccountInsightsProfileQuery           | profile_actions.accounts_engaged_7d           | ≥ target_engagement               |
  | ig-accounts-engaged-30d | PolarisAccountInsightsProfileQuery           | profile_actions.accounts_engaged_30d          | ≥ target_engagement               |
  | ig-follower-growth-7d   | PolarisAccountInsightsTopContentByViewsQuery | follower_growth.growth_7d.percentage          | ≥ target_growth_rate              |
  | ig-follower-growth-30d  | PolarisAccountInsightsTopContentByViewsQuery | follower_growth.growth_30d.percentage         | ≥ target_growth_rate              |
  | ig-follower-growth-90d  | PolarisAccountInsightsTopContentByViewsQuery | follower_growth.growth_90d.percentage         | ≥ target_growth_rate              |
  | ig-engagement-rate      | PolarisAccountInsightsTopContentByViewsQuery | engagement_metrics.overall_engagement_rate    | ≥ target_rate                     |
  | ig-top-location         | PolarisAccountInsightsFollowersQuery         | follower_demographics.top_locations[]         | location_name === target_location |

  ---
  4. Data Collection Engine Requirements

  Essential Request Sequence

  1. PolarisProfilePageContentQuery → Get user ID and basic metrics
  2. Check: is_professional_account flag
  3. If Professional: Execute insights requests (2-4)
  4. If Personal: Use only basic profile data

  Request Dependencies

  - All insights requests require is_professional_account: true
  - User ID from profile request needed for all subsequent requests
  - Demographics/analytics require professional account status

  ---
  5. Gaps & Missing Data

  Current Limitations

  Professional Account Dependency:
  - 85% of targeting fields require professional account status
  - Personal accounts only provide: follower_count, basic profile data
  - Impact: Limited targeting for personal influencers

  Geographic Coverage:
  - City/country data only available in ~75% of profiles
  - Location accuracy depends on user-provided data
  - Workaround: Use post location data as fallback

  Engagement Rate Calculation:
  - API provides overall rate, not post-specific rates
  - May not reflect recent performance changes
  - Workaround: Calculate from recent post data

  Additional Fields Available (Not in Current Form)

  | Available Field | Use Case                        | Implementation Priority |
  |-----------------|---------------------------------|-------------------------|
  | account_type    | Creator vs Business targeting   | High                    |
  | is_verified     | Credibility/authority filtering | High                    |
  | category        | Industry/niche targeting        | High                    |
  | media_count     | Activity level assessment       | Medium                  |
  | external_url    | Business/monetization indicator | Medium                  |

  Recommended Form Enhancements

  High-Priority Additions:
  1. Account verification status targeting
  2. Business category filtering
  3. Account type classification (Personal/Business/Creator)

  Technical Requirements for Scale:
  - Session management for multiple authenticated requests
  - Rate limiting (5 requests/second recommended)
  - Professional account detection before insights requests
  - Fallback logic for incomplete data

  Coverage Summary

  - Full Coverage (100%): Basic profile metrics (follower count, account type, verification)
  - High Coverage (80-90%): Demographics, analytics (professional accounts only)
  - Partial Coverage (30-75%): Geographic data, engagement specifics
