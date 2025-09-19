export default defineContentScript({
  matches: ['*://www.tiktok.com/tiktokstudio/*'],
  main() {
    console.log('[TikTok Studio] ✅ Content script loaded on:', window.location.href);
    console.log('[TikTok Studio] Full path:', window.location.pathname);
    
    // Send a test message to confirm script is running
    chrome.runtime.sendMessage({
      type: 'TIKTOK_STUDIO_LOADED',
      url: window.location.href
    }).catch(err => console.log('[TikTok Studio] Failed to send loaded message:', err));

    class TikTokStudioCollector {
      private accountId: string | null = null;
      private handle: string | null = null;
      private isCollecting: boolean = false;
      private dataCollected: boolean = false;
      private capturedApiCalls: any[] = [];

      constructor() {
        console.log('[TikTok Studio] ✅ Content script initialized on:', window.location.href);
        console.log('[TikTok Studio] Path:', window.location.pathname);
        
        // Check for any pre-loaded data in window
        this.checkForPreloadedData();
        
        // ALWAYS setup network interceptor FIRST - like the working TikTok script
        this.setupNetworkInterceptor();
        
        // Setup message listener to receive account info from background
        this.setupMessageListener();
        
        // Check if we're on the analytics/viewers page
        if (window.location.pathname.includes('/analytics/viewers') || 
            window.location.pathname.includes('/tiktokstudio/analytics/viewers')) {
          console.log('[TikTok Studio] ✅ On analytics viewers page, requesting account info...');
          
          // Request account info from background script
          chrome.runtime.sendMessage({
            type: 'REQUEST_DEMOGRAPHICS_INFO'
          }).then((response) => {
            if (response?.accountId) {
              this.isCollecting = true;
              this.accountId = response.accountId;
              this.handle = response.handle;
              console.log('[TikTok Studio] 🟢 Starting demographics collection for:', this.handle);
              
              // Process any already captured calls after 2 seconds
              setTimeout(() => this.processCapturedApiCalls(), 2000);
              
              // Also check every second for new data
              const checkInterval = setInterval(() => {
                if (this.dataCollected) {
                  clearInterval(checkInterval);
                } else if (this.capturedApiCalls.length > 0) {
                  console.log('[TikTok Studio] Checking captured calls...');
                  this.processCapturedApiCalls();
                }
              }, 1000);
              
              // Set timeout to fail gracefully
              setTimeout(() => {
                if (!this.dataCollected) {
                  console.log('[TikTok Studio] Timeout reached, checking captured calls...');
                  this.processCapturedApiCalls();
                  
                  if (!this.dataCollected) {
                    console.log('[TikTok Studio] No demographics found, sending failure...');
                    chrome.runtime.sendMessage({
                      type: 'TIKTOK_DEMOGRAPHICS_FAILED',
                      accountId: this.accountId,
                      handle: this.handle,
                      reason: 'timeout'
                    });
                  }
                }
              }, 10000);
            }
          }).catch(err => {
            console.log('[TikTok Studio] No pending demographics collection');
          });
        }
      }

      private checkForPreloadedData() {
        // Check if there's any preloaded analytics data
        console.log('[TikTok Studio] Checking for preloaded data...');
        
        // Check window.__INITIAL_DATA__ or similar
        const windowKeys = Object.keys(window).filter(key => 
          key.includes('DATA') || 
          key.includes('STATE') || 
          key.includes('INITIAL') ||
          key.includes('analytics')
        );
        
        if (windowKeys.length > 0) {
          console.log('[TikTok Studio] Found potential data keys:', windowKeys);
          windowKeys.forEach(key => {
            const value = (window as any)[key];
            if (value && typeof value === 'object') {
              console.log(`[TikTok Studio] ${key}:`, value);
            }
          });
        }
        
        // Check for React/Next.js data
        if ((window as any).__NEXT_DATA__) {
          console.log('[TikTok Studio] Found __NEXT_DATA__:', (window as any).__NEXT_DATA__);
        }
        
        if ((window as any).__INITIAL_STATE__) {
          console.log('[TikTok Studio] Found __INITIAL_STATE__:', (window as any).__INITIAL_STATE__);
        }
      }

      private setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'START_DEMOGRAPHICS_COLLECTION') {
            this.isCollecting = true;
            this.accountId = message.accountId;
            this.handle = message.handle;
            console.log('[TikTok Studio] Received collection command for:', this.handle);
            
            // Process any already captured calls
            this.processCapturedApiCalls();
            sendResponse({ acknowledged: true });
          }
          
          return true;
        });
      }

      private setupNetworkInterceptor() {
        console.log('[TikTok Studio] Setting up network interceptor...');
        
        // Intercept fetch - EXACTLY like the working TikTok script
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          const url = args[0].toString();
          
          // Log ALL TikTok API calls for debugging
          if (url.includes('tiktok.com')) {
            console.log('[TikTok Studio] API Call:', url.split('?')[0]);
          }
          
          // Capture TikTok Studio API calls - try multiple possible endpoints
          if (url.includes('/aweme/v2/data/insight/') || 
              url.includes('/api/insight/') ||
              url.includes('/data/insight/') ||
              url.includes('type_requests')) {
            console.log('[TikTok Studio] 🎯 CAPTURED DEMOGRAPHICS API:', url.split('?')[0]);
            console.log('[TikTok Studio] Full URL:', url);
            
            try {
              const clonedResponse = response.clone();
              const data = await clonedResponse.json();
              
              console.log('[TikTok Studio] Response data keys:', Object.keys(data));
              
              const apiCall = { url, timestamp: Date.now(), data };
              this.capturedApiCalls.push(apiCall);
              
              console.log('[TikTok Studio] API Response captured, total calls:', this.capturedApiCalls.length);
              
              // Immediately process if we're collecting
              if (this.isCollecting) {
                this.processCapturedApiCalls();
              }
            } catch (error) {
              console.error('[TikTok Studio] Error cloning response:', error);
            }
          }
          
          return response;
        };
        
        // Also intercept XHR just in case
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
          (this as any)._interceptedUrl = url;
          return originalOpen.apply(this, [method, url, ...args] as any);
        };
        
        XMLHttpRequest.prototype.send = function(...args: any[]) {
          this.addEventListener('load', () => {
            const url = (this as any)._interceptedUrl;
            
            // Log ALL XHR requests to TikTok for debugging
            if (url && url.includes('tiktok.com')) {
              console.log('[TikTok Studio] XHR Request:', url.split('?')[0]);
            }
            
            // Check for demographics API with broader matching
            if (url && (url.includes('/aweme/v2/data/insight/') || 
                       url.includes('type_requests') ||
                       url.includes('/api/insight/'))) {
              try {
                const data = JSON.parse(this.responseText);
                if (data) {
                  console.log('[TikTok Studio] 🎯 XHR CAPTURED DEMOGRAPHICS:', url.split('?')[0]);
                  console.log('[TikTok Studio] XHR Response keys:', Object.keys(data));
                  const apiCall = { url, timestamp: Date.now(), data };
                  (window as any).__tiktokStudioCollector?.capturedApiCalls.push(apiCall);
                  
                  if ((window as any).__tiktokStudioCollector?.isCollecting) {
                    (window as any).__tiktokStudioCollector?.processCapturedApiCalls();
                  }
                }
              } catch (error) {
                console.error('[TikTok Studio] XHR parse error:', error);
              }
            }
          });
          
          return originalSend.apply(this, args);
        };
        
        // Store reference for XHR
        (window as any).__tiktokStudioCollector = this;
      }

      private processCapturedApiCalls() {
        if (this.dataCollected) return;
        
        console.log('[TikTok Studio] Processing', this.capturedApiCalls.length, 'captured API calls...');
        
        for (const apiCall of this.capturedApiCalls) {
          const data = apiCall.data;
          
          console.log('[TikTok Studio] Checking API call data, keys:', Object.keys(data || {}));
          
          // Check if this response has demographics data - data is at root level
          if (data?.viewer_gender_percent || 
              data?.viewer_age_distribution ||
              data?.viewer_country_city_percent ||
              data?.unique_viewer_num ||
              data?.new_viewer_num) {
            
            console.log('[TikTok Studio] 🎉 FOUND DEMOGRAPHICS DATA!');
            console.log('[TikTok Studio] Data structure:', {
              hasGender: !!data.viewer_gender_percent,
              hasAge: !!data.viewer_age_distribution,
              hasGeo: !!data.viewer_country_city_percent,
              hasUnique: !!data.unique_viewer_num,
              hasNew: !!data.new_viewer_num
            });
            this.extractAndSendDemographics(data);
            return;
          }
        }
        
        console.log('[TikTok Studio] No demographics data found in captured calls');
      }

      private extractAndSendDemographics(data: any) {
        if (this.dataCollected) return;
        
        // The data comes directly at the root level, not under 'insights'
        console.log('[TikTok Studio] Raw data keys:', Object.keys(data));
        
        const demographics = {
          // Gender distribution - extract from array of {key, value} objects
          genderFemale: this.extractGenderValue(data.viewer_gender_percent, 'Female') * 100,
          genderMale: this.extractGenderValue(data.viewer_gender_percent, 'Male') * 100,
          genderOther: this.extractGenderValue(data.viewer_gender_percent, 'Other') * 100,
          
          // Age distribution - extract from value array
          age18to24: this.extractAgeValue(data.viewer_age_distribution, '18-24') * 100,
          age25to34: this.extractAgeValue(data.viewer_age_distribution, '25-34') * 100,
          age35to44: this.extractAgeValue(data.viewer_age_distribution, '35-44') * 100,
          age45to54: this.extractAgeValue(data.viewer_age_distribution, '45-54') * 100,
          age55plus: this.extractAgeValue(data.viewer_age_distribution, '55+') * 100,
          
          // Viewer metrics
          uniqueViewers: data.unique_viewer_num?.value || 0,
          newViewers: data.new_viewer_num?.value || 0,
          returningViewers: this.calculateReturningViewers(data.returning_viewer) || 0,
          
          // Geography
          geography: this.extractGeography(data.viewer_country_city_percent)
        };
        
        console.log('[TikTok Studio] Demographics extracted:', demographics);
        
        this.dataCollected = true;
        
        // Send to background - EXACTLY like the working TikTok script
        chrome.runtime.sendMessage({
          type: 'TIKTOK_DEMOGRAPHICS_COLLECTED',
          accountId: this.accountId,
          handle: this.handle,
          demographics: demographics
        }).then(() => {
          console.log('[TikTok Studio] ✅ Demographics sent successfully');
        }).catch(error => {
          console.error('[TikTok Studio] Failed to send demographics:', error);
        });
      }

      private extractGenderValue(genderData: any, gender: string): number {
        if (!genderData?.value || !Array.isArray(genderData.value)) return 0;
        
        const genderItem = genderData.value.find((item: any) => item.key === gender);
        return genderItem?.value || 0;
      }

      private extractAgeValue(ageData: any, ageRange: string): number {
        if (!ageData?.value || !Array.isArray(ageData.value)) return 0;
        
        const ageItem = ageData.value.find((item: any) => item.key === ageRange);
        return ageItem?.value || 0;
      }

      private calculateReturningViewers(returningData: any): number {
        if (!returningData || !Array.isArray(returningData)) return 0;
        
        // Sum up all returning viewers across days
        return returningData.reduce((sum: number, day: any) => {
          return sum + (day.value || 0);
        }, 0);
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

      private getCountryCode(countryName: string): string {
        const countryMap: { [key: string]: string } = {
          'United States': 'US',
          'United Kingdom': 'GB',
          'Brazil': 'BR',
          'Mexico': 'MX',
          'Canada': 'CA',
          'Germany': 'DE',
          'France': 'FR',
          'Spain': 'ES',
          'Italy': 'IT',
          'Japan': 'JP',
          'South Korea': 'KR',
          'India': 'IN',
          'Indonesia': 'ID',
          'Philippines': 'PH',
          'Thailand': 'TH',
          'Vietnam': 'VN',
          'Russia': 'RU',
          'Turkey': 'TR',
          'Argentina': 'AR',
          'Colombia': 'CO'
        };
        
        return countryMap[countryName] || countryName.substring(0, 2).toUpperCase();
      }
    }

    // Initialize collector
    new TikTokStudioCollector();
  }
});