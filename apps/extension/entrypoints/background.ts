import { InstagramVerifier } from '../src/services/InstagramVerifier';
import { VerificationMessage } from '../src/types/verification';
import { TabManager } from '../src/utils/tabManager';
import { DebuggerManager } from '../src/utils/debuggerManager';

// Strong typing based on CSV IG field mapping
interface IGProfileData {
  followerCount: number;           // ig-follower-count
  accountType: 1 | 2 | 3;          // ig-account-type (1=personal, 2=business, 3=creator)
  isVerified: boolean;             // ig-is-verified
  category: string;                // ig-category
}

interface IGBusinessInsights {
  profileVisits7d: number;         // ig-profile-visits-7d
  profileVisits30d: number;        // ig-profile-visits-30d
  profileVisits90d: number;        // ig-profile-visits-90d
  accountsReached7d: number;       // ig-accounts-reached-7d
  accountsReached30d: number;      // ig-accounts-reached-30d
  accountsEngaged7d: number;       // ig-accounts-engaged-7d
  accountsEngaged30d: number;      // ig-accounts-engaged-30d
  followerGrowth7d: number;        // ig-follower-growth-7d (percentage)
  followerGrowth30d: number;       // ig-follower-growth-30d (percentage)
  followerGrowth90d: number;       // ig-follower-growth-90d (percentage)
  engagementRate: number;          // ig-engagement-rate
}

interface IGAudienceData {
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };                               // ig-audience-gender
  ageDistribution: {
    '13-17': number;
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55-64': number;
    '65+': number;
  };                               // ig-audience-age
  topLocation: string;             // ig-top-location
}

interface IGContentMetrics {
  engagementTrend: 'increasing' | 'stable' | 'decreasing'; // ig-content-engagement-trend
}

interface IGAccountCenterData {
  linkedIdentities: Array<{
    canonicalId: string;
    accountType: 'INSTAGRAM';
    username: string;
    fullName: string;
    identityType: 'IG_USER' | 'IG_PROFESSIONAL';
    detailedIdentityType: 'IG_PERSONAL' | 'IG_CREATOR' | 'IG_BUSINESS';
  }>;
  businessIdentities: Array<{
    canonicalId: string;
    username: string;
    fullName: string;
    identityType: 'IG_PROFESSIONAL';
    detailedIdentityType: 'IG_CREATOR' | 'IG_BUSINESS';
  }>;
}

interface IGProfileSession {
  sessionId: string;
  userId: string;
  username: string;
  stage: 'account_center' | 'basic_profile' | 'insights' | 'audience' | 'completed' | 'failed';
  tabId?: number;
  collectedData: {
    accountCenterData: IGAccountCenterData | null;
    profileData: IGProfileData | null;
    insightsData: IGBusinessInsights | null;
    audienceData: IGAudienceData | null;
    contentMetrics: IGContentMetrics | null;
  };
  startTime: number;
  callbacks: ((result: any) => void)[];
}

