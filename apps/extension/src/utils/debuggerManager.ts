// Chrome Debugger API utilities for MV3 background script
import { ProfileData } from '../types/verification';

export class DebuggerManager {
  private static attachedTabs = new Set<number>();
  private static responseHandlers = new Map<number, (data: ProfileData, requestId: string) => void>();
  private static requestTrackers = new Map<number, Set<string>>(); // tabId -> Set<requestId>
  
  static async attachToTab(tabId: number, username: string): Promise<void> {
    console.log(`🔗 [DebuggerManager] Attaching debugger to tab: ${tabId} for username: "${username}"`);
    
    return new Promise((resolve, reject) => {
      if (this.attachedTabs.has(tabId)) {
        console.log(`✅ [DebuggerManager] Debugger already attached to tab: ${tabId}`);
        resolve();
        return;
      }
      
      browser.debugger.attach({ tabId }, '1.3', () => {
        if (browser.runtime.lastError) {
          console.error(`❌ [DebuggerManager] Failed to attach debugger:`, browser.runtime.lastError.message);
          reject(new Error(browser.runtime.lastError.message));
          return;
        }
        
        this.attachedTabs.add(tabId);
        this.requestTrackers.set(tabId, new Set());
        console.log(`📡 [DebuggerManager] Debugger attached, enabling network monitoring...`);
        
        // Enable network monitoring
        browser.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            console.error(`❌ [DebuggerManager] Failed to enable network monitoring:`, browser.runtime.lastError.message);
            this.detachFromTab(tabId);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }
          
          console.log(`📡 [DebuggerManager] Network monitoring enabled for tab: ${tabId}`);
          
          // Configure network settings
          browser.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: false }, () => {
            console.log(`💾 [DebuggerManager] Network caching configured for response preservation`);
            
            // Set up event listeners for this specific tab
            this.setupEventListeners(tabId, username);
            resolve();
          });
        });
      });
    });
  }
  
  private static setupEventListeners(tabId: number, username: string): void {
    const handleDebuggerEvent = (source: any, method: string, params: any) => {
      if (source.tabId !== tabId) return;
      
      if (method === 'Network.requestWillBeSent') {
        const url = params.request.url;
        if (this.isTargetRequest(url)) {
          console.log(`📤 [DebuggerManager] GraphQL request will be sent for tab ${tabId}: ${url}`);
          const requestTracker = this.requestTrackers.get(tabId);
          if (requestTracker) {
            requestTracker.add(params.requestId);
          }
        }
      }
      
      if (method === 'Network.responseReceived') {
        const requestId = params.requestId;
        const requestTracker = this.requestTrackers.get(tabId);
        
        if (requestTracker?.has(requestId)) {
          console.log(`✅ [DebuggerManager] GraphQL response received for tab ${tabId}, request: ${requestId}`);
          
          // Small delay to ensure response is fully loaded
          setTimeout(() => {
            this.processResponse(tabId, requestId, username);
          }, 100);
        }
      }
    };
    
    browser.debugger.onEvent.addListener(handleDebuggerEvent);
  }
  
  private static async processResponse(tabId: number, requestId: string, username: string): Promise<void> {
    try {
      browser.debugger.sendCommand(
        { tabId },
        'Network.getResponseBody',
        { requestId },
        (response: any) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [DebuggerManager] Error getting response body:`, browser.runtime.lastError.message);
            return;
          }
          
          if (!response?.body) {
            console.log(`❗ [DebuggerManager] Response body is empty for tab ${tabId}`);
            return;
          }
          
          try {
            const profileData = this.extractProfileData(response.body);
            
            if (profileData && profileData.username && profileData.username.trim() !== '') {
              console.log(`👤 [DebuggerManager] Extracted profile data for tab ${tabId}: ${profileData.username}`);
              
              // Send response to content script via runtime messaging
              browser.tabs.sendMessage(tabId, {
                type: 'VERIFICATION_RESPONSE',
                tabId,
                profileData,
                requestId,
              }).catch(() => {
                // Content script might not be ready, use runtime messaging instead
                browser.runtime.sendMessage({
                  type: 'VERIFICATION_RESPONSE',
                  tabId,
                  profileData,
                  requestId,
                });
              });
              
              // Notify response handler if registered
              const handler = this.responseHandlers.get(tabId);
              if (handler) {
                handler(profileData, requestId);
              }
            } else {
              console.log(`📄 [DebuggerManager] GraphQL response doesn't contain complete profile data for tab ${tabId}`);
            }
          } catch (error) {
            console.error(`💥 [DebuggerManager] Error processing GraphQL response for tab ${tabId}:`, error);
          }
        }
      );
    } catch (error) {
      console.error(`💥 [DebuggerManager] Failed to process response for tab ${tabId}:`, error);
    }
  }
  
  static setResponseHandler(tabId: number, handler: (data: ProfileData, requestId: string) => void): void {
    this.responseHandlers.set(tabId, handler);
  }
  
  static removeResponseHandler(tabId: number): void {
    this.responseHandlers.delete(tabId);
  }
  
  static async detachFromTab(tabId: number): Promise<void> {
    if (!this.attachedTabs.has(tabId)) {
      return;
    }
    
    try {
      browser.debugger.detach({ tabId });
      console.log(`🧹 [DebuggerManager] Debugger detached from tab: ${tabId}`);
    } catch (error) {
      console.warn(`⚠️ [DebuggerManager] Error detaching debugger from tab ${tabId}:`, error);
    } finally {
      this.attachedTabs.delete(tabId);
      this.requestTrackers.delete(tabId);
      this.responseHandlers.delete(tabId);
    }
  }
  
  static cleanup(): void {
    // Detach from all tabs
    for (const tabId of this.attachedTabs) {
      this.detachFromTab(tabId);
    }
  }
  
  private static isTargetRequest(url: string): boolean {
    const isGraphQL = url.includes('instagram.com/graphql/query');
    const isAPI = url.includes('instagram.com/api/v1/');
    const isWebProfile = url.includes('instagram.com/api/v1/users/web_profile_info');
    
    if (isGraphQL || isAPI || isWebProfile) {
      console.log(`🎯 [DebuggerManager] Detected potential profile request: ${url.substring(0, 100)}...`);
      return true;
    }
    
    return false;
  }
  
  private static extractProfileData(responseBody: string): ProfileData | null {
    try {
      const response = JSON.parse(responseBody);
      
      // Try different response structures that Instagram might use
      let user = null;
      
      // Standard GraphQL response
      if (response.data?.user) {
        user = response.data.user;
        console.log(`📊 [DebuggerManager] Found user data in standard GraphQL structure`);
      }
      // Alternative API response structure
      else if (response.user) {
        user = response.user;
        console.log(`📊 [DebuggerManager] Found user data in alternative API structure`);
      }
      // Check for xdt_api response structure
      else if (response.data?.xdt_api__v1__users__web_profile_info?.user) {
        user = response.data.xdt_api__v1__users__web_profile_info.user;
        console.log(`📊 [DebuggerManager] Found user data in xdt_api structure`);
      }
      
      if (!user) {
        console.log(`❌ [DebuggerManager] No user data found in response`);
        return null;
      }

      return {
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
    } catch (error) {
      console.error('❌ [DebuggerManager] Failed to parse Instagram profile data:', error);
      return null;
    }
  }
}