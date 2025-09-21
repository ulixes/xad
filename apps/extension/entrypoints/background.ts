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
    
    // Handle TikTok account addition - TWO PHASE APPROACH
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
          demographicsData: null as any,
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
        
        // PHASE 2: Navigate to demographics page
        console.log("📍 PHASE 2: Navigating to analytics/viewers for demographics");
        const demographicsUrl = `https://www.tiktok.com/tiktokstudio/analytics/viewers?account_id=${accountId}&handle=${handle}&phase=demographics`;
        
        // Use the same tab or create new if closed
        if (sender.tab?.id) {
          browser.tabs.update(sender.tab.id, { url: demographicsUrl }).then(() => {
            console.log("✅ Navigated to demographics page");
            
            // Send message to collect demographics after navigation
            setTimeout(async () => {
              try {
                await browser.tabs.sendMessage(sender.tab!.id, {
                  type: 'START_DEMOGRAPHICS_COLLECTION',
                  accountId: accountId,
                  handle: handle
                });
                console.log('Sent demographics collection command');
              } catch (e) {
                console.log('Failed to send demographics message:', e);
              }
            }, 3000);
          });
        } else {
          // Create new tab if original was closed
          browser.tabs.create({ url: demographicsUrl });
        }
        
        // Set a timeout for demographics collection (10 seconds)
        setTimeout(() => {
          if (collectionState.profileData && !collectionState.demographicsData) {
            console.log("⚠️ Demographics timeout - sending profile data only");
            // Send profile data without demographics
            browser.runtime.sendMessage({
              type: 'tiktokAccountComplete',
              accountId: accountId,
              handle: handle,
              profileData: collectionState.profileData,
              hasDemographics: false
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
          hasDemographics: false
        });
        
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
      }
      
      return true;
    }
    
    // Handle TikTok demographics collection (PHASE 2)
    else if (message.type === "TIKTOK_DEMOGRAPHICS_COLLECTED") {
      const { accountId, handle, demographics } = message;
      console.log("✅ PHASE 2 COMPLETE: Demographics collected for:", handle);
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId) {
        collectionState.demographicsData = demographics;
        
        // Merge profile and demographics data
        const enrichedProfileData = {
          ...collectionState.profileData,
          demographics: {
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
          }
        };
        
        console.log("📊 ENRICHED PROFILE DATA:", enrichedProfileData);
        
        // Send complete enriched data to sidepanel
        browser.runtime.sendMessage({
          type: 'tiktokAccountComplete',
          accountId: accountId,
          handle: handle,
          profileData: enrichedProfileData,
          hasDemographics: true
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
    
    // Handle demographics collection failure
    else if (message.type === "TIKTOK_DEMOGRAPHICS_FAILED") {
      const { accountId, handle, reason } = message;
      console.log("⚠️ Demographics collection failed:", reason);
      
      const collectionState = (globalThis as any).tiktokCollectionState;
      if (collectionState && collectionState.accountId === accountId && collectionState.profileData) {
        // Send profile data without demographics
        browser.runtime.sendMessage({
          type: 'tiktokAccountComplete',
          accountId: accountId,
          handle: handle,
          profileData: collectionState.profileData,
          hasDemographics: false
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