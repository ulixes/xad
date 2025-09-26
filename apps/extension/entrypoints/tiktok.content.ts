import { TikTokCommentTracker } from '@/src/trackers/TikTokCommentTracker';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  main() {
    console.log('[TikTok Tracker] ✅ Content script loaded on:', window.location.href);

    class TikTokAccountTracker {
      private accountId: string | null = null;
      private handle: string | null = null;
      private isCollecting: boolean = false;
      private collectedData: any = {};
      private capturedApiCalls: any[] = [];

      constructor() {
        // Check URL params for auto-collection
        const urlParams = new URLSearchParams(window.location.search);
        const shouldCollect = urlParams.get('tiktok_collect');
        
        if (shouldCollect) {
          this.isCollecting = true;
          this.accountId = urlParams.get('account_id');
          this.handle = urlParams.get('handle');
          console.log('[TikTok Tracker] 🟢 Auto-collecting for:', this.handle);
          
          this.setupMessageListener();
          this.setupNetworkInterceptor();
          
          // Start collection after 1 second
          setTimeout(() => this.collectTikTokData(), 1000);
        } else {
          this.setupMessageListener();
          this.setupNetworkInterceptor();
        }
      }

      private setupMessageListener() {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'COLLECT_TIKTOK_DATA') {
            this.accountId = message.accountId;
            this.handle = message.handle;
            this.isCollecting = true;
            const phase = message.phase || 'profile';
            console.log(`[TikTok Tracker] Starting collection for: ${this.handle} (Phase: ${phase})`);
            
            this.processCapturedApiCalls();
            this.collectTikTokData();
            sendResponse({ acknowledged: true });
          }
          
          if (message.type === 'START_DEMOGRAPHICS_COLLECTION') {
            this.accountId = message.accountId;
            this.handle = message.handle;
            this.isCollecting = true;
            console.log('[TikTok Tracker] Starting demographics collection for:', this.handle);
            
            // Process any already captured demographics
            this.processCapturedApiCalls();
            
            // If no demographics found, actively fetch them
            setTimeout(() => {
              if (!this.hasDemographicsData()) {
                console.log('[TikTok Tracker] No demographics captured, attempting active fetch...');
                this.fetchDemographicsData();
              }
            }, 2000);
            
            sendResponse({ acknowledged: true });
          }
          
          if (message.type === 'START_FOLLOWER_DEMOGRAPHICS_COLLECTION') {
            this.accountId = message.accountId;
            this.handle = message.handle;
            this.isCollecting = true;
            console.log('[TikTok Tracker] Starting FOLLOWER demographics collection for:', this.handle);
            
            // Process any already captured follower demographics
            this.processCapturedApiCalls();
            
            // If no follower demographics found, actively fetch them
            setTimeout(() => {
              if (!this.hasFollowerDemographicsData()) {
                console.log('[TikTok Tracker] No follower demographics captured, attempting active fetch...');
                this.fetchFollowerDemographicsData();
              }
            }, 2000);
            
            sendResponse({ acknowledged: true });
          }
          
          if (message.type === 'CHECK_STATUS') {
            sendResponse({ 
              isActive: true, 
              isCollecting: this.isCollecting,
              collectedData: this.collectedData
            });
          }
          
          return true;
        });
      }

      private setupNetworkInterceptor() {
        // Intercept fetch for API responses
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          const url = args[0].toString();
          
          // Log ALL TikTok API calls for debugging
          if (url.includes('tiktok.com') && url.includes('/api')) {
            console.log('[TikTok Tracker] 🔍 API Call detected:', url.split('?')[0]);
            
            // Track all analytics-related APIs
            if (url.includes('insight') || url.includes('analytics') || url.includes('viewer')) {
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG_LOG', 
                message: '🔎 ANALYTICS-RELATED API',
                data: {
                  endpoint: url.split('?')[0],
                  has_type_requests: url.includes('type_requests'),
                  url_length: url.length
                }
              });
            }
          }
          
          // Check for analytics/insight APIs specifically
          if (url.includes('/aweme/v2/data/insight/') || url.includes('type_requests')) {
            // Log FULL URL to see exactly which API is being called
            browser.runtime.sendMessage({
              type: 'TIKTOK_DEBUG_LOG',
              message: '🎯 FULL ANALYTICS URL',
              data: url
            });
            
            console.log('[TikTok Tracker] 🎯 ANALYTICS API DETECTED:', url.substring(0, 100));
            const clonedResponse = response.clone();
            try {
              const rawText = await clonedResponse.text();
              
              // Parse the JSON
              const data = JSON.parse(rawText);
              
              // Send detailed info to background
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG_LOG',
                message: '📊 API RESPONSE ANALYSIS',
                data: {
                  url_length: url.length,
                  has_type_requests: url.includes('type_requests'),
                  response_size: rawText.length,
                  unique_viewer_num_value: data.unique_viewer_num?.value,
                  new_viewer_num_value: data.new_viewer_num?.value,
                  all_keys: Object.keys(data).join(', ')
                }
              });
              
              const apiCall = { url, timestamp: Date.now(), data };
              this.capturedApiCalls.push(apiCall);
              
              if (this.isCollecting) {
                console.log('[TikTok Tracker] 🔄 Processing analytics response (isCollecting=true)');
                this.processApiResponse(url, data);
              } else {
                console.log('[TikTok Tracker] ⏸️ Storing analytics response (isCollecting=false)');
              }
            } catch (e) {
              console.log('[TikTok Tracker] ❌ Failed to parse analytics response:', e);
            }
          }
          
          // Capture profile API calls
          else if (url.includes('tiktok.com') && (
              url.includes('/api/web/user') ||
              url.includes('/api/common-app-context') ||
              url.includes('/api/web/relation') ||
              url.includes('/api/web/counter')
          )) {
            const clonedResponse = response.clone();
            try {
              const data = await clonedResponse.json();
              console.log('[TikTok Tracker] API captured:', url.split('?')[0]);
              
              const apiCall = { url, timestamp: Date.now(), data };
              this.capturedApiCalls.push(apiCall);
              
              if (this.isCollecting) {
                this.processApiResponse(url, data);
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
          
          return response;
        };
      }

      private processApiResponse(url: string, data: any) {
        // Log what we're processing
        console.log('[TikTok Tracker] 🔧 processApiResponse called for:', url.split('?')[0]);
        console.log('[TikTok Tracker] 📊 Data structure keys:', Object.keys(data || {}));
        
        // Extract essential fields only
        
        // /api/web/user endpoint - contains isVerified, isPrivate
        if (url.includes('/api/web/user')) {
          if (data.userExtra) {
            this.collectedData.isVerified = data.userExtra.isVerified || false;
            this.collectedData.isPrivate = data.userExtra.isPrivate || false;
            this.collectedData.bio = data.userExtra.profileBio || '';
            this.collectedData.followers = data.userExtra.followerCount || 0;
            this.collectedData.following = data.userExtra.followingCount || 0;
          }
          
          if (data.userBaseInfo?.UserProfile?.UserBase) {
            const userBase = data.userBaseInfo.UserProfile.UserBase;
            this.collectedData.uniqueId = userBase.UniqId;
            this.collectedData.region = userBase.Region?.Region;
            this.collectedData.language = userBase.Language?.Language;
            this.collectedData.createTime = userBase.CreateTime;
          }
        }
        
        // /api/common-app-context endpoint - contains analyticsOn
        if (url.includes('/api/common-app-context')) {
          if (data.user) {
            this.collectedData.uniqueId = this.collectedData.uniqueId || data.user.uniqueId;
            this.collectedData.bio = this.collectedData.bio || data.user.signature;
            this.collectedData.analyticsOn = data.user.analyticsOn || false;
            this.collectedData.isPrivate = this.collectedData.isPrivate ?? data.user.isPrivateAccount;
            this.collectedData.region = this.collectedData.region || data.user.region;
            this.collectedData.language = this.collectedData.language || data.language;
            this.collectedData.followers = this.collectedData.followers || data.user.followerCount || 0;
            this.collectedData.following = this.collectedData.following || data.user.followingCount || 0;
          }
        }
        
        // Demographics API endpoint - contains viewer OR follower analytics
        if (url.includes('/aweme/v2/data/insight/') || url.includes('type_requests')) {
          console.log('[TikTok Tracker] 🎯 DEMOGRAPHICS API INTERCEPTED!');
          console.log('[TikTok Tracker] 📋 Available viewer data fields:', {
            has_viewer_gender: !!data?.viewer_gender_percent,
            has_viewer_age: !!data?.viewer_age_distribution,
            has_viewer_geo: !!data?.viewer_country_city_percent,
            has_unique_viewer_num: !!data?.unique_viewer_num,
            has_new_viewer_num: !!data?.new_viewer_num,
            has_unique_viewer_series: !!data?.unique_viewer,
            has_new_viewer_series: !!data?.new_viewer,
            has_returning_viewer_series: !!data?.returning_viewer,
            all_data_keys: Object.keys(data || {})
          });
          
          // Check if this response has VIEWER demographics data
          if (data?.viewer_gender_percent || 
              data?.viewer_age_distribution ||
              data?.viewer_country_city_percent) {
            
            console.log('[TikTok Tracker] ✅ Found VIEWER demographics data, sending immediately...');
            
            // Log viewer metrics extraction
            const viewerExtraction = {
              unique_viewer_num_raw: data.unique_viewer_num,
              uniqueViewers: data.unique_viewer_num?.value || 0,
              new_viewer_num_raw: data.new_viewer_num,
              newViewers: data.new_viewer_num?.value || 0,
              hasTimeSeries: !!(data.new_viewer || data.returning_viewer || data.unique_viewer)
            };
            
            // Send to background console
            browser.runtime.sendMessage({
              type: 'TIKTOK_DEBUG_LOG',
              message: '📊 Extracting viewer totals',
              data: viewerExtraction
            });
            
            const demographics = {
              genderFemale: this.extractPercentValue(data.viewer_gender_percent, 'Female') * 100,
              genderMale: this.extractPercentValue(data.viewer_gender_percent, 'Male') * 100,
              genderOther: this.extractPercentValue(data.viewer_gender_percent, 'Other') * 100,
              age18to24: this.extractPercentValue(data.viewer_age_distribution, '18-24') * 100,
              age25to34: this.extractPercentValue(data.viewer_age_distribution, '25-34') * 100,
              age35to44: this.extractPercentValue(data.viewer_age_distribution, '35-44') * 100,
              age45to54: this.extractPercentValue(data.viewer_age_distribution, '45-54') * 100,
              age55plus: this.extractPercentValue(data.viewer_age_distribution, '55+') * 100,
              uniqueViewers: data.unique_viewer_num?.value || 0,
              newViewers: data.new_viewer_num?.value || 0,
              geography: this.extractGeography(data.viewer_country_city_percent)
            };
            
            // Also extract viewer metrics time-series data if available
            let viewerMetrics = null;
            if (data.new_viewer || data.returning_viewer || data.unique_viewer) {
              const totalUnique = data.unique_viewer_num?.value || 0;
              const totalNew = data.new_viewer_num?.value || 0;
              const totalReturning = totalUnique - totalNew;
              
              console.log('[TikTok Tracker] 📈 Processing time-series viewer metrics:', {
                totalUniqueViewers: totalUnique,
                totalNewViewers: totalNew,
                calculatedReturningViewers: totalReturning,
                newViewerSeriesLength: data.new_viewer?.length || 0,
                uniqueViewerSeriesLength: data.unique_viewer?.length || 0,
                returningViewerSeriesLength: data.returning_viewer?.length || 0
              });
              
              viewerMetrics = {
                rangeDays: 28, // Default to 28 days from URL parameter
                totalUniqueViewers: totalUnique,
                totalNewViewers: totalNew,
                totalReturningViewers: totalReturning,
                newViewersSeries: data.new_viewer || [],
                returningViewersSeries: data.returning_viewer || [],
                uniqueViewersSeries: data.unique_viewer || [],
                viewerActiveHours: data.viewer_active_history_hours || [],
                viewerActiveDays: data.viewer_active_history_days || []
              };
              console.log('[TikTok Tracker] 📊 Extracted viewer metrics time-series data');
            }
            
            // Send viewer demographics and metrics immediately
            browser.runtime.sendMessage({
              type: 'TIKTOK_DEMOGRAPHICS_COLLECTED',
              accountId: this.accountId,
              handle: this.handle,
              demographics: demographics,
              viewerMetrics: viewerMetrics
            }).then(() => {
              console.log('[TikTok Tracker] ✅ Viewer demographics sent to background');
              // Close tab after sending if we're on viewers page
              if (window.location.pathname.includes('/analytics/viewers')) {
                window.close();
              }
            });
          }
          
          // Check if this response has FOLLOWER demographics data
          if (data?.follower_gender_percent || 
              data?.follower_age_distribution ||
              data?.follower_location_percent) {
            
            console.log('[TikTok Tracker] ✅ Found FOLLOWER demographics data, sending immediately...');
            
            const followerDemographics = {
              followerCount: data.follower_num?.value || 0,
              genderFemale: this.extractPercentValue(data.follower_gender_percent, 'Female') * 100,
              genderMale: this.extractPercentValue(data.follower_gender_percent, 'Male') * 100,
              genderOther: this.extractPercentValue(data.follower_gender_percent, 'Other') * 100,
              age18to24: this.extractPercentValue(data.follower_age_distribution, '18-24') * 100,
              age25to34: this.extractPercentValue(data.follower_age_distribution, '25-34') * 100,
              age35to44: this.extractPercentValue(data.follower_age_distribution, '35-44') * 100,
              age45to54: this.extractPercentValue(data.follower_age_distribution, '45-54') * 100,
              age55plus: this.extractPercentValue(data.follower_age_distribution, '55+') * 100,
              geography: this.extractFollowerGeography(data.follower_location_percent),
              // Add activity patterns if available
              activeFollowers: data.follower_active_num?.value || 0,
              inactiveFollowers: data.follower_inactive_num?.value || 0
            };
            
            // Send follower demographics immediately
            browser.runtime.sendMessage({
              type: 'TIKTOK_FOLLOWER_DEMOGRAPHICS_COLLECTED',
              accountId: this.accountId,
              handle: this.handle,
              followerDemographics: followerDemographics
            }).then(() => {
              console.log('[TikTok Tracker] ✅ Follower demographics sent to background');
              // Close tab after sending if we're on followers page
              if (window.location.pathname.includes('/analytics/followers')) {
                window.close();
              }
            });
          }
        }
      }
      
      private extractPercentValue(data: any, key: string): number {
        if (!data?.value || !Array.isArray(data.value)) return 0;
        const item = data.value.find((item: any) => item.key === key);
        return item?.value || 0;
      }
      
      private extractGeography(geoData: any): any[] {
        if (!geoData?.country_percent_list) return [];
        
        const countries = geoData.country_percent_list;
        if (!Array.isArray(countries)) return [];
        
        return countries
          .filter((country: any) => country.country_name !== 'Others')
          .map((country: any, index: number) => ({
            rank: index + 1,
            countryName: country.country_name,
            countryCode: country.country_name,
            countryPct: (country.country_vv_percent || 0) * 100,
            cities: (country.city_percent_list || []).map((city: any) => ({
              name: city.key,
              pct: (city.value || 0) * 100
            }))
          }));
      }

      private extractFollowerGeography(geoData: any): any[] {
        // Similar to viewer geography but handles follower_location_percent format
        if (!geoData?.country_percent_list) return [];
        
        const countries = geoData.country_percent_list;
        if (!Array.isArray(countries)) return [];
        
        return countries
          .filter((country: any) => country.country_name !== 'Others')
          .map((country: any, index: number) => ({
            rank: index + 1,
            countryName: country.country_name,
            countryCode: country.country_name,
            countryPct: (country.country_vv_percent || country.country_percent || 0) * 100,
            cities: (country.city_percent_list || []).map((city: any) => ({
              name: city.key || city.city_name,
              pct: (city.value || city.city_percent || 0) * 100
            }))
          }));
      }

      private processCapturedApiCalls() {
        console.log('[TikTok Tracker] Processing', this.capturedApiCalls.length, 'captured API calls');
        this.capturedApiCalls.forEach(call => {
          this.processApiResponse(call.url, call.data);
        });
      }

      private async collectTikTokData() {
        console.log('[TikTok Tracker] 🔥 Starting data collection');
        
        // Extract from page state if available
        this.extractPageState();
        
        // Extract from DOM as fallback
        this.extractDOMData();
        
        // If we're in Studio, fetch additional data
        if (window.location.pathname.includes('studio')) {
          await this.fetchStudioData();
        }
        
        // Check data completeness every 2 seconds
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          console.log(`[TikTok Tracker] Check #${checkCount} - Has data:`, {
            uniqueId: !!this.collectedData.uniqueId,
            hasEssentialData: this.hasRequiredData()
          });
          
          if (this.hasRequiredData() || checkCount > 10) {
            clearInterval(checkInterval);
            this.sendDataToBackground();
          }
        }, 2000);
      }

      private extractPageState() {
        // Check window.SIGI_STATE for basic data
        if ((window as any).SIGI_STATE) {
          const sigiState = (window as any).SIGI_STATE;
          if (sigiState.UserModule) {
            const users = sigiState.UserModule.users;
            const currentUser = Object.values(users)[0] as any;
            if (currentUser) {
              this.collectedData.uniqueId = this.collectedData.uniqueId || currentUser.uniqueId;
              this.collectedData.isVerified = this.collectedData.isVerified ?? currentUser.verified;
              this.collectedData.bio = this.collectedData.bio || currentUser.signature;
              this.collectedData.isPrivate = this.collectedData.isPrivate ?? currentUser.privateAccount;
              this.collectedData.region = this.collectedData.region || currentUser.region;
              this.collectedData.followers = this.collectedData.followers || currentUser.stats?.followerCount || 0;
              this.collectedData.following = this.collectedData.following || currentUser.stats?.followingCount || 0;
            }
          }
        }
      }

      private extractDOMData() {
        // Extract bio from DOM if not already captured
        if (!this.collectedData.bio) {
          const bioElement = document.querySelector('[data-e2e="user-bio"]');
          if (bioElement) {
            this.collectedData.bio = bioElement.textContent?.trim() || '';
          }
        }
        
        // Extract username from DOM if not already captured
        if (!this.collectedData.uniqueId) {
          const usernameElement = document.querySelector('[data-e2e="user-subtitle"]');
          if (usernameElement) {
            this.collectedData.uniqueId = usernameElement.textContent?.replace('@', '').trim();
          }
        }
        
        // Check for verification badge
        if (this.collectedData.isVerified === undefined) {
          const verifiedBadge = document.querySelector('[data-e2e="user-verification"]');
          this.collectedData.isVerified = !!verifiedBadge;
        }
      }

      private async fetchStudioData() {
        console.log('[TikTok Tracker] Fetching Studio data...');
        
        try {
          // Fetch user data
          const userResponse = await fetch('/tiktokstudio/api/web/user?needIsVerified=true&needProfileBio=true', {
            credentials: 'include'
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            this.processApiResponse('/api/web/user', userData);
            
            // Extract userId for relation count API
            let userId = null;
            if (userData.userBaseInfo?.UserProfile?.UserBase?.UserId) {
              userId = userData.userBaseInfo.UserProfile.UserBase.UserId;
            }
            
            // Fetch follower/following counts if we have userId
            if (userId) {
              await this.fetchRelationCounts(userId);
            }
          }
        } catch (e) {
          console.log('[TikTok Tracker] Failed to fetch user data:', e);
        }
        
        try {
          // Fetch app context
          const contextResponse = await fetch('/node-webapp/api/common-app-context', {
            credentials: 'include'
          });
          
          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            this.processApiResponse('/api/common-app-context', contextData);
          }
        } catch (e) {
          console.log('[TikTok Tracker] Failed to fetch app context:', e);
        }
      }
      
      private async fetchRelationCounts(userId: string) {
        console.log('[TikTok Tracker] Fetching follower/following counts for userId:', userId);
        
        try {
          // Build the relation count API URL
          const url = `/tiktokstudio/api/web/relation/multiGetFollowRelationCount?userId=${userId}`;
          
          const response = await fetch(url, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json,*/*;q=0.8'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[TikTok Tracker] Relation counts fetched:', data);
            
            // Extract follower and following counts
            if (data.FollowerCount && data.FollowerCount[userId]) {
              this.collectedData.followers = parseInt(data.FollowerCount[userId]) || 0;
            }
            if (data.FollowingCount && data.FollowingCount[userId]) {
              this.collectedData.following = parseInt(data.FollowingCount[userId]) || 0;
            }
            
            console.log('[TikTok Tracker] Updated counts - Followers:', this.collectedData.followers, 'Following:', this.collectedData.following);
          }
        } catch (e) {
          console.log('[TikTok Tracker] Failed to fetch relation counts:', e);
        }
      }

      private hasRequiredData(): boolean {
        // We need at least uniqueId to identify the account
        return !!this.collectedData.uniqueId;
      }

      private hasDemographicsData(): boolean {
        // Check if we've captured VIEWER demographics data in our API calls
        return this.capturedApiCalls.some(call => {
          const data = call.data;
          return data?.viewer_gender_percent || 
                 data?.viewer_age_distribution ||
                 data?.viewer_country_city_percent;
        });
      }

      private hasFollowerDemographicsData(): boolean {
        // Check if we've captured FOLLOWER demographics data in our API calls
        return this.capturedApiCalls.some(call => {
          const data = call.data;
          return data?.follower_gender_percent || 
                 data?.follower_age_distribution ||
                 data?.follower_location_percent;
        });
      }

      private async fetchDemographicsData() {
        console.log('[TikTok Tracker] Attempting to fetch demographics data...');
        
        // Build the type_requests parameter for demographics (28-day range)
        const typeRequests = encodeURIComponent(JSON.stringify([
          {insigh_type: "unique_viewer", end_days: 1, days: 28},
          {insigh_type: "unique_viewer_num", range: 28},
          {insigh_type: "new_viewer_num", range: 28},
          {insigh_type: "returning_viewer", end_days: 1, days: 28},
          {insigh_type: "viewer_gender_percent", range: 28},
          {insigh_type: "viewer_age_distribution", range: 28},
          {insigh_type: "viewer_country_city_percent", range: 28}
        ]));
        
        try {
          // Try to fetch demographics API directly
          const response = await fetch(`/aweme/v2/data/insight/?type_requests=${typeRequests}`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json, text/plain, */*'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[TikTok Tracker] Demographics fetched successfully');
            this.processApiResponse('/aweme/v2/data/insight/', data);
          }
        } catch (error) {
          console.error('[TikTok Tracker] Failed to fetch demographics:', error);
          
          // Send failure message
          browser.runtime.sendMessage({
            type: 'TIKTOK_DEMOGRAPHICS_FAILED',
            accountId: this.accountId,
            handle: this.handle,
            reason: 'fetch_failed'
          });
        }
      }

      private async fetchFollowerDemographicsData() {
        console.log('[TikTok Tracker] Attempting to fetch FOLLOWER demographics data...');
        
        // Build the type_requests parameter for follower demographics
        const typeRequests = encodeURIComponent(JSON.stringify([
          {insigh_type: "follower_num"},
          {insigh_type: "follower_gender_percent", range: 1},
          {insigh_type: "follower_age_distribution", range: 1},
          {insigh_type: "follower_location_percent", range: 1}
        ]));
        
        try {
          // Try to fetch follower demographics API directly
          const response = await fetch(`/aweme/v2/data/insight/?type_requests=${typeRequests}`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json, text/plain, */*'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[TikTok Tracker] Follower demographics fetched successfully');
            this.processApiResponse('/aweme/v2/data/insight/', data);
          }
        } catch (error) {
          console.error('[TikTok Tracker] Failed to fetch follower demographics:', error);
          
          // Send failure message
          browser.runtime.sendMessage({
            type: 'TIKTOK_FOLLOWER_DEMOGRAPHICS_FAILED',
            accountId: this.accountId,
            handle: this.handle,
            reason: 'fetch_failed'
          });
        }
      }

      private sendDataToBackground() {
        console.log('[TikTok Tracker] 📤 Sending data:', this.collectedData);
        
        // Prepare normalized data with only essential fields
        const normalizedData = {
          uniqueId: this.collectedData.uniqueId || this.handle,
          bio: this.collectedData.bio || '',
          isVerified: this.collectedData.isVerified || false,
          isPrivate: this.collectedData.isPrivate || false,
          analyticsOn: this.collectedData.analyticsOn || false,
          region: this.collectedData.region || null,
          language: this.collectedData.language || null,
          createTime: this.collectedData.createTime || null,
          followers: this.collectedData.followers || 0,
          following: this.collectedData.following || 0
        };
        
        // Send profile data only (demographics are handled separately on analytics page)
        browser.runtime.sendMessage({
          type: 'TIKTOK_DATA_COLLECTED',
          accountId: this.accountId,
          handle: this.handle,
          payload: normalizedData
        }).then(() => {
          console.log('[TikTok Tracker] ✅ Profile data sent successfully');
          this.isCollecting = false;
          this.collectedData = {};
        }).catch(err => {
          console.error('[TikTok Tracker] ❌ Failed to send data:', err);
        });
      }
    }

    class TikTokActionTracker {
      private observers: Map<string, MutationObserver> = new Map();
      private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
      private pendingActions: Map<string, {
        actionId: string;
        actionType: 'like' | 'follow';
        startTime: number;
        targetElement?: Element;
        initialState?: any;
      }> = new Map();

      constructor() {
        this.setupMessageListener();
        console.log('[TikTok Action Tracker] 🚀 Initialized');
        
        // Send initialization confirmation
        browser.runtime.sendMessage({
          type: 'TIKTOK_TRACKER_READY',
          timestamp: Date.now()
        }).catch(err => {
          console.log('[TikTok Action Tracker] Could not send ready message (normal if no listener):', err);
        });
      }

      private setupMessageListener() {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('[TikTok Action Tracker] 📨 Received message:', message);

          if (message.type === 'TRACK_ACTION') {
            console.log(`[TikTok Action Tracker] 🎬 Processing ${message.actionType} action with ID: ${message.actionId}`);
            
            // Send immediate acknowledgment to background
            browser.runtime.sendMessage({
              type: 'TIKTOK_ACTION_RECEIVED',
              actionId: message.actionId,
              actionType: message.actionType,
              timestamp: Date.now()
            }).catch(err => console.log('[TikTok] Could not send acknowledgment:', err));
            
            if (message.actionType === 'like') {
              this.trackLikeAction(message.actionId);
              sendResponse({ acknowledged: true, tracking: 'started' });
            } else if (message.actionType === 'follow') {
              this.trackFollowAction(message.actionId);
              sendResponse({ acknowledged: true, tracking: 'started' });
            } else if (message.actionType === 'comment') {
              // Use the new comment tracker
              const commentTracker = new TikTokCommentTracker(message.actionId);
              commentTracker.start();
              sendResponse({ acknowledged: true, tracking: 'started' });
            } else {
              console.log(`[TikTok Action Tracker] ⚠️ Unknown action type: ${message.actionType}`);
              sendResponse({ acknowledged: false, error: `Unknown action type: ${message.actionType}` });
            }
          }

          if (message.type === 'CHECK_STATUS') {
            sendResponse({ 
              isActive: true, 
              pendingActions: Array.from(this.pendingActions.keys()) 
            });
          }

          return true;
        });
      }

      // ============ LIKE ACTION TRACKING ============
      private trackLikeAction(actionId: string) {
        console.log('[TikTok Like Tracker] 🎯 Starting like tracking for:', actionId);
        
        // Send debug log to background
        browser.runtime.sendMessage({
          type: 'TIKTOK_DEBUG',
          message: `Starting like tracking for action: ${actionId}`,
          url: window.location.href
        }).catch(() => {});

        // Wait a bit for the page to stabilize
        setTimeout(() => {
          this.findAndTrackLikeButtons(actionId);
        }, 500);
      }
      
      private findAndTrackLikeButtons(actionId: string) {
        const likeButtons = this.findLikeButtons();
        
        // Send button count to background
        browser.runtime.sendMessage({
          type: 'TIKTOK_DEBUG',
          message: `Found ${likeButtons.length} like buttons on page`,
          buttons: likeButtons.length,
          url: window.location.href
        }).catch(() => {});
        
        if (likeButtons.length === 0) {
          console.log('[TikTok Like Tracker] ⏳ No like buttons found, retrying...');
          
          // Debug: Check what buttons exist on the page
          const allButtons = document.querySelectorAll('button');
          console.log(`[TikTok Like Tracker] Total buttons on page: ${allButtons.length}`);
          
          // Look for ANY button that might be a like button
          allButtons.forEach((btn, idx) => {
            const ariaLabel = btn.getAttribute('aria-label');
            const ariaPressed = btn.getAttribute('aria-pressed');
            const hasSvg = !!btn.querySelector('svg');
            const text = btn.textContent?.trim();
            
            // Log buttons with potential like indicators
            if (ariaLabel?.toLowerCase().includes('like') || 
                ariaPressed !== null || 
                (hasSvg && !text) ||
                btn.querySelector('span[data-e2e="like-icon"]')) {
              console.log(`[TikTok Like Tracker] Potential like button #${idx}:`, {
                ariaLabel,
                ariaPressed,
                hasSvg,
                text,
                hasLikeIcon: !!btn.querySelector('span[data-e2e="like-icon"]'),
                html: btn.outerHTML.substring(0, 200)
              });
            }
          });
          
          setTimeout(() => this.findAndTrackLikeButtons(actionId), 1000);
          return;
        }

        // Capture initial states with detailed info
        const initialStates = likeButtons.map(btn => {
          const svg = btn.querySelector('svg');
          const pathFills = Array.from(svg?.querySelectorAll('path') || []).map(p => p.getAttribute('fill'));
          const animatedHeartPath = btn.querySelector('path[fill*="rgb"]');
          const currentFillColor = animatedHeartPath?.getAttribute('fill') || '';
          
          return {
            element: btn,
            isLiked: this.isLiked(btn),
            likeCount: this.getLikeCount(btn),
            ariaPressed: btn.getAttribute('aria-pressed'),
            ariaLabel: btn.getAttribute('aria-label'),
            className: btn.className,
            pathFills: pathFills,
            heartColor: currentFillColor,
            hasDefs: !!svg?.querySelector('defs'),
            hasFilter: !!svg?.querySelector('filter'),
            svgHTML: svg?.outerHTML || ''
          };
        });

        console.log('[TikTok Like Tracker] 📊 Initial states:', initialStates.map(s => ({
          isLiked: s.isLiked,
          ariaPressed: s.ariaPressed,
          count: s.likeCount,
          ariaLabel: s.ariaLabel
        })));
        
        // Send detailed initial state to background for debugging
        browser.runtime.sendMessage({
          type: 'TIKTOK_DEBUG',
          message: `Initial button states captured`,
          states: initialStates.map(s => ({
            isLiked: s.isLiked,
            ariaPressed: s.ariaPressed,
            ariaLabel: s.ariaLabel,
            count: s.likeCount,
            pathFills: s.pathFills,
            hasDefs: s.hasDefs,
            hasFilter: s.hasFilter
          }))
        }).catch(() => {});

        // Store pending action
        this.pendingActions.set(actionId, {
          actionId,
          actionType: 'like',
          startTime: Date.now(),
          initialState: initialStates
        });

        // Set up dual monitoring
        this.setupLikeMonitoring(actionId, initialStates);
      }

      private findLikeButtons(): Element[] {
        const buttons: Element[] = [];
        
        // Strategy 1: Find by aria-label containing "Like video" (MOST SPECIFIC)
        // TikTok like buttons have aria-label="Like video X likes"
        document.querySelectorAll('button[aria-label*="Like video"]').forEach(btn => {
          if (!buttons.includes(btn)) {
            buttons.push(btn);
            console.log('[TikTok Like Tracker] Found like button by aria-label "Like video":', {
              ariaPressed: btn.getAttribute('aria-pressed'),
              ariaLabel: btn.getAttribute('aria-label')
            });
          }
        });
        
        // Strategy 2: Find by aria-pressed AND like-icon (FALLBACK)
        if (buttons.length === 0) {
          document.querySelectorAll('button[aria-pressed]').forEach(btn => {
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const hasLikeIcon = !!btn.querySelector('span[data-e2e="like-icon"]');
            
            // Check if it has like icon or aria-label contains "like"
            if (hasLikeIcon || ariaLabel.toLowerCase().includes('like')) {
              if (!buttons.includes(btn)) {
                buttons.push(btn);
                console.log('[TikTok Like Tracker] Found like button by aria-pressed + like attributes:', {
                  ariaPressed: btn.getAttribute('aria-pressed'),
                  ariaLabel,
                  hasLikeIcon
                });
              }
            }
          });
        }
        
        // Strategy 2: Find by data-e2e attribute
        const likeIcons = document.querySelectorAll('span[data-e2e="like-icon"]');
        likeIcons.forEach(icon => {
          const btn = icon.closest('button');
          if (btn && !buttons.includes(btn)) {
            buttons.push(btn);
            console.log('[TikTok Like Tracker] Found like button by data-e2e:', {
              ariaPressed: btn.getAttribute('aria-pressed'),
              ariaLabel: btn.getAttribute('aria-label')
            });
          }
        });
        
        // Strategy 3: Find by aria-label (fallback)
        document.querySelectorAll('button[aria-label*="Like"], button[aria-label*="like"]').forEach(btn => {
          // Make sure it's not a comment like button
          if (!btn.getAttribute('aria-label')?.toLowerCase().includes('comment') && !buttons.includes(btn)) {
            buttons.push(btn);
            console.log('[TikTok Like Tracker] Found like button by aria-label:', {
              ariaPressed: btn.getAttribute('aria-pressed'),
              ariaLabel: btn.getAttribute('aria-label')
            });
          }
        });
        
        // Strategy 4: Find buttons with heart SVGs
        document.querySelectorAll('button').forEach(btn => {
          const svg = btn.querySelector('svg');
          if (svg && !buttons.includes(btn)) {
            // Check if SVG has heart-like path
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
              const d = path.getAttribute('d') || '';
              // Check for heart shape patterns in path
              if ((d.includes('M7.5 2.25C10.5') || d.includes('M15 4.5C21') || d.includes('HeartFill')) && !buttons.includes(btn)) {
                buttons.push(btn);
                console.log('[TikTok Like Tracker] Found like button by SVG path:', {
                  ariaPressed: btn.getAttribute('aria-pressed'),
                  ariaLabel: btn.getAttribute('aria-label')
                });
              }
            });
          }
        });
        
        console.log(`[TikTok Like Tracker] Found ${buttons.length} like buttons`);
        buttons.forEach((btn, index) => {
          const svg = btn.querySelector('svg');
          const pathFills = Array.from(svg?.querySelectorAll('path') || []).map(p => p.getAttribute('fill'));
          console.log(`  Button ${index + 1}:`, {
            ariaLabel: btn.getAttribute('aria-label'),
            ariaPressed: btn.getAttribute('aria-pressed'),
            hasLikeIcon: !!btn.querySelector('span[data-e2e="like-icon"]'),
            text: btn.textContent?.trim(),
            pathFills,
            buttonHTML: btn.outerHTML.substring(0, 150)
          });
        });
        
        return buttons;
      }

      private isLiked(button: Element): boolean {
        // PRIMARY: Check aria-pressed - TikTok does use this!
        const ariaPressed = button.getAttribute('aria-pressed');
        if (ariaPressed === 'true') return true;
        if (ariaPressed === 'false') return false;
        
        // Check for the animated heart SVG color
        // When liked, the heart animation uses rgb(254,44,85) instead of rgb(255,255,255)
        const animatedPath = button.querySelector('path[fill="rgb(254,44,85)"], path[fill="rgb(254, 44, 85)"]');
        if (animatedPath) return true;
        
        // Check for white heart (unliked state) - if we find white, it's NOT liked
        const whitePath = button.querySelector('path[fill="rgb(255,255,255)"], path[fill="rgb(255, 255, 255)"]');
        if (whitePath && !animatedPath) return false;
        
        // FALLBACK: Check for red heart fill color in standard SVG (TikTok's red color)
        const redPath = button.querySelector('path[fill="#FE2C55"], path[fill="#ff2c55"], path[fill="rgb(254, 44, 85)"]');
        if (redPath) return true;
        
        // FALLBACK: Check for shadow filter (only on liked state)
        const hasFilter = button.querySelector('g[filter*="LikeRedShadowColor"]');
        if (hasFilter) return true;
        
        // FALLBACK: Check SVG structure - liked hearts have more complex structure
        const svg = button.querySelector('svg');
        if (svg) {
          // Liked hearts have defs, filters, and gradients
          const hasDefs = svg.querySelector('defs');
          const hasGradient = svg.querySelector('radialGradient, linearGradient');
          if (hasDefs && hasGradient) return true;
        }
        
        return false;
      }

      private getLikeCount(button: Element): number {
        const countElement = button.parentElement?.querySelector('strong[data-e2e="like-count"]');
        if (!countElement) return 0;
        
        const text = countElement.textContent || '0';
        return this.parseCount(text);
      }

      private parseCount(text: string): number {
        text = text.trim().toUpperCase();
        if (text.includes('K')) return Math.round(parseFloat(text.replace('K', '')) * 1000);
        if (text.includes('M')) return Math.round(parseFloat(text.replace('M', '')) * 1000000);
        return parseInt(text.replace(/,/g, ''), 10) || 0;
      }

      private setupLikeMonitoring(actionId: string, initialStates: any[]) {
        // Send monitoring started message
        browser.runtime.sendMessage({
          type: 'TIKTOK_DEBUG',
          message: 'Like monitoring started - watching for changes'
        }).catch(() => {});
        
        // MutationObserver
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && 
                mutation.target instanceof Element &&
                (mutation.target.matches('button[aria-label*="Like video"]') || 
                 mutation.target.matches('button[aria-pressed]'))) {
              
              const button = mutation.target;
              const oldState = initialStates.find(s => s.element === button);
              if (oldState) {
                const newPressed = button.getAttribute('aria-pressed');
                const wasLiked = oldState.ariaPressed === 'true';
                const nowLiked = newPressed === 'true';
                
                if (!wasLiked && nowLiked) {
                  console.log('[TikTok Like Tracker] ✅ LIKE DETECTED via aria-pressed change!');
                  console.log(`  Button: ${button.getAttribute('aria-label')}`);
                  console.log(`  aria-pressed: ${oldState.ariaPressed} → ${newPressed}`);
                  this.reportLikeResult(actionId, button, oldState);
                  return;
                } else if (wasLiked && !nowLiked) {
                  console.log('[TikTok Like Tracker] ⚠️ Unlike detected, updating state...');
                  oldState.isLiked = false;
                  oldState.ariaPressed = 'false';
                }
              }
            }
            
            // Check for SVG replacements
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node instanceof Element && node.tagName === 'SVG') {
                  const hasRedFill = node.querySelector('path[fill="#FE2C55"]');
                  if (hasRedFill) {
                    const button = node.closest('button');
                    const oldState = initialStates.find(s => s.element === button);
                    if (oldState && !oldState.isLiked) {
                      console.log('[TikTok Like Tracker] ✅ LIKE DETECTED via SVG!');
                      this.reportLikeResult(actionId, button!, oldState);
                      return;
                    }
                  }
                }
              });
            }
          }
        });
        
        const targetArea = document.querySelector('section[data-e2e="feed-video"]')?.parentElement || document.body;
        observer.observe(targetArea, {
          childList: true,
          attributes: true,
          subtree: true,
          attributeFilter: ['aria-pressed', 'aria-label']
        });
        
        this.observers.set(actionId, observer);
        
        // Polling fallback with debug
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;
          
          for (const state of initialStates) {
            const currentLiked = this.isLiked(state.element);
            const currentCount = this.getLikeCount(state.element);
            const currentAriaPressed = state.element.getAttribute('aria-pressed');
            const svg = state.element.querySelector('svg');
            const currentSvgHTML = svg?.outerHTML || '';
            const svgChanged = currentSvgHTML !== state.svgHTML;
            
            // Check if aria-pressed changed
            const ariaPressedChanged = currentAriaPressed !== state.ariaPressed;
            if (ariaPressedChanged) {
              console.log(`[TikTok Like Tracker] aria-pressed CHANGED: ${state.ariaPressed} → ${currentAriaPressed}`);
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG',
                message: `aria-pressed CHANGED at poll #${pollCount}!`,
                before: state.ariaPressed,
                after: currentAriaPressed,
                ariaLabel: state.element.getAttribute('aria-label')
              }).catch(() => {});
            }
            
            // Check for SVG color change (white to red)
            const animatedHeartPath = state.element.querySelector('path[fill*="rgb"]');
            const currentHeartColor = animatedHeartPath?.getAttribute('fill') || '';
            if (currentHeartColor !== state.heartColor && currentHeartColor) {
              console.log(`[TikTok Like Tracker] Heart color CHANGED: ${state.heartColor} → ${currentHeartColor}`);
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG',
                message: `Heart color CHANGED at poll #${pollCount}!`,
                before: state.heartColor,
                after: currentHeartColor
              }).catch(() => {});
              
              // Update the stored color
              state.heartColor = currentHeartColor;
            }
            
            // Log every 10th poll for debug
            if (pollCount % 10 === 0) {
              const pathFills = Array.from(svg?.querySelectorAll('path') || []).map(p => p.getAttribute('fill'));
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG',
                message: `Polling #${pollCount}: aria-pressed=${currentAriaPressed}, isLiked=${currentLiked}, count=${currentCount}`,
                ariaLabel: state.element.getAttribute('aria-label'),
                pathFills: pathFills,
                hasDefs: !!svg?.querySelector('defs'),
                hasFilter: !!svg?.querySelector('filter')
              }).catch(() => {});
            }
            
            // Detect like by aria-pressed change OR isLiked function
            const likeDetected = (state.ariaPressed === 'false' && currentAriaPressed === 'true') ||
                                (!state.isLiked && currentLiked);
            
            if (likeDetected) {
              console.log('[TikTok Like Tracker] ✅ LIKE DETECTED via polling!');
              console.log(`  aria-pressed: ${state.ariaPressed} → ${currentAriaPressed}`);
              console.log(`  Count: ${state.likeCount} → ${currentCount}`);
              console.log(`  Button: ${state.element.getAttribute('aria-label')}`);
              
              browser.runtime.sendMessage({
                type: 'TIKTOK_DEBUG',
                message: '✅ LIKE DETECTED! Sending verification...',
                ariaPressedChange: `${state.ariaPressed} → ${currentAriaPressed}`,
                countChange: `${state.likeCount} → ${currentCount}`,
                ariaLabel: state.element.getAttribute('aria-label')
              }).catch(() => {});
              
              this.reportLikeResult(actionId, state.element, { ...state, newCount: currentCount });
              clearInterval(pollInterval);
              return;
            } else if ((state.ariaPressed === 'true' && currentAriaPressed === 'false') ||
                      (state.isLiked && !currentLiked)) {
              // Update state if unliked
              state.isLiked = false;
              state.ariaPressed = currentAriaPressed;
              state.likeCount = currentCount;
              state.svgHTML = currentSvgHTML;
            }
          }
        }, 300);
        
        this.pollingIntervals.set(actionId, pollInterval);
        
        // Timeout
        setTimeout(() => {
          if (this.pendingActions.has(actionId)) {
            this.reportActionResult(actionId, false, 'Timeout - no like detected');
            this.cleanup(actionId);
          }
        }, 120000);
      }

      private reportLikeResult(actionId: string, button: Element, oldState: any) {
        const currentLiked = this.isLiked(button);
        const currentCount = this.getLikeCount(button);
        
        if (!currentLiked) {
          console.log('[TikTok Like Tracker] ❌ Verification failed');
          return;
        }
        
        const proof = {
          actionType: 'like',
          platform: 'tiktok',
          targetUrl: window.location.href,
          timestamp: Date.now(),
          verification: {
            ariaPressed: {
              before: oldState.ariaPressed,
              after: button.getAttribute('aria-pressed')
            },
            likeCount: {
              before: oldState.likeCount,
              after: currentCount,
              increased: currentCount > oldState.likeCount
            },
            svgChanged: oldState.svgHTML !== button.querySelector('svg')?.outerHTML,
            hasRedHeart: !!button.querySelector('path[fill="#FE2C55"]')
          }
        };
        
        this.reportActionResult(actionId, true, proof);
        this.cleanup(actionId);
      }

      // ============ FOLLOW ACTION TRACKING ============
      private trackFollowAction(actionId: string) {
        console.log('[TikTok Follow Tracker] 🎯 Starting follow tracking for:', actionId);

        const followButtons = this.findFollowButtons();
        
        if (followButtons.length === 0) {
          console.log('[TikTok Follow Tracker] ⏳ No follow buttons found, retrying...');
          setTimeout(() => this.trackFollowAction(actionId), 1000);
          return;
        }

        // Capture initial states
        const initialStates = followButtons.map(btn => ({
          element: btn,
          isFollowing: this.isFollowing(btn),
          buttonText: btn.textContent?.trim() || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          hasIcon: !!btn.querySelector('svg'),
          classes: Array.from(btn.classList)
        }));

        console.log('[TikTok Follow Tracker] 📊 Initial states:', initialStates.map(s => ({
          isFollowing: s.isFollowing,
          text: s.buttonText,
          ariaLabel: s.ariaLabel
        })));

        // Store pending action
        this.pendingActions.set(actionId, {
          actionId,
          actionType: 'follow',
          startTime: Date.now(),
          initialState: initialStates
        });

        // Set up dual monitoring
        this.setupFollowMonitoring(actionId, initialStates);
      }

      private findFollowButtons(): Element[] {
        const buttons: Element[] = [];
        
        // Strategy 1: Find by data-e2e
        document.querySelectorAll('button[data-e2e="follow-button"]').forEach(btn => {
          buttons.push(btn);
        });
        
        // Strategy 2: Find by aria-label
        document.querySelectorAll('button[aria-label*="Follow"]').forEach(btn => {
          if (!buttons.includes(btn)) buttons.push(btn);
        });
        
        // Strategy 3: Find by text content
        document.querySelectorAll('button').forEach(btn => {
          const text = btn.textContent?.trim() || '';
          if ((text === 'Follow' || text === 'Following') && !buttons.includes(btn)) {
            buttons.push(btn);
          }
        });
        
        console.log(`[TikTok Follow Tracker] Found ${buttons.length} follow buttons`);
        return buttons;
      }

      private isFollowing(button: Element): boolean {
        // Check text content
        const text = button.textContent?.trim() || '';
        if (text === 'Following') return true;
        if (text === 'Follow') return false;
        
        // Check aria-label
        const ariaLabel = button.getAttribute('aria-label') || '';
        if (ariaLabel.includes('Following')) return true;
        if (ariaLabel.includes('Follow') && !ariaLabel.includes('Following')) return false;
        
        // Check for checkmark icon (TikTok shows checkmark when following)
        const hasCheckIcon = !!button.querySelector('svg path[d*="M19 2.5a10"]'); // Part of check icon path
        if (hasCheckIcon) return true;
        
        // Check button classes (TikTok uses TUXButton--secondary when following)
        const isSecondary = button.classList.contains('TUXButton--secondary');
        const isPrimary = button.classList.contains('TUXButton--primary');
        if (isSecondary && text.includes('Following')) return true;
        if (isPrimary && text === 'Follow') return false;
        
        return false;
      }

      private setupFollowMonitoring(actionId: string, initialStates: any[]) {
        // MutationObserver
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            // Check for text changes
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              const button = mutation.target instanceof Element 
                ? mutation.target.closest('button[data-e2e="follow-button"]')
                : null;
                
              if (button) {
                const oldState = initialStates.find(s => s.element === button);
                if (oldState) {
                  const currentFollowing = this.isFollowing(button);
                  if (!oldState.isFollowing && currentFollowing) {
                    console.log('[TikTok Follow Tracker] ✅ FOLLOW DETECTED via DOM!');
                    this.reportFollowResult(actionId, button, oldState);
                    return;
                  } else if (oldState.isFollowing && !currentFollowing) {
                    console.log('[TikTok Follow Tracker] ⚠️ Unfollow detected, updating state...');
                    oldState.isFollowing = false;
                    oldState.buttonText = button.textContent?.trim() || '';
                  }
                }
              }
            }
            
            // Check for attribute changes
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label') {
              const button = mutation.target as Element;
              const oldState = initialStates.find(s => s.element === button);
              if (oldState) {
                const newLabel = button.getAttribute('aria-label') || '';
                if (!oldState.ariaLabel.includes('Following') && newLabel.includes('Following')) {
                  console.log('[TikTok Follow Tracker] ✅ FOLLOW DETECTED via aria-label!');
                  this.reportFollowResult(actionId, button, oldState);
                  return;
                }
              }
            }
          }
        });
        
        const targetArea = document.querySelector('.css-n42mkb-5e6d46e3--DivShareTitleContainer-5e6d46e3--CreatorPageHeaderShareContainer') || document.body;
        observer.observe(targetArea, {
          childList: true,
          attributes: true,
          subtree: true,
          characterData: true,
          attributeFilter: ['aria-label', 'class']
        });
        
        this.observers.set(actionId, observer);
        
        // Polling fallback
        const pollInterval = setInterval(() => {
          for (const state of initialStates) {
            const currentFollowing = this.isFollowing(state.element);
            const currentText = state.element.textContent?.trim() || '';
            
            if (!state.isFollowing && currentFollowing) {
              console.log('[TikTok Follow Tracker] ✅ FOLLOW DETECTED via polling!');
              console.log(`  Text: "${state.buttonText}" → "${currentText}"`);
              this.reportFollowResult(actionId, state.element, state);
              clearInterval(pollInterval);
              return;
            } else if (state.isFollowing && !currentFollowing) {
              state.isFollowing = false;
              state.buttonText = currentText;
            }
          }
        }, 300);
        
        this.pollingIntervals.set(actionId, pollInterval);
        
        // Timeout
        setTimeout(() => {
          if (this.pendingActions.has(actionId)) {
            this.reportActionResult(actionId, false, 'Timeout - no follow detected');
            this.cleanup(actionId);
          }
        }, 120000);
      }

      private reportFollowResult(actionId: string, button: Element, oldState: any) {
        const currentFollowing = this.isFollowing(button);
        const currentText = button.textContent?.trim() || '';
        
        if (!currentFollowing) {
          console.log('[TikTok Follow Tracker] ❌ Verification failed');
          return;
        }
        
        const proof = {
          actionType: 'follow',
          platform: 'tiktok',
          targetUrl: window.location.href,
          timestamp: Date.now(),
          verification: {
            textChange: {
              before: oldState.buttonText,
              after: currentText
            },
            ariaLabel: {
              before: oldState.ariaLabel,
              after: button.getAttribute('aria-label') || ''
            },
            hasCheckIcon: !!button.querySelector('svg path[d*="M19 2.5a10"]'),
            buttonClass: {
              before: oldState.classes.join(' '),
              after: Array.from(button.classList).join(' ')
            }
          }
        };
        
        this.reportActionResult(actionId, true, proof);
        this.cleanup(actionId);
      }

      // ============ COMMON METHODS ============
      private reportActionResult(actionId: string, success: boolean, details: any) {
        console.log('[TikTok Action Tracker] 📤 Reporting result:', {
          actionId,
          success,
          details
        });
        
        browser.runtime.sendMessage({
          type: 'ACTION_COMPLETED',
          payload: {
            actionId,
            success,
            details,
            timestamp: Date.now()
          }
        }).catch(err => {
          console.error('[TikTok Action Tracker] Failed to send completion message:', err);
        });
      }

      private cleanup(actionId: string) {
        const observer = this.observers.get(actionId);
        if (observer) {
          observer.disconnect();
          this.observers.delete(actionId);
        }
        
        const interval = this.pollingIntervals.get(actionId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(actionId);
        }
        
        this.pendingActions.delete(actionId);
        console.log('[TikTok Action Tracker] 🧹 Cleanup completed for:', actionId);
      }
    }

    // Initialize account tracker for data collection
    new TikTokAccountTracker();
    
    // Initialize action tracker for like/follow actions
    new TikTokActionTracker();
  },
});