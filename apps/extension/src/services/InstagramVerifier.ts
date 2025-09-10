import { PlatformVerifier, ProfileData, VerificationResult } from '../types/verification';

interface ResponseData {
  requestId: string;
  profileData: ProfileData;
  timestamp: number;
}

export class InstagramVerifier implements PlatformVerifier {
  platform = 'instagram';

  async verifyAccount(username: string, tabId: number): Promise<VerificationResult> {
    console.log(`🔍 [InstagramVerifier] Starting verification for username: "${username}" on tab: ${tabId}`);
    console.log(`🔍 [InstagramVerifier] Username details: length=${username.length}, has dot=${username.includes('.')}, has underscore=${username.includes('_')}`);
    
    return new Promise((resolve) => {
      let isResolved = false;
      let cleanupExecuted = false;
      const collectedResponses: ResponseData[] = [];
      const graphqlRequestIds = new Set<string>();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      const cleanup = async () => {
        if (cleanupExecuted) return;
        cleanupExecuted = true;
        
        console.log(`🧹 [InstagramVerifier] Cleaning up resources for tab: ${tabId}`);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        try {
          // Use try-finally to ensure debugger detachment even on errors
          browser.debugger.onEvent.removeListener(handleDebuggerEvent);
          await new Promise<void>((detachResolve) => {
            browser.debugger.detach({ tabId }, () => {
              // Ignore errors during detachment - tab might already be closed
              detachResolve();
            });
          });
        } catch (error) {
          console.warn(`⚠️ [InstagramVerifier] Error during cleanup (ignoring):`, error);
        }
      };

      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== tabId || isResolved) return;
        
        // Capture request details when request is sent
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          if (this.isTargetRequest(url)) {
            console.log(`📤 [InstagramVerifier] GraphQL request will be sent: ${url}`);
            graphqlRequestIds.add(params.requestId);
          }
        }
        
        // Process response when it arrives
        if (method === 'Network.responseReceived') {
          const requestId = params.requestId;
          
          // Only process GraphQL responses that we tracked from the request phase
          if (graphqlRequestIds.has(requestId)) {
            console.log(`✅ [InstagramVerifier] GraphQL response received for tracked request: ${requestId}`);
            
            // Small delay to ensure response is fully loaded
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId },
                'Network.getResponseBody',
                { requestId },
                async (response: any) => {
                  if (isResolved) return;
                  
                  if (browser.runtime.lastError) {
                    console.error(`❌ [InstagramVerifier] Error getting response body:`, browser.runtime.lastError.message);
                    return;
                  }
                  
                  if (!response?.body) {
                    console.log(`❗ [InstagramVerifier] Response body is empty`);
                    return;
                  }
                  
                  try {
                    const profileData = this.extractProfileData(response.body);
                    
                    // Only collect responses with complete profile data (must have username)
                    if (profileData && profileData.username && profileData.username.trim() !== '') {
                      console.log(`👤 [InstagramVerifier] Extracted complete profile data: ${profileData.username}`);
                      
                      const responseData: ResponseData = {
                        requestId,
                        profileData,
                        timestamp: Date.now(),
                      };
                      
                      collectedResponses.push(responseData);
                      
                      // Check if this response matches the expected username
                      const normalizedExpected = username.toLowerCase().trim();
                      const normalizedReceived = profileData.username.toLowerCase().trim();
                      
                      console.log(`🔍 [InstagramVerifier] Username comparison:`);
                      console.log(`  Expected (normalized): "${normalizedExpected}"`);
                      console.log(`  Received (normalized): "${normalizedReceived}"`);
                      console.log(`  Match: ${normalizedExpected === normalizedReceived}`);
                      
                      if (normalizedExpected === normalizedReceived) {
                        console.log(`✅ [InstagramVerifier] Perfect username match found! Verification successful.`);
                        isResolved = true;
                        await cleanup();
                        resolve({ success: true, profileData });
                        return;
                      }
                    } else {
                      console.log(`📄 [InstagramVerifier] Skipping incomplete response (no username or empty username)`);
                      if (profileData) {
                        console.log(`🔍 [InstagramVerifier] Incomplete response details:`, {
                          hasUsername: !!profileData.username,
                          usernameLength: profileData.username?.length || 0,
                          hasFullName: !!profileData.fullName,
                        });
                      }
                    }
                  } catch (error) {
                    console.error(`💥 [InstagramVerifier] Error processing GraphQL response:`, error);
                  }
                }
              );
            }, 100);
          }
        }
      };

      // Set up timeout with intelligent response evaluation
      timeoutId = setTimeout(async () => {
        if (isResolved) return;
        
        console.log(`⏰ [InstagramVerifier] Verification timeout after 30 seconds for "${username}"`);
        console.log(`📊 [InstagramVerifier] Collected ${collectedResponses.length} responses`);
        
        // Try to find the best match from collected responses
        const bestMatch = this.findBestMatchingResponse(username, collectedResponses);
        
        if (bestMatch) {
          console.log(`🎯 [InstagramVerifier] Found suitable response from collected data: ${bestMatch.username}`);
          isResolved = true;
          await cleanup();
          resolve({ success: true, profileData: bestMatch });
          return;
        }
        
        // No suitable match found
        let errorMessage = 'Verification timeout';
        if (collectedResponses.length === 0) {
          errorMessage = 'No Instagram data requests detected - profile may not exist or page did not load properly';
        } else if (graphqlRequestIds.size > 0) {
          errorMessage = `Profile data could not be matched after processing ${collectedResponses.length} responses - username may not exist or be different`;
        }
        
        isResolved = true;
        await cleanup();
        resolve({ success: false, error: errorMessage });
      }, 30000);

      // Attach debugger and listen for network events
      console.log(`🔗 [InstagramVerifier] Attaching debugger to tab: ${tabId}`);
      
      browser.debugger.attach({ tabId }, '1.3', () => {
        if (browser.runtime.lastError) {
          console.error(`❌ [InstagramVerifier] Failed to attach debugger:`, browser.runtime.lastError.message);
          if (timeoutId) clearTimeout(timeoutId);
          resolve({ success: false, error: `Failed to attach debugger: ${browser.runtime.lastError.message}` });
          return;
        }

        console.log(`📡 [InstagramVerifier] Debugger attached, enabling network monitoring...`);

        // Enable network domain
        browser.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            console.error(`❌ [InstagramVerifier] Failed to enable network monitoring:`, browser.runtime.lastError.message);
            if (timeoutId) clearTimeout(timeoutId);
            cleanup();
            resolve({ success: false, error: `Failed to enable network: ${browser.runtime.lastError.message}` });
            return;
          }

          console.log(`📡 [InstagramVerifier] Network monitoring enabled`);
          
          // Configure network settings for better response capture
          browser.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: false }, () => {
            console.log(`💾 [InstagramVerifier] Network caching configured`);
            
            console.log(`🎧 [InstagramVerifier] Listening for GraphQL requests...`);
            browser.debugger.onEvent.addListener(handleDebuggerEvent);
          });
        });
      });
    });
  }

  /**
   * Find the best matching response from collected data
   */
  private findBestMatchingResponse(expectedUsername: string, responses: ResponseData[]): ProfileData | null {
    if (responses.length === 0) return null;
    
    const normalizedExpected = expectedUsername.toLowerCase().trim();
    
    // 1. First try exact match
    const exactMatch = responses.find(response => 
      response.profileData.username.toLowerCase().trim() === normalizedExpected
    );
    
    if (exactMatch) {
      console.log(`🎯 [InstagramVerifier] Found exact username match`);
      return exactMatch.profileData;
    }
    
    // 2. Try partial match (in case of Instagram username variations)
    const partialMatch = responses.find(response => {
      const receivedUsername = response.profileData.username.toLowerCase().trim();
      return receivedUsername.includes(normalizedExpected) || normalizedExpected.includes(receivedUsername);
    });
    
    if (partialMatch) {
      console.log(`🔄 [InstagramVerifier] Found partial username match`);
      return partialMatch.profileData;
    }
    
    // 3. Fallback to most complete response (has username + other data)
    const completeResponse = responses
      .filter(response => response.profileData.username && response.profileData.fullName)
      .sort((a, b) => b.timestamp - a.timestamp)[0]; // Most recent
    
    if (completeResponse) {
      console.log(`🔄 [InstagramVerifier] Using most complete recent response`);
      return completeResponse.profileData;
    }
    
    return null;
  }

  isTargetRequest(url: string): boolean {
    // Check for various Instagram API endpoints that might contain profile data
    const isGraphQL = url.includes('instagram.com/graphql/query');
    const isAPI = url.includes('instagram.com/api/v1/');
    const isWebProfile = url.includes('instagram.com/api/v1/users/web_profile_info');
    
    if (isGraphQL || isAPI || isWebProfile) {
      console.log(`🎯 [InstagramVerifier] Detected potential profile request: ${url.substring(0, 100)}...`);
      return true;
    }
    
    return false;
  }

  extractProfileData(responseBody: string): ProfileData | null {
    try {
      const response = JSON.parse(responseBody);
      
      // Try different response structures that Instagram might use
      let user = null;
      
      // Standard GraphQL response
      if (response.data?.user) {
        user = response.data.user;
        console.log(`📊 [InstagramVerifier] Found user data in standard GraphQL structure`);
      }
      // Alternative API response structure
      else if (response.user) {
        user = response.user;
        console.log(`📊 [InstagramVerifier] Found user data in alternative API structure`);
      }
      // Check for xdt_api response structure
      else if (response.data?.xdt_api__v1__users__web_profile_info?.user) {
        user = response.data.xdt_api__v1__users__web_profile_info.user;
        console.log(`📊 [InstagramVerifier] Found user data in xdt_api structure`);
      }
      
      if (!user) {
        console.log(`❌ [InstagramVerifier] No user data found in response structure`);
        return null;
      }

      // Validate that we have at minimum a username
      if (!user.username || user.username.trim() === '') {
        console.log(`❌ [InstagramVerifier] Response contains user object but no valid username`);
        return null;
      }

      const profileData: ProfileData = {
        username: user.username || '',
        fullName: user.full_name || '',
        biography: user.biography || '',
        isVerified: user.is_verified || false,
        followerCount: user.follower_count || user.edge_followed_by?.count || 0,
        followingCount: user.following_count || user.edge_follow?.count || 0,
        mediaCount: user.media_count || user.edge_owner_to_timeline_media?.count || 0,
        profilePicUrl: user.profile_pic_url || user.profile_pic_url_hd || '',
        accountType: user.account_type || 0,
        isPrivate: user.is_private || false,
        isBusiness: user.is_business || false,
        category: user.category || user.category_name || undefined,
        externalUrl: user.external_url || undefined,
      };

      console.log(`👤 [InstagramVerifier] Successfully extracted profile for: "${profileData.username}"`);
      return profileData;
    } catch (error) {
      console.error('❌ [InstagramVerifier] Failed to parse Instagram profile data:', error);
      console.error('📋 [InstagramVerifier] Response body preview:', responseBody.substring(0, 500));
      return null;
    }
  }
}