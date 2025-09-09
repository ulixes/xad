import { InstagramVerifier } from '../src/services/InstagramVerifier';
import { VerificationMessage } from '../src/types/verification';

export default defineBackground(() => {
  const instagramVerifier = new InstagramVerifier();
  const verifiers = new Map([
    ['instagram', instagramVerifier],
  ]);

  // Extension icon click handler
  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  // Message handler for verification requests
  browser.runtime.onMessage.addListener((message: VerificationMessage, sender, sendResponse) => {
    if (message.type === 'START_VERIFICATION') {
      handleVerificationRequest(message.platform, message.username, sendResponse);
      return true; // Keep message channel open for async response
    }
  });

  async function handleVerificationRequest(platform: string, username: string, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Starting verification request for ${platform}:${username}`);
    
    try {
      const verifier = verifiers.get(platform.toLowerCase());
      
      if (!verifier) {
        console.error(`❌ [Background] Unsupported platform: ${platform}`);
        sendResponse({
          type: 'VERIFICATION_ERROR',
          error: `Unsupported platform: ${platform}`
        });
        return;
      }

      console.log(`✅ [Background] Found verifier for platform: ${platform}`);

      // Create new tab for the verification - must be active for Instagram to load properly
      const profileUrl = getProfileUrl(platform, username);
      console.log(`🌐 [Background] Creating tab for URL: ${profileUrl}`);
      
      const tab = await browser.tabs.create({ 
        url: profileUrl,
        active: true // Instagram requires active tab to load GraphQL requests
      });

      if (!tab.id) {
        console.error(`❌ [Background] Failed to create verification tab`);
        sendResponse({
          type: 'VERIFICATION_ERROR',
          error: 'Failed to create verification tab'
        });
        return;
      }

      console.log(`📱 [Background] Created verification tab with ID: ${tab.id}`);

      // Start verification process BEFORE waiting for tab to load
      // This ensures we catch GraphQL requests that happen during initial page load
      console.log(`🔍 [Background] Starting verification process early to catch initial requests...`);
      const verificationPromise = verifier.verifyAccount(username, tab.id);

      // Wait for tab to load (but verification is already running in parallel)
      console.log(`⏳ [Background] Waiting for tab to load...`);
      await waitForTabToLoad(tab.id);
      console.log(`✅ [Background] Tab loaded successfully`);

      // Wait for verification to complete
      console.log(`⏳ [Background] Waiting for verification to complete...`);
      const result = await verificationPromise;
      console.log(`📋 [Background] Verification result:`, { success: result.success, error: result.error });

      // Close the verification tab
      console.log(`🗑️ [Background] Closing verification tab: ${tab.id}`);
      await browser.tabs.remove(tab.id);

      if (result.success && result.profileData) {
        console.log(`✅ [Background] Verification successful! Sending profile data back.`);
        sendResponse({
          type: 'VERIFICATION_COMPLETE',
          profileData: result.profileData
        });
      } else {
        console.error(`❌ [Background] Verification failed:`, result.error);
        sendResponse({
          type: 'VERIFICATION_ERROR',
          error: result.error || 'Unknown verification error'
        });
      }

    } catch (error) {
      console.error(`💥 [Background] Verification process crashed:`, error);
      sendResponse({
        type: 'VERIFICATION_ERROR',
        error: `Verification failed: ${error}`
      });
    }
  }

  function getProfileUrl(platform: string, username: string): string {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return `https://www.instagram.com/${username}/`;
      case 'twitter':
      case 'x':
        return `https://x.com/${username}`;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  function waitForTabToLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const listener = (id: number, changeInfo: any) => {
        if (id === tabId && changeInfo.status === 'complete') {
          browser.tabs.onUpdated.removeListener(listener);
          // Give a moment for JavaScript to execute
          setTimeout(resolve, 1000);
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }

  // Cleanup on tab close
  browser.tabs.onRemoved.addListener((tabId) => {
    // Detach debugger if attached
    browser.debugger.detach({ tabId }, () => {
      // Ignore errors - tab might not have debugger attached
    });
  });
});
