export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  main() {
    console.log('====================================');
    console.log('[TikTok Tracker] 🚀🚀🚀 CONTENT SCRIPT LOADED! 🚀🚀🚀');
    console.log('[TikTok Tracker] 📍 URL:', window.location.href);
    console.log('[TikTok Tracker] 📄 Page State:', document.readyState);
    console.log('[TikTok Tracker] ⏰ Time:', new Date().toISOString());
    console.log('[TikTok Tracker] 🍪 Cookies available:', document.cookie ? 'YES' : 'NO');
    console.log('[TikTok Tracker] 📊 Window objects:', {
      SIGI_STATE: typeof (window as any).SIGI_STATE !== 'undefined',
      __NEXT_DATA__: typeof (window as any).__NEXT_DATA__ !== 'undefined',
      __UNIVERSAL_DATA_FOR_REHYDRATION__: typeof (window as any).__UNIVERSAL_DATA_FOR_REHYDRATION__ !== 'undefined'
    });
    console.log('====================================');

    class TikTokAccountTracker {
      private collectedData: any = {};
      private isCollecting: boolean = false;
      private accountId: string | null = null;
      private handle: string | null = null;
      private capturedApiCalls: any[] = []; // Store ALL API calls

      constructor() {
        console.log('[TikTok Tracker] 🏗️ INITIALIZING TRACKER...');
        
        // Check URL params for collection flag
        const urlParams = new URLSearchParams(window.location.search);
        console.log('[TikTok Tracker] 🔍 URL Params:', Array.from(urlParams.entries()));
        
        const shouldCollect = urlParams.get('tiktok_collect');
        if (shouldCollect) {
          this.isCollecting = true;
          this.accountId = urlParams.get('account_id') || null;
          this.handle = urlParams.get('handle') || null;
          console.log('[TikTok Tracker] 🟢🟢🟢 AUTO-COLLECTING MODE ACTIVATED! 🟢🟢🟢');
          console.log('[TikTok Tracker] 📝 Account ID:', this.accountId);
          console.log('[TikTok Tracker] 📝 Handle:', this.handle);
        } else {
          console.log('[TikTok Tracker] ⏸️ NOT auto-collecting (no URL param)');
        }
        
        this.setupMessageListener();
        this.setupNetworkInterceptor();
        console.log('[TikTok Tracker] ✅ TRACKER INITIALIZED!');
        console.log('[TikTok Tracker] 📊 Collection mode:', this.isCollecting ? 'ACTIVE' : 'WAITING');
        
        // If we're collecting from the start, begin collection
        if (this.isCollecting) {
          console.log('[TikTok Tracker] ⏰ Starting collection in 1 second...');
          setTimeout(() => {
            console.log('[TikTok Tracker] 🚀 STARTING COLLECTION NOW!');
            this.collectTikTokData();
          }, 1000);
        }
      }

      private setupMessageListener() {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('[TikTok Tracker] 📨 Received message:', message);

          if (message.type === 'COLLECT_TIKTOK_DATA') {
            this.accountId = message.accountId;
            this.handle = message.handle;
            this.isCollecting = true;
            console.log('[TikTok Tracker] Starting data collection for:', this.handle);
            console.log('[TikTok Tracker] 📊 We have', this.capturedApiCalls.length, 'stored API calls to process!');
            
            // Process any API calls we captured before collection started
            this.processCapturedApiCalls();
            
            // Start collecting data
            this.collectTikTokData();
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
        console.log('[TikTok Tracker] 🕸️ SETTING UP NETWORK INTERCEPTOR...');
        
        // Intercept fetch requests to capture API responses
        const originalFetch = window.fetch;
        let fetchCallCount = 0;
        
        window.fetch = async (...args) => {
          fetchCallCount++;
          const url = args[0].toString();
          
          // Log EVERY fetch call initially
          if (fetchCallCount <= 20) { // First 20 calls
            console.log(`[TikTok Tracker] 🌐 Fetch #${fetchCallCount}:`, url.substring(0, 100));
          }
          
          const response = await originalFetch(...args);
          
          // ALWAYS LOG TikTok API calls regardless of collection state
          // More specific patterns for TikTok APIs
          if (url.includes('tiktok.com') || 
              url.includes('/tiktokstudio/') || 
              url.includes('/api/web/') || 
              url.includes('/api/common') ||
              url.includes('/node-webapp/') ||
              url.includes('/creator/manage/') ||
              url.includes('/api/v1/') ||
              url.includes('analytics') ||
              url.includes('relation') ||
              url.includes('counter')) {
            console.log('[TikTok Tracker] 🎯🎯🎯 TIKTOK API DETECTED:', url);
            
            // Clone and store the response
            const clonedResponse = response.clone();
            try {
              const data = await clonedResponse.json();
              console.log('[TikTok Tracker] 📊 API Response Data:', data);
              
              const apiCall = {
                url: url,
                timestamp: Date.now(),
                data: data
              };
              this.capturedApiCalls.push(apiCall);
              console.log(`[TikTok Tracker] 📦 STORED API CALL #${this.capturedApiCalls.length}:`, {
                url: url.substring(0, 100),
                hasData: !!data,
                dataKeys: data ? Object.keys(data) : []
              });
              
              // Process immediately if we're collecting
              if (this.isCollecting) {
                console.log('[TikTok Tracker] 🔄 Processing API response NOW...');
                this.processApiResponse(url, data);
              }
            } catch (e) {
              console.log('[TikTok Tracker] ⚠️ Not JSON response for:', url.substring(0, 50));
            }
          }
          
          if (this.isCollecting && url.includes('tiktok')) {
            console.log('[TikTok Tracker] 🟢 COLLECTING - Processing:', url);
            
            // Clone response to read it without consuming
            const clonedResponse = response.clone();
            
            try {
              // Check for TikTok Studio API endpoints
              if (url.includes('/tiktokstudio/api') || url.includes('/studio/api')) {
                console.log('[TikTok Tracker] 🎯 Studio API found:', url);
                const data = await clonedResponse.json();
                console.log('[TikTok Tracker] 📦 Studio API Response:', data);
                this.processApiResponse(url, data);
              }
              
              // Check for user profile data
              if (url.includes('/api/user/detail') || url.includes('/web/user') || url.includes('/api/v1/user')) {
                console.log('[TikTok Tracker] 👤 User API found:', url);
                const data = await clonedResponse.json();
                console.log('[TikTok Tracker] 📦 User Data:', data);
                this.processUserData(data);
              }
              
              // Check for analytics/insights endpoints
              if (url.includes('/analytics') || url.includes('/creator/analytics') || url.includes('/insights')) {
                console.log('[TikTok Tracker] 📊 Analytics API found:', url);
                const data = await clonedResponse.json();
                console.log('[TikTok Tracker] 📦 Analytics Data:', data);
                this.processAnalyticsData(data);
              }
              
              // Check for audience demographics
              if (url.includes('/audience') || url.includes('/demographics') || url.includes('/followers')) {
                console.log('[TikTok Tracker] 👥 Audience API found:', url);
                const data = await clonedResponse.json();
                console.log('[TikTok Tracker] 📦 Audience Data:', data);
                this.processAudienceData(data);
              }
              
              // Check for content/video data
              if (url.includes('/video') || url.includes('/content') || url.includes('/item')) {
                console.log('[TikTok Tracker] 🎬 Content API found:', url);
                const data = await clonedResponse.json();
                console.log('[TikTok Tracker] 📦 Content Data:', data);
                this.processContentData(data);
              }
            } catch (e) {
              // Not JSON or error parsing
            }
          }
          
          return response;
        };

        // Also intercept XHR requests
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const self = this; // Capture the tracker instance
        
        XMLHttpRequest.prototype.open = function(...args: any) {
          this._url = args[1];
          return originalXHROpen.apply(this, args as any);
        };
        
        XMLHttpRequest.prototype.send = function(...args: any) {
          const xhrUrl = this._url;
          
          // Log all XHR requests to TikTok APIs
          if (xhrUrl && (xhrUrl.includes('tiktok') || xhrUrl.includes('/api/'))) {
            console.log('[TikTok Tracker] 🌐 XHR Request:', xhrUrl);
            
            this.addEventListener('load', function() {
              try {
                if (this.responseText) {
                  const data = JSON.parse(this.responseText);
                  console.log('[TikTok Tracker] 📊 XHR Response:', data);
                  
                  // Store the API call
                  const apiCall = {
                    url: xhrUrl,
                    timestamp: Date.now(),
                    data: data
                  };
                  self.capturedApiCalls.push(apiCall);
                  
                  // Process if collecting
                  if (self.isCollecting) {
                    console.log('[TikTok Tracker] 🔄 Processing XHR response NOW...');
                    self.processApiResponse(xhrUrl, data);
                  }
                }
              } catch (e) {
                // Not JSON response, ignore
              }
            });
          }
          return originalXHRSend.apply(this, args as any);
        };
      }

      private processCapturedApiCalls() {
        console.log('[TikTok Tracker] 🔄 Processing', this.capturedApiCalls.length, 'captured API calls...');
        
        this.capturedApiCalls.forEach((call, index) => {
          console.log(`[TikTok Tracker] Processing call ${index + 1}:`, call.url);
          this.processApiResponse(call.url, call.data);
        });
        
        console.log('[TikTok Tracker] ✅ Finished processing captured calls');
      }
      
      private async collectTikTokData() {
        console.log('=========================================');
        console.log('[TikTok Tracker] 🔥🔥🔥 STARTING DATA COLLECTION 🔥🔥🔥');
        console.log('[TikTok Tracker] 📍 Current URL:', window.location.href);
        console.log('[TikTok Tracker] 📍 Pathname:', window.location.pathname);
        console.log('[TikTok Tracker] 📍 Is Studio?:', window.location.pathname.includes('studio'));
        console.log('[TikTok Tracker] 📦 Already captured API calls:', this.capturedApiCalls.length);
        console.log('[TikTok Tracker] 📊 Current collected data:', this.collectedData);
        console.log('=========================================');
        
        // 1. Try to extract data from the page state
        console.log('[TikTok Tracker] === STAGE 1: Extracting Page State ===');
        this.extractPageState();
        
        // 2. Try to extract from DOM
        console.log('[TikTok Tracker] === STAGE 2: Extracting DOM Data ===');
        this.extractDOMData();
        
        // 3. Navigate to TikTok Studio if needed
        if (window.location.hostname === 'www.tiktok.com' && !window.location.pathname.includes('studio')) {
          console.log('[TikTok Tracker] 🔄 Need Studio data - requesting navigation...');
          // We'll let the background script handle navigation
          this.requestStudioNavigation();
        } else if (window.location.pathname.includes('studio')) {
          console.log('[TikTok Tracker] ✅ Already in Studio - extracting analytics...');
          this.extractStudioData();
          // Also try to fetch data directly from APIs
          this.fetchStudioData();
        }
        
        // 4. Set up periodic check for data completeness
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          console.log(`[TikTok Tracker] ⏱️ Check #${checkCount} - Current data:`, {
            hasProfile: !!(this.collectedData.profile || this.collectedData.user),
            hasStats: !!(this.collectedData.stats || this.collectedData.followerCountDOM),
            hasAnalytics: !!this.collectedData.analytics,
            hasAudience: !!this.collectedData.audience,
            dataKeys: Object.keys(this.collectedData)
          });
          
          if (this.hasRequiredData()) {
            clearInterval(checkInterval);
            this.sendDataToBackground();
          }
        }, 2000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          console.log('[TikTok Tracker] ⏰ Timeout reached - sending whatever data we have');
          clearInterval(checkInterval);
          this.sendDataToBackground();
        }, 30000);
      }

      private extractPageState() {
        console.log('[TikTok Tracker] 📊 Extracting page state data...');
        
        // TikTok often stores data in window objects
        const possibleDataSources = [
          'SIGI_STATE',
          'SIGI_RETRY',
          '__NEXT_DATA__',
          '__UNIVERSAL_DATA_FOR_REHYDRATION__',
          'webpackChunkwebapp_studio',
          '__INIT_DATA__',
          '__DEFAULT_SCOPE__',
          'WEBAPP_STATE',
          '__STUDIO_DATA__'
        ];
        
        console.log('[TikTok Tracker] 🔍 Checking window objects...');
        possibleDataSources.forEach(source => {
          if ((window as any)[source]) {
            console.log(`[TikTok Tracker] ✅ Found ${source}:`, (window as any)[source]);
            this.processWindowData(source, (window as any)[source]);
          } else {
            console.log(`[TikTok Tracker] ❌ ${source} not found`);
          }
        });
        
        // Also check for any window properties containing 'tiktok' or 'studio'
        Object.keys(window).forEach(key => {
          if (key.toLowerCase().includes('tiktok') || key.toLowerCase().includes('studio')) {
            console.log(`[TikTok Tracker] 🎯 Found window.${key}:`, (window as any)[key]);
          }
        });
      }

      private processWindowData(source: string, data: any) {
        try {
          if (source === 'SIGI_STATE' && data) {
            // Extract user info from SIGI_STATE
            if (data.UserModule) {
              const users = data.UserModule.users;
              const currentUser = Object.values(users)[0] as any;
              if (currentUser) {
                this.collectedData.profile = {
                  userId: currentUser.id,
                  uniqueId: currentUser.uniqueId,
                  nickname: currentUser.nickname,
                  avatar: currentUser.avatarLarger || currentUser.avatarMedium,
                  verified: currentUser.verified,
                  followerCount: currentUser.stats?.followerCount,
                  followingCount: currentUser.stats?.followingCount,
                  heartCount: currentUser.stats?.heartCount,
                  videoCount: currentUser.stats?.videoCount,
                  bio: currentUser.signature
                };
              }
            }
            
            // Extract video stats
            if (data.ItemModule) {
              const videos = Object.values(data.ItemModule) as any[];
              const videoStats = videos.map(v => ({
                id: v.id,
                views: v.stats?.playCount,
                likes: v.stats?.diggCount,
                comments: v.stats?.commentCount,
                shares: v.stats?.shareCount
              }));
              
              this.collectedData.videoStats = videoStats;
            }
          }
          
          if (source === '__NEXT_DATA__' && data) {
            // Extract from Next.js data
            const props = data.props?.pageProps;
            if (props) {
              if (props.userDetail) {
                this.collectedData.userDetail = props.userDetail;
              }
              if (props.userData) {
                this.collectedData.userData = props.userData;
              }
            }
          }
        } catch (e) {
          console.error(`[TikTok Tracker] Error processing ${source}:`, e);
        }
      }

      private extractStudioData() {
        console.log('[TikTok Tracker] 🎬 Extracting TikTok Studio specific data...');
        
        // Try to find Studio-specific elements
        const studioSelectors = {
          totalViews: '[data-e2e="studio-total-views"]',
          totalLikes: '[data-e2e="studio-total-likes"]',
          totalComments: '[data-e2e="studio-total-comments"]',
          totalShares: '[data-e2e="studio-total-shares"]',
          avgWatchTime: '[data-e2e="studio-avg-watch-time"]',
          engagementRate: '[data-e2e="studio-engagement-rate"]',
          // Analytics cards
          analyticsCard: '.analytics-card',
          metricCard: '.metric-card',
          // Try common class patterns
          statsContainer: '[class*="stats"], [class*="metrics"], [class*="analytics"]'
        };
        
        Object.entries(studioSelectors).forEach(([key, selector]) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`[TikTok Tracker] 📊 Found Studio ${key}:`, elements.length, 'elements');
            elements.forEach(el => {
              console.log(`  - Content: ${el.textContent?.trim()}`);
            });
          }
        });
        
        // Try to extract from any script tags containing analytics data
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.textContent && (script.textContent.includes('analytics') || script.textContent.includes('insights'))) {
            console.log('[TikTok Tracker] 📜 Found script with analytics keywords');
            try {
              // Try to extract JSON data from script
              const jsonMatch = script.textContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.analytics || data.insights || data.metrics) {
                  console.log('[TikTok Tracker] 📊 Extracted analytics from script:', data);
                  this.collectedData.scriptAnalytics = data;
                }
              }
            } catch (e) {
              // Not valid JSON
            }
          }
        });
      }
      
      private extractDOMData() {
        console.log('[TikTok Tracker] 🔍 Extracting DOM data...');
        
        // Extract follower count from DOM
        const followerElement = document.querySelector('[data-e2e="followers-count"]');
        if (followerElement) {
          const count = this.parseCount(followerElement.textContent || '');
          console.log(`[TikTok Tracker] 👥 Followers: ${followerElement.textContent} → ${count}`);
          this.collectedData.followerCountDOM = count;
        } else {
          console.log('[TikTok Tracker] ❌ Followers element not found');
        }
        
        // Extract following count
        const followingElement = document.querySelector('[data-e2e="following-count"]');
        if (followingElement) {
          const count = this.parseCount(followingElement.textContent || '');
          console.log(`[TikTok Tracker] 👤 Following: ${followingElement.textContent} → ${count}`);
          this.collectedData.followingCountDOM = count;
        } else {
          console.log('[TikTok Tracker] ❌ Following element not found');
        }
        
        // Extract likes count
        const likesElement = document.querySelector('[data-e2e="likes-count"]');
        if (likesElement) {
          const count = this.parseCount(likesElement.textContent || '');
          console.log(`[TikTok Tracker] ❤️ Likes: ${likesElement.textContent} → ${count}`);
          this.collectedData.likesCountDOM = count;
        } else {
          console.log('[TikTok Tracker] ❌ Likes element not found');
        }
        
        // Extract username and display name
        const usernameElement = document.querySelector('[data-e2e="user-subtitle"]');
        if (usernameElement) {
          const username = usernameElement.textContent?.replace('@', '').trim();
          console.log(`[TikTok Tracker] 📛 Username: ${username}`);
          this.collectedData.usernameDOM = username;
        } else {
          console.log('[TikTok Tracker] ❌ Username element not found');
        }
        
        const displayNameElement = document.querySelector('[data-e2e="user-title"]');
        if (displayNameElement) {
          const displayName = displayNameElement.textContent?.trim();
          console.log(`[TikTok Tracker] 🏷️ Display Name: ${displayName}`);
          this.collectedData.displayNameDOM = displayName;
        } else {
          console.log('[TikTok Tracker] ❌ Display name element not found');
        }
        
        // Extract bio
        const bioElement = document.querySelector('[data-e2e="user-bio"]');
        if (bioElement) {
          const bio = bioElement.textContent?.trim();
          console.log(`[TikTok Tracker] 📝 Bio: ${bio?.substring(0, 50)}...`);
          this.collectedData.bioDOM = bio;
        } else {
          console.log('[TikTok Tracker] ❌ Bio element not found');
        }
        
        // Extract verification badge
        const verifiedBadge = document.querySelector('[data-e2e="user-verification"]');
        this.collectedData.isVerifiedDOM = !!verifiedBadge;
        console.log(`[TikTok Tracker] ✅ Verified: ${!!verifiedBadge}`);
        
        // Try alternative selectors if standard ones don't work
        console.log('[TikTok Tracker] 🔍 Trying alternative selectors...');
        
        // Look for any elements containing numbers that might be stats
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
          const text = span.textContent?.trim() || '';
          if (text.match(/^\d+([KMB])?$/) || text.match(/^\d+\.\d+([KMB])?$/)) {
            const parent = span.parentElement;
            const context = parent?.textContent?.toLowerCase() || '';
            if (context.includes('follower') || context.includes('follow')) {
              console.log(`[TikTok Tracker] 🎯 Potential follower count found: ${text}`);
            }
            if (context.includes('like') || context.includes('heart')) {
              console.log(`[TikTok Tracker] 🎯 Potential likes count found: ${text}`);
            }
          }
        });
      }

      private parseCount(text: string): number {
        text = text.trim().toUpperCase();
        
        if (text.includes('K')) {
          return Math.round(parseFloat(text.replace('K', '')) * 1000);
        }
        if (text.includes('M')) {
          return Math.round(parseFloat(text.replace('M', '')) * 1000000);
        }
        if (text.includes('B')) {
          return Math.round(parseFloat(text.replace('B', '')) * 1000000000);
        }
        
        return parseInt(text.replace(/,/g, ''), 10) || 0;
      }

      private processApiResponse(url: string, data: any) {
        console.log('[TikTok Tracker] 🎯 Processing API response from:', url);
        console.log('[TikTok Tracker] 📦 Full Response Data:', data);
        
        // Extract based on specific TikTok Studio endpoints
        
        // NEW: Process /api/web/user endpoint (contains userId, verified status, etc.)
        if (url.includes('/api/web/user') || url.includes('/tiktokstudio/api/web/user')) {
          console.log('[TikTok Tracker] 🔥🔥🔥 USER PROFILE ENDPOINT HIT!');
          if (data.userId) {
            this.collectedData.userProfile = {
              userId: data.userId,
              isVerified: data.userExtra?.isVerified || false,
              isPrivate: data.userExtra?.isPrivate || false,
              profileBio: data.userExtra?.profileBio || '',
              ttCsrfToken: data['tt-csrf-token'],
              statusCode: data.statusCode
            };
          }
          if (data.userBaseInfo?.UserProfile?.UserBase) {
            const userBase = data.userBaseInfo.UserProfile.UserBase;
            this.collectedData.userBase = {
              id: userBase.Id,
              secUid: userBase.SecUid,
              uniqueId: userBase.UniqId,
              nickName: userBase.NickName,
              createTime: userBase.CreateTime,
              modifyTime: userBase.ModifyTime,
              region: userBase.Region?.Region,
              language: userBase.Language?.Language,
              locale: userBase.Language?.Locale,
              avatarUri: userBase.Avatars?.[0]?.UrlInfo?.UrlList?.[0]
            };
          }
        }
        
        // NEW: Process common-app-context endpoint
        if (url.includes('/api/common-app-context') || url.includes('/node-webapp/api/common-app-context')) {
          console.log('[TikTok Tracker] 🌟🌟🌟 COMMON APP CONTEXT ENDPOINT HIT!');
          if (data.user) {
            this.collectedData.appContext = {
              uid: data.user.uid,
              secUid: data.user.secUid,
              nickName: data.user.nickName,
              uniqueId: data.user.uniqueId,
              signature: data.user.signature,
              avatarUri: data.user.avatarUri?.[0],
              isPrivateAccount: data.user.isPrivateAccount,
              region: data.user.region,
              language: data.language,
              appId: data.appId,
              analyticsOn: data.user.analyticsOn,
              proAccountInfo: data.user.proAccountInfo
            };
          }
        }
        
        // NEW: Process relation count endpoint
        if (url.includes('/api/web/relation/multiGetFollowRelationCount') || url.includes('multiGetFollowRelationCount')) {
          console.log('[TikTok Tracker] 💯💯💯 RELATION COUNT ENDPOINT HIT!');
          if (data.FollowerCount && data.FollowingCount) {
            const userId = Object.keys(data.FollowerCount)[0];
            this.collectedData.relationCounts = {
              followers: parseInt(data.FollowerCount[userId] || '0'),
              following: parseInt(data.FollowingCount[userId] || '0'),
              friends: parseInt(data.FriendCount?.[userId] || '0')
            };
          } else if (data.BaseResp?.StatusCode === 0) {
            // Sometimes the data is nested differently
            console.log('[TikTok Tracker] Relation data structure:', data);
          }
        }
        
        // NEW: Process hash count endpoint (likes, posts, etc.)
        if (url.includes('/api/web/counter/getHashCount') || url.includes('getHashCount')) {
          console.log('[TikTok Tracker] 🎯🎯🎯 HASH COUNT ENDPOINT HIT!');
          if (data.CountData) {
            const userId = Object.keys(data.CountData)[0];
            const counts = data.CountData[userId];
            this.collectedData.hashCounts = {
              totalLikes: parseInt(counts.repined_count || '0'),
              totalPosts: parseInt(counts.item_count || counts.total_item_count || '0'),
              profileViews: parseInt(counts.unread_visitor_count_v2 || '0'),
              itemRepinCount: parseInt(counts.item_repin_count || '0')
            };
          } else if (data.NameSpace === 'aweme_user_stats') {
            // Alternative data structure
            console.log('[TikTok Tracker] Hash count data structure:', data);
          }
        }
        
        // NEW: Process item list endpoint (video/post details)
        if (url.includes('/creator/manage/item_list')) {
          console.log('[TikTok Tracker] 🎬🎬🎬 ITEM LIST ENDPOINT HIT!');
          if (data.item_list) {
            this.collectedData.itemList = data.item_list.map((item: any) => ({
              itemId: item.item_id,
              description: item.desc,
              createTime: item.create_time,
              duration: item.duration,
              playCount: parseInt(item.play_count || '0'),
              likeCount: parseInt(item.like_count || '0'),
              commentCount: parseInt(item.comment_count || '0'),
              shareCount: parseInt(item.share_count || '0'),
              favoriteCount: parseInt(item.favorite_count || '0'),
              coverUrl: item.cover_url?.[0],
              visibility: item.visibility,
              isPinned: item.is_pinned,
              itemType: item.item_type // 1 = video, 2 = photo
            }));
          }
        }
        
        // 1. Analytics Overview
        if (url.includes('/tiktokstudio/api/analytics')) {
          console.log('[TikTok Tracker] 📊 ANALYTICS ENDPOINT HIT!');
          this.collectedData.analyticsAPI = data;
          if (data.overview_metrics) {
            this.collectedData.analytics = {
              ...this.collectedData.analytics,
              videoViews: data.overview_metrics.video_views,
              profileViews: data.overview_metrics.profile_views,
              likes: data.overview_metrics.likes,
              comments: data.overview_metrics.comments,
              shares: data.overview_metrics.shares
            };
          }
        }
        
        // 2. Audience Demographics
        if (url.includes('/tiktokstudio/api/audience')) {
          console.log('[TikTok Tracker] 👥 AUDIENCE ENDPOINT HIT!');
          this.collectedData.audienceAPI = data;
          if (data.demographics) {
            this.collectedData.audience = {
              ...this.collectedData.audience,
              ageDistribution: data.demographics.age_groups,
              genderSplit: data.demographics.gender_distribution,
              topLocations: data.demographics.geo_distribution
            };
          }
        }
        
        // 3. Performance Metrics
        if (url.includes('/tiktokstudio/api/performance')) {
          console.log('[TikTok Tracker] 🚀 PERFORMANCE ENDPOINT HIT!');
          this.collectedData.performanceAPI = data;
          if (data.metrics) {
            this.collectedData.analytics = {
              ...this.collectedData.analytics,
              engagementRate: data.metrics.engagement_rate,
              avgWatchTime: data.metrics.average_watch_time,
              completionRate: data.metrics.completion_rate
            };
          }
        }
        
        // 4. Insights
        if (url.includes('/tiktokstudio/api/insights')) {
          console.log('[TikTok Tracker] 💡 INSIGHTS ENDPOINT HIT!');
          this.collectedData.insightsAPI = data;
        }
        
        // 5. Creator Dashboard
        if (url.includes('/tiktokstudio/api/dashboard')) {
          console.log('[TikTok Tracker] 📈 DASHBOARD ENDPOINT HIT!');
          this.collectedData.dashboardAPI = data;
        }
        
        // 6. Videos/Content
        if (url.includes('/tiktokstudio/api/videos') || url.includes('/tiktokstudio/api/content')) {
          console.log('[TikTok Tracker] 🎬 CONTENT ENDPOINT HIT!');
          this.processContentData(data);
        }
        
        // 7. User Profile from Studio
        if (url.includes('/tiktokstudio/api/web/user')) {
          console.log('[TikTok Tracker] 👤 STUDIO USER ENDPOINT HIT!');
          this.processUserData(data);
        }
        
        // 8. Relation/Follower data
        if (url.includes('/tiktokstudio/api/web/relation')) {
          console.log('[TikTok Tracker] 🔗 RELATION ENDPOINT HIT!');
          if (data.data) {
            this.collectedData.relationData = {
              followerCount: data.data.followerCount,
              followingCount: data.data.followingCount,
              mutualFollowerCount: data.data.mutualFollowerCount
            };
          }
        }
        
        // Generic fallbacks for other endpoints
        if (url.includes('/api/user')) {
          this.processUserData(data);
        }
        if (url.includes('/api/analytics')) {
          this.processAnalyticsData(data);
        }
      }

      private processUserData(data: any) {
        if (!data) return;
        
        console.log('[TikTok Tracker] Processing user data:', data);
        
        // Handle different response structures
        if (data.userInfo || data.user || data.userData) {
          const user = data.userInfo || data.user || data.userData;
          
          this.collectedData.user = {
            id: user.id || user.userId,
            uniqueId: user.uniqueId || user.username,
            nickname: user.nickname || user.displayName,
            avatar: user.avatarLarger || user.avatar,
            verified: user.verified || false,
            isPrivate: user.privateAccount || user.isPrivate || false,
            bio: user.signature || user.bio,
            region: user.region,
            language: user.language,
            createTime: user.createTime,
            followers: user.followerCount || user.fans,
            following: user.followingCount || user.following,
            likes: user.heartCount || user.heart || user.likes,
            videos: user.videoCount || user.videos
          };
        }
        
        // Handle stats separately if provided
        if (data.stats) {
          this.collectedData.stats = data.stats;
        }
      }

      private processAnalyticsData(data: any) {
        if (!data) return;
        
        console.log('[TikTok Tracker] Processing analytics data:', data);
        
        this.collectedData.analytics = {
          overview: data.overview || {},
          performance: data.performance || {},
          trends: data.trends || {},
          videoViews: data.videoViews || data.views,
          profileViews: data.profileViews,
          shares: data.shares,
          comments: data.comments,
          engagementRate: data.engagementRate,
          avgWatchTime: data.avgWatchTime,
          completionRate: data.completionRate
        };
      }

      private processAudienceData(data: any) {
        if (!data) return;
        
        console.log('[TikTok Tracker] Processing audience data:', data);
        
        this.collectedData.audience = {
          demographics: {
            gender: data.gender || data.genderDistribution || {},
            age: data.age || data.ageDistribution || {},
            location: data.location || data.topCountries || data.topCities || {}
          },
          viewerTypes: data.viewerTypes || {},
          activeTimes: data.activeTimes || data.peakHours || {},
          interests: data.interests || [],
          devices: data.devices || {}
        };
      }

      private processContentData(data: any) {
        if (!data) return;
        
        console.log('[TikTok Tracker] Processing content data:', data);
        
        if (data.videos || data.items) {
          const videos = data.videos || data.items || [];
          this.collectedData.topContent = videos.slice(0, 10).map((v: any) => ({
            id: v.id,
            desc: v.desc,
            createTime: v.createTime,
            stats: {
              views: v.stats?.playCount || v.playCount,
              likes: v.stats?.diggCount || v.diggCount,
              comments: v.stats?.commentCount || v.commentCount,
              shares: v.stats?.shareCount || v.shareCount
            },
            duration: v.duration,
            hashtags: v.challenges || v.hashtags
          }));
        }
      }

      private hasRequiredData(): boolean {
        // Check if we have minimum required data
        const hasProfile = !!(this.collectedData.profile || this.collectedData.user);
        const hasStats = !!(this.collectedData.stats || 
                          this.collectedData.followerCountDOM || 
                          this.collectedData.profile?.followerCount);
        
        console.log('[TikTok Tracker] Data completeness check:', {
          hasProfile,
          hasStats,
          dataKeys: Object.keys(this.collectedData)
        });
        
        return hasProfile && hasStats;
      }

      private async fetchStudioData() {
        console.log('[TikTok Tracker] 🔄 Attempting to fetch Studio data directly...');
        
        // Get authentication cookies
        const cookies = {
          sessionid: document.cookie.match(/sessionid=([^;]+)/)?.[1],
          tt_csrf_token: document.cookie.match(/tt_csrf_token=([^;]+)/)?.[1],
          msToken: document.cookie.match(/msToken=([^;]+)/)?.[1]
        };
        
        console.log('[TikTok Tracker] 🍪 Cookies found:', {
          hasSessionId: !!cookies.sessionid,
          hasCsrfToken: !!cookies.tt_csrf_token,
          hasMsToken: !!cookies.msToken
        });
        
        // Common parameters for TikTok API calls
        const commonParams = new URLSearchParams({
          aid: '1988',
          app_name: 'tiktok_creator_center',
          device_platform: 'web_pc',
          channel: 'tiktok_web',
          locale: 'en',
          priority_region: 'US',
          region: 'US',
          msToken: cookies.msToken || ''
        });
        
        // 1. Try to fetch main user data
        try {
          console.log('[TikTok Tracker] Fetching /api/web/user...');
          const userResponse = await fetch(`/tiktokstudio/api/web/user?needIsVerified=true&needProfileBio=true`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json,*/*;q=0.8',
              'Referer': window.location.href
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('[TikTok Tracker] 📊 Studio user data fetched:', userData);
            this.processApiResponse('/api/web/user', userData);
          }
        } catch (e) {
          console.log('[TikTok Tracker] ❌ Failed to fetch user data:', e);
        }
        
        // 2. Try to fetch common app context
        try {
          console.log('[TikTok Tracker] Fetching common-app-context...');
          const contextResponse = await fetch(`/node-webapp/api/common-app-context?${commonParams}`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Referer': window.location.href
            }
          });
          
          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            console.log('[TikTok Tracker] 📊 App context fetched:', contextData);
            this.processApiResponse('/api/common-app-context', contextData);
          }
        } catch (e) {
          console.log('[TikTok Tracker] ❌ Failed to fetch app context:', e);
        }
        
        // 3. Wait a bit for user data to be available, then fetch relation counts
        setTimeout(async () => {
          // Get userId from collected data
          const userId = this.collectedData.userProfile?.userId || 
                        this.collectedData.userBase?.id || 
                        this.collectedData.appContext?.uid;
          
          if (userId) {
            console.log('[TikTok Tracker] Found userId:', userId);
            
            // Fetch relation counts
            try {
              console.log('[TikTok Tracker] Fetching relation counts...');
              const relationUrl = `/tiktokstudio/api/web/relation/multiGetFollowRelationCount?userId=${userId}&${commonParams}`;
              const relationResponse = await fetch(relationUrl, {
                credentials: 'include',
                headers: {
                  'Accept': 'application/json,*/*;q=0.8',
                  'Referer': window.location.href
                }
              });
              
              if (relationResponse.ok) {
                const relationData = await relationResponse.json();
                console.log('[TikTok Tracker] 📊 Relation data fetched:', relationData);
                this.processApiResponse('/api/web/relation/multiGetFollowRelationCount', relationData);
              }
            } catch (e) {
              console.log('[TikTok Tracker] ❌ Failed to fetch relation data:', e);
            }
            
            // Fetch hash counts
            try {
              console.log('[TikTok Tracker] Fetching hash counts...');
              const hashUrl = `/tiktokstudio/api/web/counter/getHashCount?userId=${userId}&${commonParams}`;
              const hashResponse = await fetch(hashUrl, {
                credentials: 'include',
                headers: {
                  'Accept': 'application/json,*/*;q=0.8',
                  'Referer': window.location.href
                }
              });
              
              if (hashResponse.ok) {
                const hashData = await hashResponse.json();
                console.log('[TikTok Tracker] 📊 Hash data fetched:', hashData);
                this.processApiResponse('/api/web/counter/getHashCount', hashData);
              }
            } catch (e) {
              console.log('[TikTok Tracker] ❌ Failed to fetch hash data:', e);
            }
            
            // Fetch item list
            try {
              console.log('[TikTok Tracker] Fetching item list...');
              const itemListUrl = `/tiktok/creator/manage/item_list/v1/?${commonParams}`;
              const itemListResponse = await fetch(itemListUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Content-Type': 'application/json',
                  'Referer': window.location.href
                },
                body: JSON.stringify({
                  cursor: 0,
                  size: 50,
                  query: {
                    sort_orders: [{field_name: "post_time", order: 2}],
                    conditions: [],
                    is_recent_posts: true
                  }
                })
              });
              
              if (itemListResponse.ok) {
                const itemListData = await itemListResponse.json();
                console.log('[TikTok Tracker] 📊 Item list fetched:', itemListData);
                this.processApiResponse('/creator/manage/item_list', itemListData);
              }
            } catch (e) {
              console.log('[TikTok Tracker] ❌ Failed to fetch item list:', e);
            }
          } else {
            console.log('[TikTok Tracker] ⚠️ No userId found yet, skipping relation/hash/item fetches');
          }
        }, 2000); // Wait 2 seconds for initial data to be collected
      }
      
      private requestStudioNavigation() {
        browser.runtime.sendMessage({
          type: 'NAVIGATE_TO_STUDIO',
          accountId: this.accountId,
          handle: this.handle
        });
      }

      private sendDataToBackground() {
        console.log('=========================================');
        console.log('[TikTok Tracker] 📤📤📤 PREPARING TO SEND DATA 📤📤📤');
        console.log('[TikTok Tracker] 📊 Raw collected data:', this.collectedData);
        console.log('[TikTok Tracker] 📦 Number of API calls captured:', this.capturedApiCalls.length);
        console.log('[TikTok Tracker] 🔍 API URLs captured:', this.capturedApiCalls.map(c => c.url));
        console.log('=========================================');
        
        // Normalize the data structure
        const normalizedData = this.normalizeData();
        
        console.log('[TikTok Tracker] 📋 NORMALIZED DATA TO SEND:', normalizedData);
        
        browser.runtime.sendMessage({
          type: 'TIKTOK_DATA_COLLECTED',
          accountId: this.accountId,
          handle: this.handle,
          payload: normalizedData
        }).then(() => {
          console.log('[TikTok Tracker] ✅✅✅ DATA SENT SUCCESSFULLY! ✅✅✅');
          this.isCollecting = false;
          this.collectedData = {};
        }).catch(err => {
          console.error('[TikTok Tracker] ❌❌❌ FAILED TO SEND DATA:', err);
        });
      }

      private normalizeData() {
        console.log('[TikTok Tracker] 🔄 NORMALIZING DATA...');
        
        // Combine data from different sources with priority to API data
        const profile = this.collectedData.profile || this.collectedData.user || {};
        const stats = this.collectedData.stats || {};
        const userBase = this.collectedData.userBase || {};
        const appContext = this.collectedData.appContext || {};
        const userProfile = this.collectedData.userProfile || {};
        const relationCounts = this.collectedData.relationCounts || {};
        const hashCounts = this.collectedData.hashCounts || {};
        
        console.log('[TikTok Tracker] 📝 All collected data sources:', {
          hasUserBase: !!this.collectedData.userBase,
          hasAppContext: !!this.collectedData.appContext,
          hasUserProfile: !!this.collectedData.userProfile,
          hasRelationCounts: !!this.collectedData.relationCounts,
          hasHashCounts: !!this.collectedData.hashCounts,
          hasItemList: !!this.collectedData.itemList
        });
        
        return {
          profile: {
            // Priority: userBase > appContext > userProfile > profile > DOM
            userId: userBase.id || appContext.uid || userProfile.userId || profile.userId || profile.id,
            secUid: userBase.secUid || appContext.secUid || profile.secUid,
            uniqueId: userBase.uniqueId || appContext.uniqueId || profile.uniqueId || this.collectedData.usernameDOM || this.handle,
            nickname: userBase.nickName || appContext.nickName || profile.nickname || this.collectedData.displayNameDOM,
            avatar: userBase.avatarUri || appContext.avatarUri || profile.avatar,
            verified: userProfile.isVerified || profile.verified || this.collectedData.isVerifiedDOM || false,
            isPrivate: userProfile.isPrivate || appContext.isPrivateAccount || profile.isPrivate || false,
            bio: userProfile.profileBio || appContext.signature || profile.bio || this.collectedData.bioDOM,
            region: userBase.region || appContext.region || profile.region,
            language: userBase.language || appContext.language || profile.language,
            locale: userBase.locale,
            createTime: userBase.createTime,
            modifyTime: userBase.modifyTime,
            analyticsOn: appContext.analyticsOn,
            proAccountInfo: appContext.proAccountInfo
          },
          stats: {
            // Priority: API counts > profile stats > DOM counts
            followers: relationCounts.followers || profile.followerCount || stats.followerCount || this.collectedData.followerCountDOM || 0,
            following: relationCounts.following || profile.followingCount || stats.followingCount || this.collectedData.followingCountDOM || 0,
            likes: hashCounts.totalLikes || profile.heartCount || stats.heartCount || this.collectedData.likesCountDOM || 0,
            videos: hashCounts.totalPosts || profile.videoCount || stats.videoCount || 0,
            profileViews: hashCounts.profileViews || 0,
            friends: relationCounts.friends || 0
          },
          analytics: this.collectedData.analytics || {},
          audience: this.collectedData.audience || {},
          topContent: this.collectedData.itemList || this.collectedData.topContent || this.collectedData.videoStats || [],
          rawApiData: {
            userBase: this.collectedData.userBase,
            appContext: this.collectedData.appContext,
            userProfile: this.collectedData.userProfile,
            relationCounts: this.collectedData.relationCounts,
            hashCounts: this.collectedData.hashCounts
          },
          collectionTimestamp: Date.now(),
          platform: 'tiktok'
        };
      }
    }

    // ========================================
    // ACTION VERIFICATION TRACKER (LIKE/FOLLOW)
    // ========================================
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

    // Initialize both trackers
    const accountTracker = new TikTokAccountTracker();
    const actionTracker = new TikTokActionTracker();

    // Handle page navigation (TikTok is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('[TikTok Tracker] Page navigation detected:', url);
      }
    }).observe(document, { subtree: true, childList: true });
  },
});