import { TikTokCommentTracker } from '@/src/trackers/TikTokCommentTracker';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  world: 'MAIN', // Run in MAIN world to intercept fetch/XHR
  runAt: 'document_start', // Run IMMEDIATELY before page scripts
  main() {
    console.log('[TikTok Tracker] Content script loaded in MAIN world on:', window.location.href);

    // ========== GLOBAL NETWORK INTERCEPTOR ==========
    // This handles ALL network interception for the entire content script
    function setupGlobalNetworkInterceptor() {
      console.log('[Global Network Interceptor] Setting up...');
      
      // Save the real original fetch
      const originalFetch = window.fetch;
      (window as any).__originalFetch = originalFetch;
      
      // Override fetch to intercept ONLY specific API calls we care about
      const interceptedFetch = async (...args: any[]) => {
        // Safely get URL - handle all edge cases
        let url = '';
        try {
          url = args[0]?.toString() || '';
        } catch (e) {
          // If we can't even get the URL, pass through unchanged
          return originalFetch(...args);
        }
        
        // ONLY intercept our specific endpoints, pass everything else through immediately
        const shouldIntercept = url.includes('/api/commit/item/digg/') || 
                               url.includes('/api/commit/follow/user') ||
                               url.includes('/api/comment/publish/');
        
        if (!shouldIntercept) {
          return originalFetch(...args);
        }
        
        // For our endpoints, get the response
        let response;
        try {
          response = await originalFetch(...args);
        } catch (e) {
          // If original fetch fails, just rethrow - don't interfere
          console.error('[Network Interceptor] Original fetch failed:', e);
          throw e;
        }
        
        // Process our interception in a try-catch to ensure we never break the original flow
        try {
          // Clone the response before reading it (responses can only be read once)
          const clonedResponse = response.clone();
          await processInterceptedResponse(url, args, clonedResponse);
        } catch (e) {
          // Log but don't break the original request
          console.error('[Network Interceptor] Error processing response:', e);
        }
        
        // ALWAYS return the original response unchanged
        return response;
      };
      
      // Helper function to process intercepted responses safely
      const processInterceptedResponse = async (url: string, args: any[], response: Response) => {
        // Log API calls for debugging
        console.log('[Network Interceptor] API Call:', url.split('?')[0]);
        
        // Process specific API endpoints
        try {
          // Check for like/unlike API (digg endpoint)
          if (url.includes('/api/commit/item/digg/')) {
            await handleLikeAPI(url, args, response);
          }
          // Check for follow/unfollow API
          else if (url.includes('/api/commit/follow/user')) {
            await handleFollowAPI(url, args, response);
          }
          // Check for comment PUBLISH API
          else if (url.includes('/api/comment/publish/')) {
            await handleCommentAPI(url, response);
          }
        } catch (e) {
          console.error('[Network Interceptor] Error in API handler:', e);
        }
      };
      
      // Handle like/unlike API
      const handleLikeAPI = async (url: string, args: any[], response: Response) => {
        console.log('[Network Interceptor] LIKE/UNLIKE API detected!');
        const urlObj = new URL(url);
        const actionType = urlObj.searchParams.get('type');
        const awemeId = urlObj.searchParams.get('aweme_id');
        console.log('[Network Interceptor] Action type:', actionType === '1' ? 'LIKE' : 'UNLIKE');
        console.log('[Network Interceptor] Video ID:', awemeId);
          
        // Only process if it's a LIKE action (type=1) and response is OK
        if (actionType === '1' && response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.error('[Network Interceptor] Failed to parse like response:', e);
            return;
          }
          console.log('[Network Interceptor] Like response:', data);
          
          // Check if like was successful
          if (data.status_code === 0) {
            console.log('[Network Interceptor] Like successful!');
            
            // Check if there's an active like tracker
            const activeLikeAction = (window as any).__activeLikeAction;
            if (activeLikeAction) {
              console.log('[Network Interceptor] ✓✓✓ LIKE VERIFIED via network!');
              
              // Send success message
              const proof = {
                actionType: 'like',
                awemeId: awemeId,
                videoUrl: window.location.href,
                timestamp: Date.now(),
                verificationMethod: 'network_api',
                apiResponse: data
              };
              
              window.postMessage({
                source: 'TIKTOK_MAIN_WORLD',
                type: 'SEND_TO_BACKGROUND',
                payload: {
                  type: 'ACTION_COMPLETED',
                  payload: {
                    actionId: activeLikeAction.actionId,
                    success: true,
                    details: proof,
                    timestamp: Date.now()
                  }
                }
              }, '*');
              
              // Clear the active action
              delete (window as any).__activeLikeAction;
            } else {
              console.log('[Network Interceptor] No active like action tracking');
            }
          } else {
            console.log('[Network Interceptor] Like failed:', data.status_msg);
          }
        }
      };
        
      // Handle follow/unfollow API
      const handleFollowAPI = async (url: string, args: any[], response: Response) => {
        console.log('[Network Interceptor] FOLLOW API detected!');
        const method = args[1]?.method || 'GET';
        console.log('[Network Interceptor] Method:', method);
        
        const urlObj = new URL(url);
        const actionType = urlObj.searchParams.get('action_type') || urlObj.searchParams.get('type');
        console.log('[Network Interceptor] Action type:', actionType === '1' ? 'FOLLOW' : 'UNFOLLOW');
        
        // Only process POST requests with action_type=1 (HEAD requests are empty)
        if (method === 'POST' && actionType === '1' && response.ok) {
          const contentType = response.headers.get('content-type');
          
          // Only process if response has JSON content
          if (contentType && contentType.includes('application/json')) {
            let data;
            try {
              data = await response.json();
            } catch (e) {
              console.error('[Network Interceptor] Failed to parse follow response:', e);
              return;
            }
            console.log('[Network Interceptor] Follow response:', data);
            
            // Check if follow was successful
            if (data.status_code === 0) {
              console.log('[Network Interceptor] Follow successful!');
              
              // Check if there's an active follow tracker
              const activeFollowAction = (window as any).__activeFollowAction;
              if (activeFollowAction) {
                console.log('[Network Interceptor] ✓✓✓ FOLLOW VERIFIED via network!');
                
                // Send success message
                const proof = {
                  actionType: 'follow',
                  profileUrl: window.location.href,
                  timestamp: Date.now(),
                  verificationMethod: 'network_api',
                  apiResponse: data
                };
                
                window.postMessage({
                  source: 'TIKTOK_MAIN_WORLD',
                  type: 'SEND_TO_BACKGROUND',
                  payload: {
                    type: 'ACTION_COMPLETED',
                    payload: {
                      actionId: activeFollowAction.actionId,
                      success: true,
                      details: proof,
                      timestamp: Date.now()
                    }
                  }
                }, '*');
                
                // Clear the active action
                delete (window as any).__activeFollowAction;
              } else {
                console.log('[Network Interceptor] No active follow action tracking');
              }
            } else {
              console.log('[Network Interceptor] Follow failed:', data.status_msg);
            }
          } else {
            console.log('[Network Interceptor] Response has no JSON content, skipping...');
          }
        }
      };
        
      // Handle comment PUBLISH API
      const handleCommentAPI = async (url: string, response: Response) => {
        console.log('[Network Interceptor] Comment PUBLISH detected!');
        console.log('[Network Interceptor] Response status:', response.status);
        
        if (!response.ok) {
          console.log('[Network Interceptor] Comment response not OK, skipping');
          return;
        }
        
        // Check content-type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.log('[Network Interceptor] Comment response is not JSON, skipping');
          return;
        }
        
        // Check content-length to avoid empty responses
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
          console.log('[Network Interceptor] Comment response is empty, skipping');
          return;
        }
        
        // Extract the comment text from URL if present
        const urlObj = new URL(url);
        const commentText = urlObj.searchParams.get('text');
        console.log('[Network Interceptor] Comment text from URL:', commentText);
        
        let data;
        try {
          const text = await response.text();
          if (!text || text.trim() === '') {
            console.log('[Network Interceptor] Empty response body, skipping');
            return;
          }
          data = JSON.parse(text);
        } catch (e) {
          console.error('[Network Interceptor] Failed to parse comment response:', e);
          return;
        }
        console.log('[Network Interceptor] Publish response:', data);
        console.log('[Network Interceptor] Response status:', data.status_code, data.status_msg);
        
        // Check if there's an active comment tracker
        const commentTracker = (window as any).__activeCommentTracker;
        if (commentTracker) {
          console.log('[Network Interceptor] Active tracker found for:', commentTracker.accountHandle);
          
          if (data.status_code === 0 && data.comment) {
            const commentUser = data.comment.user?.unique_id;
            console.log('[Network Interceptor] Comment posted by:', commentUser);
            console.log('[Network Interceptor] Tracking for:', commentTracker.accountHandle);
            
            if (commentUser === commentTracker.accountHandle) {
              console.log('[Network Interceptor] ✓✓✓ MATCH! User posted the comment we are tracking!');
              // Format it like list API for consistency
              commentTracker.processCommentResponse({ comments: [data.comment] });
            } else {
              console.log('[Network Interceptor] Different user - posted by:', commentUser, 'tracking:', commentTracker.accountHandle);
            }
          } else {
            console.log('[Network Interceptor] Comment publish failed or no comment in response');
          }
        } else {
          console.log('[Network Interceptor] No active tracker - comment posted but not tracking');
        }
      };
      
      // Set our interceptor (but allow TikTok to override it if needed)
      window.fetch = interceptedFetch;
      
      // Store processInterceptedResponse globally so the monitor can use it
      (window as any).__processInterceptedResponse = processInterceptedResponse;
      
      console.log('[Global Network Interceptor] Setup complete');
    }
    
    // Set up the global interceptor IMMEDIATELY before anything else
    setupGlobalNetworkInterceptor();
    
    // Monitor for fetch being overridden and re-apply our interceptor
    let currentFetch = window.fetch;
    setInterval(() => {
      if (window.fetch !== currentFetch) {
        console.log('[Global Network Interceptor] Fetch was overridden, re-applying interceptor...');
        const newFetch = window.fetch;
        
        // Create a new interceptor that wraps the new fetch
        window.fetch = async (...args: any[]) => {
          // Safely get URL
          let url = '';
          try {
            url = args[0]?.toString() || '';
          } catch (e) {
            return newFetch(...args);
          }
          
          // ONLY intercept our specific endpoints
          const shouldIntercept = url.includes('/api/commit/item/digg/') || 
                                 url.includes('/api/commit/follow/user') ||
                                 url.includes('/api/comment/publish/');
          
          if (!shouldIntercept) {
            return newFetch(...args);
          }
          
          // For our endpoints, get the response
          let response;
          try {
            response = await newFetch(...args);
          } catch (e) {
            console.error('[Network Interceptor] Fetch failed:', e);
            throw e;
          }
          
          // Process our interception
          try {
            const clonedResponse = response.clone();
            const processFunc = (window as any).__processInterceptedResponse;
            if (processFunc) {
              await processFunc(url, args, clonedResponse);
            }
          } catch (e) {
            console.error('[Network Interceptor] Error processing response:', e);
          }
          
          return response;
        };
        
        currentFetch = window.fetch;
        console.log('[Global Network Interceptor] Re-applied interceptor to new fetch');
      }
    }, 100); // Check every 100ms
    
    // Cache for the last comment data (in case it loads before tracker is ready)
    let lastCommentData: any = null;
    (window as any).__lastCommentData = null;
    
    // Helper function to send messages to background via bridge
    function sendToBackground(message: any) {
      window.postMessage({
        source: 'TIKTOK_MAIN_WORLD',
        type: 'SEND_TO_BACKGROUND',
        payload: message
      }, '*');
    }
    
    // Expose a function to get cached comment data
    (window as any).__getCachedCommentData = () => lastCommentData;

    class TikTokAccountTracker {
      private accountId: string | null = null;
      private handle: string | null = null;
      public isCollecting: boolean = false;
      private collectedData: any = {};
      private capturedApiCalls: any[] = [];

      constructor() {
        // Register this tracker globally
        (window as any).__tiktokAccountTracker = this;
        
        // Check URL params for auto-collection
        const urlParams = new URLSearchParams(window.location.search);
        const shouldCollect = urlParams.get('tiktok_collect');
        
        if (shouldCollect) {
          this.isCollecting = true;
          this.accountId = urlParams.get('account_id');
          this.handle = urlParams.get('handle');
          console.log('[TikTok Tracker] Auto-collecting for:', this.handle);
          
          this.setupMessageListener();
          
          // Start collection after 1 second
          setTimeout(() => this.collectTikTokData(), 1000);
        } else {
          this.setupMessageListener();
        }
      }

      private setupMessageListener() {
        // Listen for messages from the bridge script
        window.addEventListener('message', (event) => {
          if (event.source !== window) return;
          
          if (event.data && event.data.source === 'TIKTOK_BRIDGE' && event.data.type === 'FROM_BACKGROUND') {
            const message = event.data.message;
          if (message.type === 'COLLECT_TIKTOK_DATA') {
            this.accountId = message.accountId;
            this.handle = message.handle;
            this.isCollecting = true;
            const phase = message.phase || 'profile';
            console.log(`[TikTok Tracker] Starting collection for: ${this.handle} (Phase: ${phase})`);
            
            this.processCapturedApiCalls();
            this.collectTikTokData();
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
            
            }
          
            if (message.type === 'CHECK_STATUS') {
              // Send status back via postMessage
              window.postMessage({
                source: 'TIKTOK_MAIN_WORLD',
                type: 'STATUS_RESPONSE',
                payload: { 
                  isActive: true, 
                  isCollecting: this.isCollecting,
                  collectedData: this.collectedData
                }
              }, '*');
            }
          }
        });
      }

            
      public processApiResponse(url: string, data: any) {
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
            sendToBackground({
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
            sendToBackground({
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
            sendToBackground({
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
          sendToBackground({
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
          sendToBackground({
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
        sendToBackground({
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
        sendToBackground({
          type: 'TIKTOK_TRACKER_READY',
          timestamp: Date.now()
        });
      }

      private setupMessageListener() {
        // Listen for messages from the bridge script
        window.addEventListener('message', (event) => {
          if (event.source !== window) return;
          
          if (event.data && event.data.source === 'TIKTOK_BRIDGE' && event.data.type === 'FROM_BACKGROUND') {
            const message = event.data.message;
          console.log('[TikTok Action Tracker] 📨 Received message:', message);

          if (message.type === 'TRACK_ACTION') {
            console.log(`[TikTok Action Tracker] 🎬 Processing ${message.actionType} action with ID: ${message.actionId}`);
            
            // Send immediate acknowledgment to background
            sendToBackground({
              type: 'TIKTOK_ACTION_RECEIVED',
              actionId: message.actionId,
              actionType: message.actionType,
              timestamp: Date.now()
            });
            
            if (message.actionType === 'like') {
              this.trackLikeAction(message.actionId);
            } else if (message.actionType === 'follow') {
              this.trackFollowAction(message.actionId);
            } else if (message.actionType === 'comment') {
              console.log('[TikTok Action Tracker] Comment action received:', {
                actionId: message.actionId,
                accountHandle: message.accountHandle,
                targetUrl: message.targetUrl
              });
              
              // Check if we already have an active tracker
              if ((window as any).__activeCommentTracker) {
                console.log('[TikTok Action Tracker] Comment tracker already active, ignoring duplicate');
                return;
              }
              
              // Pass account handle to the tracker
              const commentTracker = new TikTokCommentTracker(message.actionId, message.accountHandle);
              commentTracker.start();
            } else {
              console.log(`[TikTok Action Tracker] Unknown action type: ${message.actionType}`);
            }
          }

            if (message.type === 'CHECK_STATUS') {
              // Send status back via postMessage
              window.postMessage({
                source: 'TIKTOK_MAIN_WORLD',
                type: 'STATUS_RESPONSE',
                payload: { 
                  isActive: true, 
                  pendingActions: Array.from(this.pendingActions.keys()) 
                }
              }, '*');
            }
          }
        });
      }

      // ============ LIKE ACTION TRACKING ============
      private trackLikeAction(actionId: string) {
        console.log('[TikTok Like Tracker] Starting NETWORK-BASED like tracking for:', actionId);
        
        // Check if we're already tracking a like action
        if ((window as any).__activeLikeAction) {
          console.log('[TikTok Like Tracker] Already tracking a like action, ignoring duplicate');
          return;
        }
        
        // Store the action globally for the network interceptor
        (window as any).__activeLikeAction = {
          actionId: actionId,
          startTime: Date.now()
        };
        
        console.log('[TikTok Like Tracker] Waiting for user to like the video...');
        console.log('[TikTok Like Tracker] Network interceptor will catch the /api/commit/item/digg/ call');
        
        // Set timeout (30 seconds)
        setTimeout(() => {
          if ((window as any).__activeLikeAction?.actionId === actionId) {
            console.log('[TikTok Like Tracker] Timeout - no like detected');
            
            sendToBackground({
              type: 'ACTION_COMPLETED',
              payload: {
                actionId: actionId,
                success: false,
                details: {
                  error: 'Timeout: User did not like the video within 30 seconds',
                  timestamp: Date.now()
                }
              }
            });
            
            delete (window as any).__activeLikeAction;
          }
        }, 30000);
      }

      // ============ FOLLOW ACTION TRACKING ============
      private trackFollowAction(actionId: string) {
        console.log('[TikTok Follow Tracker] Starting NETWORK-BASED follow tracking for:', actionId);
        
        // Check if we're already tracking a follow action
        if ((window as any).__activeFollowAction) {
          console.log('[TikTok Follow Tracker] Already tracking a follow action, ignoring duplicate');
          return;
        }
        
        // Store the action globally for the network interceptor
        (window as any).__activeFollowAction = {
          actionId: actionId,
          startTime: Date.now()
        };
        
        console.log('[TikTok Follow Tracker] Waiting for user to follow the account...');
        console.log('[TikTok Follow Tracker] Network interceptor will catch the /api/commit/follow/user/ call');
        
        // Set timeout (30 seconds)
        setTimeout(() => {
          if ((window as any).__activeFollowAction?.actionId === actionId) {
            console.log('[TikTok Follow Tracker] Timeout - no follow detected');
            
            sendToBackground({
              type: 'ACTION_COMPLETED',
              payload: {
                actionId: actionId,
                success: false,
                details: {
                  error: 'Timeout: User did not follow the account within 30 seconds',
                  timestamp: Date.now()
                }
              }
            });
            
            delete (window as any).__activeFollowAction;
          }
        }, 30000);
      }


      // ============ COMMON METHODS ============
      private reportActionResult(actionId: string, success: boolean, details: any) {
        console.log('[TikTok Action Tracker] 📤 Reporting result:', {
          actionId,
          success,
          details
        });
        
        sendToBackground({
          type: 'ACTION_COMPLETED',
          payload: {
            actionId,
            success,
            details,
            timestamp: Date.now()
          }
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