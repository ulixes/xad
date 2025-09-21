import { handleExecuteAction } from '@/src/background/actionHandler';

export default defineBackground(() => {
  // Extension icon click handler
  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  // Message listener for handling various extension actions
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // Handle action execution
    if (message.type === 'executeAction') {
      const result = await handleExecuteAction(message.payload);
      sendResponse(result);
      return true; // Keep the message channel open for async response
    }
    
    // Handle TikTok account addition - THREE PHASE APPROACH
    else if (message.type === "addTikTokAccount") {
      const { handle, accountId } = message;
      console.log("🚀 STARTING TIKTOK ACCOUNT ADDITION FOR:", handle);
      console.log("Account ID:", accountId);
      
      try {
        // Store temporary collection state
        const collectionState = {
          accountId,
          handle,
          profileData: null as any,
          viewerDemographicsData: null as any,
          followerDemographicsData: null as any,
          tabId: null as number | null
        };
        
        // PHASE 1: Collect basic profile data first
        const studioUrl = `https://www.tiktok.com/tiktokstudio/analytics/overview?tiktok_collect=true&account_id=${accountId}&handle=${handle}&phase=profile`;
        console.log("📍 PHASE 1: Navigating to TikTok Studio for profile data:", studioUrl);
        
        const tab = await browser.tabs.create({ url: studioUrl });
        collectionState.tabId = tab.id!;
        console.log('✅ Opened TikTok Studio with collection params in URL');
        console.log('Tab ID:', tab.id);
        
        // Store collection state for later reference
        (globalThis as any).tiktokCollectionState = collectionState;
        
        // Send message to content script after a delay
        setTimeout(async () => {
          try {
            await browser.tabs.sendMessage(tab.id!, {
              type: 'COLLECT_TIKTOK_DATA',
              accountId: accountId,
              handle: handle,
              phase: 'profile'
            });
            console.log('Sent profile collection message to content script');
          } catch (e) {
            console.log('Message send failed (expected if already collecting):', e);
          }
        }, 2000);
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error adding TikTok account:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true;
    }
    
    // Handle TikTok profile data collection (PHASE 1)
    else if (message.type === "TIKTOK_DATA_COLLECTED") {
      const { accountId, handle, payload } = message;
      console.log("✅ PHASE 1 COMPLETE: TikTok profile data collected:", payload, "for account:", accountId);
      
      // Store profile data
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId) {
        collectionState.profileData = payload;
        
        // PHASE 2: Navigate to viewer demographics page with 28-day range
        console.log("📍 PHASE 2: Navigating to analytics/viewers for VIEWER demographics (28-day range)");
        const dateRange = encodeURIComponent('{"type":"fixed","pastDay":28}');
        const viewerDemographicsUrl = `https://www.tiktok.com/tiktokstudio/analytics/viewers?dateRange=${dateRange}&account_id=${accountId}&handle=${handle}&phase=viewer_demographics`;
        
        // Use the same tab or create new if closed
        if (sender.tab?.id) {
          browser.tabs.update(sender.tab.id, { url: viewerDemographicsUrl }).then(() => {
            console.log("✅ Navigated to viewer demographics page");
            
            // Send message to collect viewer demographics after navigation
            setTimeout(async () => {
              try {
                await browser.tabs.sendMessage(sender.tab!.id, {
                  type: 'START_DEMOGRAPHICS_COLLECTION',
                  accountId: accountId,
                  handle: handle
                });
                console.log('Sent viewer demographics collection command');
              } catch (e) {
                console.log('Failed to send viewer demographics message:', e);
              }
            }, 3000);
          });
        } else {
          // Create new tab if original was closed
          browser.tabs.create({ url: viewerDemographicsUrl });
        }
        
        // Set a timeout for viewer demographics collection (15 seconds)
        setTimeout(() => {
          if (collectionState.profileData && !collectionState.viewerDemographicsData) {
            console.log("⚠️ Viewer demographics timeout - sending profile data only");
            // Send profile data without demographics
            browser.runtime.sendMessage({
              type: 'tiktokAccountComplete',
              accountId: accountId,
              handle: handle,
              profileData: collectionState.profileData,
              hasViewerDemographics: false,
              hasFollowerDemographics: false
            });
            
            // Clean up
            delete (globalThis as any).tiktokCollectionState;
            
            // Close tab if still open
            if (collectionState.tabId) {
              browser.tabs.remove(collectionState.tabId).catch(() => {});
            }
          }
        }, 15000);
      } else {
        // Fallback: send profile data immediately if no collection state
        browser.runtime.sendMessage({
          type: 'tiktokAccountComplete',
          accountId: accountId,
          handle: handle,
          profileData: payload,
          hasViewerDemographics: false,
          hasFollowerDemographics: false
        });
        
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
      }
      
      return true;
    }
    
    // Handle TikTok VIEWER demographics collection (PHASE 2)
    else if (message.type === "TIKTOK_DEMOGRAPHICS_COLLECTED") {
      const { accountId, handle, demographics, viewerMetrics } = message;
      console.log("✅ PHASE 2 COMPLETE: VIEWER demographics collected for:", handle);
      if (viewerMetrics) {
        console.log("📊 Also received viewer metrics time-series data");
      }
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId) {
        collectionState.viewerDemographicsData = demographics;
        collectionState.viewerMetricsData = viewerMetrics;
        
        // PHASE 3: Navigate to follower demographics page
        console.log("📍 PHASE 3: Navigating to analytics/followers for FOLLOWER demographics");
        const followerDemographicsUrl = `https://www.tiktok.com/tiktokstudio/analytics/followers?account_id=${accountId}&handle=${handle}&phase=follower_demographics`;
        
        // Use the same tab or create new if closed
        if (sender.tab?.id) {
          browser.tabs.update(sender.tab.id, { url: followerDemographicsUrl }).then(() => {
            console.log("✅ Navigated to follower demographics page");
            
            // Send message to collect follower demographics after navigation
            setTimeout(async () => {
              try {
                await browser.tabs.sendMessage(sender.tab!.id, {
                  type: 'START_FOLLOWER_DEMOGRAPHICS_COLLECTION',
                  accountId: accountId,
                  handle: handle
                });
                console.log('Sent follower demographics collection command');
              } catch (e) {
                console.log('Failed to send follower demographics message:', e);
              }
            }, 3000);
          });
        } else {
          // Create new tab if original was closed
          browser.tabs.create({ url: followerDemographicsUrl });
        }
        
        // Set a timeout for follower demographics collection (15 seconds)
        setTimeout(() => {
          if (collectionState.profileData && collectionState.viewerDemographicsData && !collectionState.followerDemographicsData) {
            console.log("⚠️ Follower demographics timeout - sending data without follower demographics");
            
            // Merge profile and viewer demographics data
            const enrichedProfileData = {
              ...collectionState.profileData,
              viewerDemographics: {
                gender: {
                  female: demographics.genderFemale,
                  male: demographics.genderMale,
                  other: demographics.genderOther
                },
                age: {
                  '18-24': demographics.age18to24,
                  '25-34': demographics.age25to34,
                  '35-44': demographics.age35to44,
                  '45-54': demographics.age45to54,
                  '55+': demographics.age55plus
                },
                geography: demographics.geography,
                viewers: {
                  unique: demographics.uniqueViewers,
                  new: demographics.newViewers,
                  returning: demographics.returningViewers
                }
              },
              followerDemographics: null
            };
            
            // Send data with viewer demographics but without follower demographics
            browser.runtime.sendMessage({
              type: 'tiktokAccountComplete',
              accountId: accountId,
              handle: handle,
              profileData: enrichedProfileData,
              hasViewerDemographics: true,
              hasFollowerDemographics: false
            });
            
            // Clean up
            delete (globalThis as any).tiktokCollectionState;
            
            // Close tab if still open
            if (collectionState.tabId) {
              browser.tabs.remove(collectionState.tabId).catch(() => {});
            }
          }
        }, 15000);
      }
      
      return true;
    }
    
    // Handle TikTok FOLLOWER demographics collection (PHASE 3)
    else if (message.type === "TIKTOK_FOLLOWER_DEMOGRAPHICS_COLLECTED") {
      const { accountId, handle, followerDemographics } = message;
      console.log("✅ PHASE 3 COMPLETE: FOLLOWER demographics collected for:", handle);
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId) {
        collectionState.followerDemographicsData = followerDemographics;
        
        // Merge all three phases of data
        const enrichedProfileData = {
          ...collectionState.profileData,
          viewerMetrics: collectionState.viewerMetricsData || null,
          viewerDemographics: collectionState.viewerDemographicsData ? {
            gender: {
              female: collectionState.viewerDemographicsData.genderFemale,
              male: collectionState.viewerDemographicsData.genderMale,
              other: collectionState.viewerDemographicsData.genderOther
            },
            age: {
              '18-24': collectionState.viewerDemographicsData.age18to24,
              '25-34': collectionState.viewerDemographicsData.age25to34,
              '35-44': collectionState.viewerDemographicsData.age35to44,
              '45-54': collectionState.viewerDemographicsData.age45to54,
              '55+': collectionState.viewerDemographicsData.age55plus
            },
            geography: collectionState.viewerDemographicsData.geography,
            viewers: {
              unique: collectionState.viewerDemographicsData.uniqueViewers,
              new: collectionState.viewerDemographicsData.newViewers,
              returning: collectionState.viewerDemographicsData.returningViewers
            }
          } : null,
          followerDemographics: followerDemographics ? {
            followerCount: followerDemographics.followerCount,
            gender: {
              female: followerDemographics.genderFemale,
              male: followerDemographics.genderMale,
              other: followerDemographics.genderOther
            },
            age: {
              '18-24': followerDemographics.age18to24,
              '25-34': followerDemographics.age25to34,
              '35-44': followerDemographics.age35to44,
              '45-54': followerDemographics.age45to54,
              '55+': followerDemographics.age55plus
            },
            geography: followerDemographics.geography,
            activity: {
              active: followerDemographics.activeFollowers,
              inactive: followerDemographics.inactiveFollowers
            }
          } : null
        };
        
        console.log("📊 COMPLETE ENRICHED PROFILE DATA (ALL 3 PHASES):", enrichedProfileData);
        
        // Send complete enriched data to sidepanel
        browser.runtime.sendMessage({
          type: 'tiktokAccountComplete',
          accountId: accountId,
          handle: handle,
          profileData: enrichedProfileData,
          hasViewerDemographics: true,
          hasFollowerDemographics: true
        });
        
        // Clean up
        delete (globalThis as any).tiktokCollectionState;
        
        // Close the tab
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
      }
      
      return true;
    }
    
    // Handle VIEWER demographics collection failure
    else if (message.type === "TIKTOK_DEMOGRAPHICS_FAILED") {
      const { accountId, handle, reason } = message;
      console.log("⚠️ VIEWER demographics collection failed:", reason);
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId && collectionState.profileData) {
        // Still try to get follower demographics
        console.log("📍 Attempting PHASE 3 anyway: Navigating to analytics/followers");
        const followerDemographicsUrl = `https://www.tiktok.com/tiktokstudio/analytics/followers?account_id=${accountId}&handle=${handle}&phase=follower_demographics`;
        
        if (sender.tab?.id) {
          browser.tabs.update(sender.tab.id, { url: followerDemographicsUrl }).then(() => {
            setTimeout(async () => {
              try {
                await browser.tabs.sendMessage(sender.tab!.id, {
                  type: 'START_FOLLOWER_DEMOGRAPHICS_COLLECTION',
                  accountId: accountId,
                  handle: handle
                });
                console.log('Sent follower demographics collection command after viewer failure');
              } catch (e) {
                console.log('Failed to send follower demographics message:', e);
              }
            }, 3000);
          });
        }
      }
      
      return true;
    }
    
    // Handle FOLLOWER demographics collection failure
    else if (message.type === "TIKTOK_FOLLOWER_DEMOGRAPHICS_FAILED") {
      const { accountId, handle, reason } = message;
      console.log("⚠️ FOLLOWER demographics collection failed:", reason);
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId && collectionState.profileData) {
        // Send data with whatever we collected
        const enrichedProfileData = {
          ...collectionState.profileData,
          viewerDemographics: collectionState.viewerDemographicsData ? {
            gender: {
              female: collectionState.viewerDemographicsData.genderFemale,
              male: collectionState.viewerDemographicsData.genderMale,
              other: collectionState.viewerDemographicsData.genderOther
            },
            age: {
              '18-24': collectionState.viewerDemographicsData.age18to24,
              '25-34': collectionState.viewerDemographicsData.age25to34,
              '35-44': collectionState.viewerDemographicsData.age35to44,
              '45-54': collectionState.viewerDemographicsData.age45to54,
              '55+': collectionState.viewerDemographicsData.age55plus
            },
            geography: collectionState.viewerDemographicsData.geography,
            viewers: {
              unique: collectionState.viewerDemographicsData.uniqueViewers,
              new: collectionState.viewerDemographicsData.newViewers,
              returning: collectionState.viewerDemographicsData.returningViewers
            }
          } : null,
          followerDemographics: null
        };
        
        browser.runtime.sendMessage({
          type: 'tiktokAccountComplete',
          accountId: accountId,
          handle: handle,
          profileData: enrichedProfileData,
          hasViewerDemographics: !!collectionState.viewerDemographicsData,
          hasFollowerDemographics: false
        });
        
        // Clean up
        delete (globalThis as any).tiktokCollectionState;
        
        // Close the tab
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
      }
      
      return true;
    }
    
    // Add handler for requesting demographics info (for studio script)
    else if (message.type === "REQUEST_DEMOGRAPHICS_INFO") {
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState) {
        sendResponse({
          accountId: collectionState.accountId,
          handle: collectionState.handle
        });
      } else {
        sendResponse(null);
      }
      return true;
    }
  });
});