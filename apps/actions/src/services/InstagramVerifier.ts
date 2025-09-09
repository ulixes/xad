import { PlatformVerifier, ProfileData, VerificationResult } from '../types/verification';

export class InstagramVerifier implements PlatformVerifier {
  platform = 'instagram';
  private pendingRequestId: string | null = null;

  async verifyAccount(username: string, tabId: number): Promise<VerificationResult> {
    console.log(`🔍 [InstagramVerifier] Starting verification for username: ${username} on tab: ${tabId}`);
    
    return new Promise((resolve) => {
      let isResolved = false;
      
      const cleanup = () => {
        console.log(`🧹 [InstagramVerifier] Detaching debugger from tab: ${tabId}`);
        browser.debugger.detach({ tabId });
      };

      let graphqlRequestsSeen = 0;
      let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

      // Store request IDs for GraphQL requests to track them properly
      const graphqlRequestIds = new Set<string>();
      
      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== tabId || isResolved) return;
        
        // Capture request details when request is sent
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          if (this.isTargetRequest(url)) {
            console.log(`📤 [InstagramVerifier] GraphQL request will be sent: ${url}`);
            console.log(`🔗 [InstagramVerifier] Storing request ID: ${params.requestId}`);
            graphqlRequestIds.add(params.requestId);
          }
        }
        
        // Process response when it arrives
        if (method === 'Network.responseReceived') {
          const url = params.response.url;
          const requestId = params.requestId;
          
          // Only process GraphQL responses that we tracked from the request phase
          if (graphqlRequestIds.has(requestId)) {
            console.log(`✅ [InstagramVerifier] GraphQL response received for tracked request: ${url}`);
            console.log(`📋 [InstagramVerifier] Request ID: ${requestId}`);
            graphqlRequestsSeen++;
            
            // Small delay to ensure response is fully loaded
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId },
                'Network.getResponseBody',
                { requestId: requestId },
                (response: any) => {
                  if (isResolved) return;
                  
                  console.log(`📦 [InstagramVerifier] Got GraphQL response body, size: ${response?.body?.length || 0} chars`);
                  
                  if (browser.runtime.lastError) {
                    console.error(`❌ [InstagramVerifier] Error getting response body:`, browser.runtime.lastError.message);
                    return;
                  }
                  
                  // Debug: Log the actual response content for analysis
                  if (response?.body) {
                    console.log(`🔍 [InstagramVerifier] Response content preview:`, response.body.substring(0, 200));
                  } else {
                    console.log(`❗ [InstagramVerifier] Response body is empty or undefined`);
                    return;
                  }
                  
                  try {
                    const profileData = this.extractProfileData(response.body);
                    
                    if (profileData) {
                      console.log(`👤 [InstagramVerifier] Extracted profile data for: ${profileData.username}`);
                      console.log(`🔗 [InstagramVerifier] Profile details:`, {
                        username: profileData.username,
                        fullName: profileData.fullName,
                        followerCount: profileData.followerCount,
                        isVerified: profileData.isVerified
                      });
                      
                      if (profileData.username.toLowerCase() === username.toLowerCase()) {
                        console.log(`✅ [InstagramVerifier] Username match confirmed! Verification successful.`);
                        isResolved = true;
                        cleanup();
                        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
                        resolve({ success: true, profileData });
                        return;
                      } else {
                        console.error(`❌ [InstagramVerifier] Username mismatch! Expected: ${username}, Got: ${profileData.username}`);
                      }
                    } else {
                      console.log(`📄 [InstagramVerifier] GraphQL response doesn't contain profile data`);
                      console.log(`🔍 [InstagramVerifier] Raw response for debugging:`, response.body);
                    }
                  } catch (error) {
                    console.error(`💥 [InstagramVerifier] Error processing GraphQL response:`, error);
                  }
                }
              );
            }, 100); // 100ms delay to let response body settle
          }
        }
      };

      // Skip fallback for now - focus on GraphQL interception only
      console.log(`🎯 [InstagramVerifier] Focusing on GraphQL interception only`);
      
      // Clear fallback timeout after 10 seconds if no GraphQL found
      fallbackTimeoutId = setTimeout(() => {
        if (!isResolved) {
          console.log(`⏰ [InstagramVerifier] 10 seconds passed, GraphQL requests seen: ${graphqlRequestsSeen}`);
        }
      }, 10000);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.warn(`⏰ [InstagramVerifier] Verification timeout for ${username} after 30 seconds`);
          isResolved = true;
          cleanup();
          resolve({ success: false, error: 'Verification timeout - Instagram may not have loaded or user profile may not exist' });
        }
      }, 30000); // 30 second timeout

      // Attach debugger and listen for network events
      console.log(`🔗 [InstagramVerifier] Attaching debugger to tab: ${tabId}`);
      
      browser.debugger.attach({ tabId }, '1.3', () => {
        if (browser.runtime.lastError) {
          console.error(`❌ [InstagramVerifier] Failed to attach debugger:`, browser.runtime.lastError.message);
          clearTimeout(timeoutId);
          resolve({ success: false, error: `Failed to attach debugger: ${browser.runtime.lastError.message}` });
          return;
        }

        console.log(`📡 [InstagramVerifier] Debugger attached, enabling network monitoring...`);

        // Enable network domain first
        browser.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            console.error(`❌ [InstagramVerifier] Failed to enable network monitoring:`, browser.runtime.lastError.message);
            clearTimeout(timeoutId);
            cleanup();
            resolve({ success: false, error: `Failed to enable network: ${browser.runtime.lastError.message}` });
            return;
          }

          console.log(`📡 [InstagramVerifier] Network monitoring enabled`);
          
          // Enable both network caching and request interception for better response capture
          browser.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: false }, () => {
            console.log(`💾 [InstagramVerifier] Network caching configured for response preservation`);
            
            console.log(`🎧 [InstagramVerifier] Listening for GraphQL requests...`);
            browser.debugger.onEvent.addListener(handleDebuggerEvent);
          });
        });
      });
    });
  }

  isTargetRequest(url: string): boolean {
    return url.includes('instagram.com/graphql/query');
  }

  extractProfileData(responseBody: string): ProfileData | null {
    try {
      const response = JSON.parse(responseBody);
      
      if (!response.data?.user) {
        return null;
      }

      const user = response.data.user;
      
      return {
        username: user.username || '',
        fullName: user.full_name || '',
        biography: user.biography || '',
        isVerified: user.is_verified || false,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        mediaCount: user.media_count || 0,
        profilePicUrl: user.profile_pic_url || '',
        accountType: user.account_type || 0,
        isPrivate: user.is_private || false,
        isBusiness: user.is_business || false,
        category: user.category || undefined,
        externalUrl: user.external_url || undefined,
      };
    } catch (error) {
      console.error('Failed to parse Instagram profile data:', error);
      return null;
    }
  }
}