export default defineBackground(() => {
  const instagramVerifier = new InstagramVerifier();
  const verifiers = new Map([
    ['instagram', instagramVerifier],
  ]);

  // IG Profile Building State Management
  const igProfileSessions = new Map<string, IGProfileSession>();

  // Extension icon click handler
  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  // Message handler for verification requests
  browser.runtime.onMessage.addListener((message: VerificationMessage, sender, sendResponse) => {
    console.log(`📨 [Background] Received message:`, message.type);
    
    try {
      switch (message.type) {
        case 'START_VERIFICATION':
          handleLegacyVerificationRequest(message.platform, message.username, sendResponse);
          return true; // Keep message channel open for async response
          
        case 'CREATE_VERIFICATION_TAB':
          handleTabCreationRequest(message.platform, message.username, sendResponse);
          return true;
          
        case 'ATTACH_DEBUGGER':
          handleDebuggerAttachRequest(message.tabId, message.username, sendResponse);
          return true;
          
        case 'CLEANUP_VERIFICATION':
          handleCleanupRequest(message.tabId, sendResponse);
          return true;

        case 'BUILD_IG_PROFILE_COMPLETE':
          handleIGProfileBuildingRequest(message.username, message.userId, sendResponse);
          return true;
          
        default:
          console.warn(`⚠️ [Background] Unknown message type: ${message.type}`);
          sendResponse({ type: 'VERIFICATION_ERROR', error: 'Unknown message type' });
          return false;
      }
    } catch (error) {
      console.error(`💥 [Background] Error handling message:`, error);
      sendResponse({ type: 'VERIFICATION_ERROR', error: `Message handling failed: ${error}` });
      return false;
    }
  });

  // Legacy verification handler (fallback)
  async function handleLegacyVerificationRequest(platform: string, username: string, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Starting legacy verification request for ${platform}:"${username}"`);
    
    try {
      const verifier = verifiers.get(platform.toLowerCase());
      if (!verifier) {
        sendResponse({
          type: 'VERIFICATION_ERROR',
          error: `Unsupported platform: ${platform}`
        });
        return;
      }

      // Create verification tab
      const tabId = await TabManager.createVerificationTab(platform, username);
      
      // Start verification process before waiting for tab to load
      const verificationPromise = verifier.verifyAccount(username, tabId);
      
      // Wait for tab to load
      await TabManager.waitForTabToLoad(tabId);
      
      // Wait for verification to complete
      const result = await verificationPromise;
      
      // Cleanup
      await Promise.all([
        TabManager.closeTab(tabId),
        DebuggerManager.detachFromTab(tabId)
      ]);

      if (result.success && result.profileData) {
        sendResponse({
          type: 'VERIFICATION_COMPLETE',
          profileData: result.profileData
        });
      } else {
        sendResponse({
          type: 'VERIFICATION_ERROR',
          error: result.error || 'Unknown verification error'
        });
      }
    } catch (error) {
      console.error(`💥 [Background] Legacy verification failed:`, error);
      sendResponse({
        type: 'VERIFICATION_ERROR',
        error: `Verification failed: ${error}`
      });
    }
  }

  // New hierarchical verification handlers
  async function handleTabCreationRequest(platform: string, username: string, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Creating verification tab for ${platform}:"${username}"`);
    
    try {
      const tabId = await TabManager.createVerificationTab(platform, username);
      
      // Wait for tab to load
      await TabManager.waitForTabToLoad(tabId);
      
      sendResponse({
        type: 'TAB_CREATED',
        tabId
      });
    } catch (error) {
      console.error(`💥 [Background] Tab creation failed:`, error);
      sendResponse({
        type: 'TAB_CREATION_ERROR',
        error: (error as Error).message || 'Failed to create verification tab'
      });
    }
  }

  async function handleDebuggerAttachRequest(tabId: number, username: string, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Attaching debugger to tab ${tabId} for "${username}"`);
    
    try {
      await DebuggerManager.attachToTab(tabId, username);
      
      sendResponse({
        type: 'DEBUGGER_ATTACHED'
      });
    } catch (error) {
      console.error(`💥 [Background] Debugger attachment failed:`, error);
      sendResponse({
        type: 'DEBUGGER_ATTACHMENT_ERROR',
        error: (error as Error).message || 'Failed to attach debugger'
      });
    }
  }

  async function handleCleanupRequest(tabId: number, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Cleaning up verification resources for tab ${tabId}`);
    
    try {
      await Promise.all([
        TabManager.closeTab(tabId),
        DebuggerManager.detachFromTab(tabId)
      ]);
      
      sendResponse({
        type: 'CLEANUP_COMPLETE'
      });
    } catch (error) {
      console.warn(`⚠️ [Background] Cleanup completed with warnings:`, error);
      // Don't fail cleanup - just log and continue
      sendResponse({
        type: 'CLEANUP_COMPLETE'
      });
    }
  }

  // Cleanup on tab close to prevent memory leaks
  browser.tabs.onRemoved.addListener((tabId) => {
    console.log(`🗑️ [Background] Tab ${tabId} closed, cleaning up resources`);
    
    // Use try-finally to ensure cleanup happens
    (async () => {
      try {
        await DebuggerManager.detachFromTab(tabId);
      } finally {
        // Always clean up tab tracking even if debugger detach fails
        TabManager.closeTab(tabId).catch(() => {
          // Tab already closed, ignore error
        });
      }
    })();
  });

  // Cleanup on extension shutdown
  browser.runtime.onSuspend?.addListener(() => {
    console.log(`🛑 [Background] Extension suspending, cleaning up all resources`);
    
    try {
      TabManager.cleanup();
    } finally {
      DebuggerManager.cleanup();
    }
  });

  // Complete IG Profile Building Handler
  async function handleIGProfileBuildingRequest(username: string, userId: string, sendResponse: (response: any) => void) {
    const sessionId = `${userId}_${username}_${Date.now()}`;
    console.log(`🚀 [Background] Starting complete IG profile building for "${username}" (Session: ${sessionId})`);
    
    try {
      // Initialize session
      const session: IGProfileSession = {
        sessionId,
        userId,
        username,
        stage: 'account_center',
        collectedData: {
          accountCenterData: null,
          profileData: null,
          insightsData: null,
          audienceData: null,
          contentMetrics: null,
        },
        startTime: Date.now(),
        callbacks: [sendResponse],
      };
      
      igProfileSessions.set(sessionId, session);
      
      // Stage 1: Account Center Profile Collection
      await executeStage1AccountCenter(session);
      
    } catch (error) {
      console.error(`💥 [Background] IG profile building failed:`, error);
      sendResponse({
        type: 'IG_PROFILE_ERROR',
        error: `Profile building failed: ${error}`
      });
      igProfileSessions.delete(sessionId);
    }
  }
  
  // Stage 1: Account Center Profile Collection
  async function executeStage1AccountCenter(session: IGProfileSession) {
    console.log(`📊 [Background] Stage 1: Collecting Account Center data for ${session.username}`);
    
    try {
      // Create tab for account center
      const tabId = await TabManager.createTab('https://accountscenter.instagram.com/profiles/');
      session.tabId = tabId;
      session.stage = 'account_center';
      
      // Wait for tab to load
      await TabManager.waitForTabToLoad(tabId);
      
      // Set up debugger to capture FXAccountsCenterProfilesPageV2Query
      await setupAccountCenterDebugger(session);
      
    } catch (error) {
      console.error(`❌ [Background] Stage 1 failed:`, error);
      session.stage = 'failed';
      throw error;
    }
  }
  
  // Stage 2: Basic Profile Data Collection  
  async function executeStage2BasicProfile(session: IGProfileSession) {
    console.log(`📊 [Background] Stage 2: Collecting basic profile data for ${session.username}`);
    
    try {
      // Navigate to profile page
      const profileUrl = `https://instagram.com/${session.username}`;
      await browser.tabs.update(session.tabId!, { url: profileUrl });
      await TabManager.waitForTabToLoad(session.tabId!);
      
      session.stage = 'basic_profile';
      
      // Set up debugger to capture PolarisProfilePageContentQuery
      await setupProfileDebugger(session);
      
    } catch (error) {
      console.error(`❌ [Background] Stage 2 failed:`, error);
      session.stage = 'failed';
      throw error;
    }
  }
  
  // Stage 3: Business Insights Collection
  async function executeStage3BusinessInsights(session: IGProfileSession) {
    console.log(`📊 [Background] Stage 3: Collecting business insights for ${session.username}`);
    
    // Only for professional accounts
    if (!session.collectedData.profileData || 
        session.collectedData.profileData.accountType === 1) {
      console.log(`⏭️ [Background] Skipping insights - personal account`);
      await executeStage4AudienceData(session);
      return;
    }
    
    try {
      // Navigate to insights page
      await browser.tabs.update(session.tabId!, { url: 'https://instagram.com/accounts/insights/' });
      await TabManager.waitForTabToLoad(session.tabId!);
      
      session.stage = 'insights';
      
      // Set up debugger to capture PolarisAccountInsightsProfileQuery
      await setupInsightsDebugger(session);
      
    } catch (error) {
      console.error(`❌ [Background] Stage 3 failed:`, error);
      session.stage = 'failed';
      throw error;
    }
  }
  
  // Stage 4: Audience Demographics Collection
  async function executeStage4AudienceData(session: IGProfileSession) {
    console.log(`📊 [Background] Stage 4: Collecting audience data for ${session.username}`);
    
    // Only for professional accounts
    if (!session.collectedData.profileData || 
        session.collectedData.profileData.accountType === 1) {
      console.log(`⏭️ [Background] Skipping audience data - personal account`);
      await completeProfileBuilding(session);
      return;
    }
    
    try {
      // Navigate to audience insights
      await browser.tabs.update(session.tabId!, { url: 'https://instagram.com/accounts/insights/audience/' });
      await TabManager.waitForTabToLoad(session.tabId!);
      
      session.stage = 'audience';
      
      // Set up debugger to capture PolarisAccountInsightsFollowersQuery
      await setupAudienceDebugger(session);
      
    } catch (error) {
      console.error(`❌ [Background] Stage 4 failed:`, error);
      session.stage = 'failed';
      throw error;
    }
  }
  
  // Complete Profile Building - Store in Database
  async function completeProfileBuilding(session: IGProfileSession) {
    console.log(`✅ [Background] Completing profile building for ${session.username}`);
    
    try {
      session.stage = 'completed';
      
      // Structure the complete profile data
      const completeProfileData = {
        profileData: session.collectedData.profileData,
        businessInsights: session.collectedData.insightsData,
        audienceData: session.collectedData.audienceData,
        accountCenterData: session.collectedData.accountCenterData,
        contentMetrics: session.collectedData.contentMetrics,
        collectionTimestamp: Date.now(),
        processingDuration: Date.now() - session.startTime,
      };
      
      // Send success response with complete data
      session.callbacks.forEach(callback => {
        callback({
          type: 'IG_PROFILE_COMPLETE',
          username: session.username,
          userId: session.userId,
          profileData: completeProfileData
        });
      });
      
      // Cleanup
      await cleanup(session);
      
    } catch (error) {
      console.error(`❌ [Background] Profile completion failed:`, error);
      session.stage = 'failed';
      throw error;
    }
  }
  
  // Cleanup session resources
  async function cleanup(session: IGProfileSession) {
    console.log(`🧹 [Background] Cleaning up IG profile session: ${session.sessionId}`);
    
    try {
      if (session.tabId) {
        await Promise.all([
          TabManager.closeTab(session.tabId),
          DebuggerManager.detachFromTab(session.tabId)
        ]);
      }
    } finally {
      igProfileSessions.delete(session.sessionId);
    }
  }
  
  // Stage 1: Account Center GraphQL Query Capture
  async function setupAccountCenterDebugger(session: IGProfileSession) {
    console.log(`🔗 [Background] Setting up Account Center debugger for session: ${session.sessionId}`);
    
    return new Promise<void>((resolve, reject) => {
      let isResolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      const cleanup = async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          browser.debugger.onEvent.removeListener(handleDebuggerEvent);
          await browser.debugger.detach({ tabId: session.tabId! });
        } catch (error) {
          console.warn(`⚠️ [Background] Cleanup warning:`, error);
        }
      };

      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== session.tabId || isResolved) return;
        
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          // Target: https://accountscenter.instagram.com/api/graphql/
          if (url.includes('accountscenter.instagram.com/api/graphql/')) {
            const postData = params.request.postData;
            if (postData && postData.includes('FXAccountsCenterProfilesPageV2Query')) {
              console.log(`📤 [Background] Account Center GraphQL request detected`);
            }
          }
        }
        
        if (method === 'Network.responseReceived') {
          const requestId = params.requestId;
          const url = params.response.url;
          
          if (url.includes('accountscenter.instagram.com/api/graphql/')) {
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId: session.tabId! },
                'Network.getResponseBody',
                { requestId },
                async (response: any) => {
                  if (isResolved || !response?.body) return;
                  
                  try {
                    const data = JSON.parse(response.body);
                    
                    // Extract FXAccountsCenterProfilesPageV2Query response
                    if (data?.data?.fx_identity_management?.identities_and_central_identities) {
                      console.log(`✅ [Background] Account Center data captured`);
                      
                      const accountCenterData: IGAccountCenterData = {
                        linkedIdentities: extractLinkedIdentities(data.data.fx_identity_management.identities_and_central_identities),
                        businessIdentities: extractBusinessIdentities(data.data.fx_identity_management.business_identities || [])
                      };
                      
                      session.collectedData.accountCenterData = accountCenterData;
                      isResolved = true;
                      await cleanup();
                      
                      // Proceed to Stage 2
                      await executeStage2BasicProfile(session);
                      resolve();
                    }
                  } catch (error) {
                    console.error(`💥 [Background] Account Center data parsing failed:`, error);
                  }
                }
              );
            }, 100);
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(async () => {
        if (isResolved) return;
        console.log(`⏰ [Background] Account Center capture timeout`);
        isResolved = true;
        await cleanup();
        reject(new Error('Account Center data capture timeout'));
      }, 30000);

      // Attach debugger
      browser.debugger.attach({ tabId: session.tabId! }, '1.3', () => {
        if (browser.runtime.lastError) {
          reject(new Error(`Failed to attach debugger: ${browser.runtime.lastError.message}`));
          return;
        }

        browser.debugger.sendCommand({ tabId: session.tabId! }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            reject(new Error(`Failed to enable network: ${browser.runtime.lastError.message}`));
            return;
          }
          
          console.log(`📡 [Background] Account Center network monitoring enabled`);
          browser.debugger.onEvent.addListener(handleDebuggerEvent);
        });
      });
    });
  }

  // Helper function to extract linked identities
  function extractLinkedIdentities(identitiesData: any): IGAccountCenterData['linkedIdentities'] {
    const linkedIdentities = identitiesData.linked_identities_to_pci || [];
    return linkedIdentities
      .filter((identity: any) => identity.account_type === 'INSTAGRAM')
      .map((identity: any) => ({
        canonicalId: identity.canonical_id,
        accountType: 'INSTAGRAM' as const,
        username: identity.username,
        fullName: identity.full_name,
        identityType: identity.identity_type,
        detailedIdentityType: identity.detailed_identity_type
      }));
  }

  // Helper function to extract business identities  
  function extractBusinessIdentities(businessData: any[]): IGAccountCenterData['businessIdentities'] {
    return businessData
      .filter((identity: any) => identity.identity_type === 'IG_PROFESSIONAL')
      .map((identity: any) => ({
        canonicalId: identity.canonical_id,
        username: identity.username,
        fullName: identity.full_name,
        identityType: 'IG_PROFESSIONAL' as const,
        detailedIdentityType: identity.detailed_identity_type
      }));
  }
  
  // Stage 2: Basic Profile GraphQL Query Capture
  async function setupProfileDebugger(session: IGProfileSession) {
    console.log(`🔗 [Background] Setting up Profile debugger for session: ${session.sessionId}`);
    
    return new Promise<void>((resolve, reject) => {
      let isResolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      const cleanup = async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          browser.debugger.onEvent.removeListener(handleDebuggerEvent);
          await browser.debugger.detach({ tabId: session.tabId! });
        } catch (error) {
          console.warn(`⚠️ [Background] Profile cleanup warning:`, error);
        }
      };

      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== session.tabId || isResolved) return;
        
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          // Target: https://instagram.com/graphql/query
          if (url.includes('instagram.com/graphql/query')) {
            const postData = params.request.postData;
            if (postData && postData.includes('PolarisProfilePageContentQuery')) {
              console.log(`📤 [Background] Profile GraphQL request detected for ${session.username}`);
            }
          }
        }
        
        if (method === 'Network.responseReceived') {
          const requestId = params.requestId;
          const url = params.response.url;
          
          if (url.includes('instagram.com/graphql/query')) {
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId: session.tabId! },
                'Network.getResponseBody',
                { requestId },
                async (response: any) => {
                  if (isResolved || !response?.body) return;
                  
                  try {
                    const data = JSON.parse(response.body);
                    
                    // Extract PolarisProfilePageContentQuery response
                    const user = data?.data?.user || data?.data?.xdt_api__v1__users__web_profile_info?.user;
                    if (user && user.username) {
                      // Verify this is the correct user
                      const normalizedExpected = session.username.toLowerCase().trim();
                      const normalizedReceived = user.username.toLowerCase().trim();
                      
                      if (normalizedExpected === normalizedReceived) {
                        console.log(`✅ [Background] Profile data captured for ${session.username}`);
                        
                        const profileData: IGProfileData = {
                          followerCount: user.follower_count || user.edge_followed_by?.count || 0,
                          accountType: user.account_type || (user.is_business ? 2 : 1),
                          isVerified: user.is_verified || false,
                          category: user.category || user.category_name || ''
                        };
                        
                        session.collectedData.profileData = profileData;
                        isResolved = true;
                        await cleanup();
                        
                        // Proceed to Stage 3
                        await executeStage3BusinessInsights(session);
                        resolve();
                      }
                    }
                  } catch (error) {
                    console.error(`💥 [Background] Profile data parsing failed:`, error);
                  }
                }
              );
            }, 100);
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(async () => {
        if (isResolved) return;
        console.log(`⏰ [Background] Profile capture timeout for ${session.username}`);
        isResolved = true;
        await cleanup();
        reject(new Error('Profile data capture timeout'));
      }, 30000);

      // Attach debugger
      browser.debugger.attach({ tabId: session.tabId! }, '1.3', () => {
        if (browser.runtime.lastError) {
          reject(new Error(`Failed to attach debugger: ${browser.runtime.lastError.message}`));
          return;
        }

        browser.debugger.sendCommand({ tabId: session.tabId! }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            reject(new Error(`Failed to enable network: ${browser.runtime.lastError.message}`));
            return;
          }
          
          console.log(`📡 [Background] Profile network monitoring enabled`);
          browser.debugger.onEvent.addListener(handleDebuggerEvent);
        });
      });
    });
  }
  
  // Stage 3: Business Insights GraphQL Query Capture
  async function setupInsightsDebugger(session: IGProfileSession) {
    console.log(`🔗 [Background] Setting up Insights debugger for session: ${session.sessionId}`);
    
    return new Promise<void>((resolve, reject) => {
      let isResolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let collectedInsights: Partial<IGBusinessInsights> = {};
      
      const cleanup = async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          browser.debugger.onEvent.removeListener(handleDebuggerEvent);
          await browser.debugger.detach({ tabId: session.tabId! });
        } catch (error) {
          console.warn(`⚠️ [Background] Insights cleanup warning:`, error);
        }
      };

      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== session.tabId || isResolved) return;
        
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          if (url.includes('instagram.com/graphql/query')) {
            const postData = params.request.postData;
            if (postData && (
                postData.includes('PolarisAccountInsightsProfileQuery') ||
                postData.includes('PolarisAccountInsightsTopContentByViewsQuery')
            )) {
              console.log(`📤 [Background] Insights GraphQL request detected`);
            }
          }
        }
        
        if (method === 'Network.responseReceived') {
          const requestId = params.requestId;
          const url = params.response.url;
          
          if (url.includes('instagram.com/graphql/query')) {
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId: session.tabId! },
                'Network.getResponseBody',
                { requestId },
                async (response: any) => {
                  if (isResolved || !response?.body) return;
                  
                  try {
                    const data = JSON.parse(response.body);
                    
                    // Extract insights from various query responses
                    const insights = data?.data?.business_manager?.account_insights_node;
                    if (insights) {
                      console.log(`📊 [Background] Processing insights data`);
                      
                      // Profile actions data
                      if (insights.profile_actions) {
                        collectedInsights.profileVisits7d = insights.profile_actions.profile_visits_7d || 0;
                        collectedInsights.profileVisits30d = insights.profile_actions.profile_visits_30d || 0;
                        collectedInsights.profileVisits90d = insights.profile_actions.profile_visits_90d || 0;
                        collectedInsights.accountsReached7d = insights.profile_actions.accounts_reached_7d || 0;
                        collectedInsights.accountsReached30d = insights.profile_actions.accounts_reached_30d || 0;
                        collectedInsights.accountsEngaged7d = insights.profile_actions.accounts_engaged_7d || 0;
                        collectedInsights.accountsEngaged30d = insights.profile_actions.accounts_engaged_30d || 0;
                      }
                      
                      // Follower growth data
                      const followerGrowth = data?.data?.business_manager?.follower_growth;
                      if (followerGrowth) {
                        collectedInsights.followerGrowth7d = followerGrowth.growth_7d?.percentage || 0;
                        collectedInsights.followerGrowth30d = followerGrowth.growth_30d?.percentage || 0;
                        collectedInsights.followerGrowth90d = followerGrowth.growth_90d?.percentage || 0;
                      }
                      
                      // Engagement metrics
                      const engagementMetrics = data?.data?.business_manager?.engagement_metrics;
                      if (engagementMetrics) {
                        collectedInsights.engagementRate = engagementMetrics.overall_engagement_rate || 0;
                      }
                      
                      // Check if we have sufficient insights data
                      const hasBasicInsights = collectedInsights.profileVisits30d !== undefined &&
                                             collectedInsights.accountsReached30d !== undefined;
                      
                      if (hasBasicInsights) {
                        console.log(`✅ [Background] Business insights data captured`);
                        
                        const businessInsights: IGBusinessInsights = {
                          profileVisits7d: collectedInsights.profileVisits7d || 0,
                          profileVisits30d: collectedInsights.profileVisits30d || 0,
                          profileVisits90d: collectedInsights.profileVisits90d || 0,
                          accountsReached7d: collectedInsights.accountsReached7d || 0,
                          accountsReached30d: collectedInsights.accountsReached30d || 0,
                          accountsEngaged7d: collectedInsights.accountsEngaged7d || 0,
                          accountsEngaged30d: collectedInsights.accountsEngaged30d || 0,
                          followerGrowth7d: collectedInsights.followerGrowth7d || 0,
                          followerGrowth30d: collectedInsights.followerGrowth30d || 0,
                          followerGrowth90d: collectedInsights.followerGrowth90d || 0,
                          engagementRate: collectedInsights.engagementRate || 0
                        };
                        
                        session.collectedData.insightsData = businessInsights;
                        isResolved = true;
                        await cleanup();
                        
                        // Proceed to Stage 4
                        await executeStage4AudienceData(session);
                        resolve();
                      }
                    }
                  } catch (error) {
                    console.error(`💥 [Background] Insights data parsing failed:`, error);
                  }
                }
              );
            }, 100);
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(async () => {
        if (isResolved) return;
        console.log(`⏰ [Background] Insights capture timeout`);
        isResolved = true;
        await cleanup();
        
        // Continue with partial data or skip insights
        console.log(`⏭️ [Background] Continuing without complete insights data`);
        await executeStage4AudienceData(session);
        resolve();
      }, 45000); // Longer timeout for insights

      // Attach debugger
      browser.debugger.attach({ tabId: session.tabId! }, '1.3', () => {
        if (browser.runtime.lastError) {
          reject(new Error(`Failed to attach debugger: ${browser.runtime.lastError.message}`));
          return;
        }

        browser.debugger.sendCommand({ tabId: session.tabId! }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            reject(new Error(`Failed to enable network: ${browser.runtime.lastError.message}`));
            return;
          }
          
          console.log(`📡 [Background] Insights network monitoring enabled`);
          browser.debugger.onEvent.addListener(handleDebuggerEvent);
        });
      });
    });
  }
  
  // Stage 4: Audience Demographics GraphQL Query Capture
  async function setupAudienceDebugger(session: IGProfileSession) {
    console.log(`🔗 [Background] Setting up Audience debugger for session: ${session.sessionId}`);
    
    return new Promise<void>((resolve, reject) => {
      let isResolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let collectedAudience: Partial<IGAudienceData> = {};
      
      const cleanup = async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          browser.debugger.onEvent.removeListener(handleDebuggerEvent);
          await browser.debugger.detach({ tabId: session.tabId! });
        } catch (error) {
          console.warn(`⚠️ [Background] Audience cleanup warning:`, error);
        }
      };

      const handleDebuggerEvent = (source: any, method: string, params: any) => {
        if (source.tabId !== session.tabId || isResolved) return;
        
        if (method === 'Network.requestWillBeSent') {
          const url = params.request.url;
          if (url.includes('instagram.com/graphql/query')) {
            const postData = params.request.postData;
            if (postData && postData.includes('PolarisAccountInsightsFollowersQuery')) {
              console.log(`📤 [Background] Audience demographics GraphQL request detected`);
            }
          }
        }
        
        if (method === 'Network.responseReceived') {
          const requestId = params.requestId;
          const url = params.response.url;
          
          if (url.includes('instagram.com/graphql/query')) {
            setTimeout(() => {
              if (isResolved) return;
              
              browser.debugger.sendCommand(
                { tabId: session.tabId! },
                'Network.getResponseBody',
                { requestId },
                async (response: any) => {
                  if (isResolved || !response?.body) return;
                  
                  try {
                    const data = JSON.parse(response.body);
                    
                    // Extract audience demographics from follower insights
                    const insightsNode = data?.data?.business_manager?.account_insights_node;
                    const followerDemographics = insightsNode?.follower_demographics;
                    
                    if (followerDemographics) {
                      console.log(`👥 [Background] Processing audience demographics`);
                      
                      // Gender distribution
                      if (followerDemographics.gender) {
                        const genderData = followerDemographics.gender;
                        collectedAudience.genderDistribution = {
                          male: genderData.find((g: any) => g.gender === 'male')?.percentage || 0,
                          female: genderData.find((g: any) => g.gender === 'female')?.percentage || 0,
                          other: genderData.find((g: any) => g.gender === 'other')?.percentage || 0
                        };
                      }
                      
                      // Age distribution
                      if (followerDemographics.age_ranges) {
                        const ageData = followerDemographics.age_ranges;
                        collectedAudience.ageDistribution = {
                          '13-17': ageData.find((a: any) => a.age_range === '13-17')?.percentage || 0,
                          '18-24': ageData.find((a: any) => a.age_range === '18-24')?.percentage || 0,
                          '25-34': ageData.find((a: any) => a.age_range === '25-34')?.percentage || 0,
                          '35-44': ageData.find((a: any) => a.age_range === '35-44')?.percentage || 0,
                          '45-54': ageData.find((a: any) => a.age_range === '45-54')?.percentage || 0,
                          '55-64': ageData.find((a: any) => a.age_range === '55-64')?.percentage || 0,
                          '65+': ageData.find((a: any) => a.age_range === '65+')?.percentage || 0
                        };
                      }
                      
                      // Top location
                      if (followerDemographics.top_locations && followerDemographics.top_locations.length > 0) {
                        collectedAudience.topLocation = followerDemographics.top_locations[0].location_name || '';
                      }
                      
                      // Check if we have sufficient audience data
                      const hasBasicDemographics = collectedAudience.genderDistribution !== undefined ||
                                                  collectedAudience.ageDistribution !== undefined;
                      
                      if (hasBasicDemographics) {
                        console.log(`✅ [Background] Audience demographics captured`);
                        
                        const audienceData: IGAudienceData = {
                          genderDistribution: collectedAudience.genderDistribution || {
                            male: 0, female: 0, other: 0
                          },
                          ageDistribution: collectedAudience.ageDistribution || {
                            '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0,
                            '45-54': 0, '55-64': 0, '65+': 0
                          },
                          topLocation: collectedAudience.topLocation || ''
                        };
                        
                        session.collectedData.audienceData = audienceData;
                        isResolved = true;
                        await cleanup();
                        
                        // Complete the profile building process
                        await completeProfileBuilding(session);
                        resolve();
                      }
                    }
                  } catch (error) {
                    console.error(`💥 [Background] Audience data parsing failed:`, error);
                  }
                }
              );
            }, 100);
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(async () => {
        if (isResolved) return;
        console.log(`⏰ [Background] Audience demographics capture timeout`);
        isResolved = true;
        await cleanup();
        
        // Complete without audience data
        console.log(`⏭️ [Background] Completing without audience demographics`);
        await completeProfileBuilding(session);
        resolve();
      }, 45000); // Longer timeout for audience data

      // Attach debugger
      browser.debugger.attach({ tabId: session.tabId! }, '1.3', () => {
        if (browser.runtime.lastError) {
          reject(new Error(`Failed to attach debugger: ${browser.runtime.lastError.message}`));
          return;
        }

        browser.debugger.sendCommand({ tabId: session.tabId! }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            reject(new Error(`Failed to enable network: ${browser.runtime.lastError.message}`));
            return;
          }
          
          console.log(`📡 [Background] Audience demographics network monitoring enabled`);
          browser.debugger.onEvent.addListener(handleDebuggerEvent);
        });
      });
    });
  }

  console.log('🚀 [Background] Instagram verification background script initialized with MV3 support');
});