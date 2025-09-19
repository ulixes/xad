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
          
          // Capture profile API calls only
          if (url.includes('tiktok.com') && (
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
        
        // Demographics API endpoint - contains viewer analytics
        if (url.includes('/aweme/v2/data/insight/') || url.includes('type_requests')) {
          console.log('[TikTok Tracker] 🎯 DEMOGRAPHICS API INTERCEPTED!');
          
          // Check if this response has demographics data
          if (data?.viewer_gender_percent || 
              data?.viewer_age_distribution ||
              data?.viewer_country_city_percent) {
            
            console.log('[TikTok Tracker] ✅ Found demographics data, sending immediately...');
            
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
            
            // Send demographics immediately
            browser.runtime.sendMessage({
              type: 'TIKTOK_DEMOGRAPHICS_COLLECTED',
              accountId: this.accountId,
              handle: this.handle,
              demographics: demographics
            }).then(() => {
              console.log('[TikTok Tracker] ✅ Demographics sent to background');
              // Close tab after sending
              if (window.location.pathname.includes('/analytics/')) {
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

      private hasRequiredData(): boolean {
        // We need at least uniqueId to identify the account
        return !!this.collectedData.uniqueId;
      }

      private hasDemographicsData(): boolean {
        // Check if we've captured demographics data in our API calls
        return this.capturedApiCalls.some(call => {
          const data = call.data;
          return data?.viewer_gender_percent || 
                 data?.viewer_age_distribution ||
                 data?.viewer_country_city_percent;
        });
      }

      private async fetchDemographicsData() {
        console.log('[TikTok Tracker] Attempting to fetch demographics data...');
        
        // Build the type_requests parameter for demographics
        const typeRequests = encodeURIComponent(JSON.stringify([
          {insigh_type: "unique_viewer", end_days: 1, days: 7},
          {insigh_type: "unique_viewer_num", range: 1},
          {insigh_type: "new_viewer_num", range: 1},
          {insigh_type: "returning_viewer", end_days: 1, days: 7},
          {insigh_type: "viewer_gender_percent", range: 1},
          {insigh_type: "viewer_age_distribution", range: 1},
          {insigh_type: "viewer_country_city_percent", range: 1}
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

    // Initialize tracker
    new TikTokAccountTracker();
  },
});