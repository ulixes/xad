export interface ActionPayload {
  actionId: string;
  actionRunId?: string;  // Database action run ID
  url: string;
  actionType: string;
  platform: string;
  accountHandle: string;
}

// Track active actions
const activeActions = new Map<string, {
  tabId: number;
  actionType: string;
  platform: string;
  startTime: number;
  actionRunId?: string;
}>();

export async function handleExecuteAction(payload: ActionPayload): Promise<{ success: boolean; error?: string }> {
  const { actionId, actionRunId, url, actionType, platform, accountHandle } = payload;
  
  console.log('Executing action:', {
    actionId,
    url,
    actionType,
    platform,
    accountHandle
  });

  // Log comment action for debugging
  if (actionType === 'comment') {
    console.log('Processing comment action on TikTok post:', url);
  }

  try {
    // Create a new tab with the action URL
    const tab = await browser.tabs.create({ 
      url,
      active: true // Make the tab active so user can see the action
    });

    if (!tab.id) {
      throw new Error('Failed to create tab');
    }

    // Store active action info
    activeActions.set(actionId, {
      tabId: tab.id,
      actionType,
      platform,
      startTime: Date.now(),
      actionRunId
    });

    // Wait for the tab to load
    await new Promise<void>(resolve => {
      const listener = (tabId: number, changeInfo: any) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          browser.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });

    console.log('Tab loaded, attempting to inject and communicate with content script...');

    // For Instagram, inject and communicate with content script
    if (platform.toLowerCase() === 'instagram') {
      try {
        console.log(`Injecting Instagram content script into tab ${tab.id}`);
        
        // First, inject the content script
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-scripts/instagram.js']
        });
        
        console.log('Content script injected, waiting for initialization...');
        
        // Wait for content script to initialize
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log(`Sending tracking request to Instagram content script on tab ${tab.id}`);
        
        await browser.tabs.sendMessage(tab.id, {
          type: 'TRACK_ACTION',
          actionId,
          actionType,
          targetUrl: url
        });
        
        console.log('Tracking request sent successfully to Instagram content script');
        
        // Don't send completion here - let the content script handle it
        return { success: true };
        
      } catch (err) {
        console.error('Failed to communicate with Instagram content script:', err);
        
        // If content script isn't available, report error
        activeActions.delete(actionId);
        
        await browser.runtime.sendMessage({
          type: 'actionCompleted',
          payload: {
            actionId,
            success: false,
            error: 'Instagram tracking failed. Please ensure the extension has permission to run on Instagram.'
          }
        });
        
        return { 
          success: false, 
          error: 'Content script not available on Instagram' 
        };
      }
    } 
    // For TikTok, communicate with content script (already auto-loaded via manifest)
    else if (platform.toLowerCase() === 'tiktok') {
      try {
        console.log(`Checking if TikTok content script is ready on tab ${tab.id}`);
        
        // First, try to ping the content script to see if it's already loaded
        let contentScriptReady = false;
        try {
          const response = await browser.tabs.sendMessage(tab.id, { 
            type: 'CHECK_STATUS' 
          });
          contentScriptReady = response?.isActive === true;
          console.log('TikTok content script status:', response);
        } catch (pingError) {
          console.log('TikTok content script not responding, will inject it');
        }
        
        // If content script is not ready, inject it
        if (!contentScriptReady) {
          console.log(`Injecting TikTok content script into tab ${tab.id}`);
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/tiktok.js']
          });
          console.log('TikTok content script injected, waiting for initialization...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log('TikTok content script already loaded and ready');
        }
        
        console.log(`Sending tracking request to TikTok content script on tab ${tab.id}`);
        
        await browser.tabs.sendMessage(tab.id, {
          type: 'TRACK_ACTION',
          actionId,
          actionType,
          targetUrl: url
        });
        
        console.log('Tracking request sent successfully to TikTok content script');
        
        // Don't send completion here - let the content script handle it
        return { success: true };
        
      } catch (err) {
        console.error('Failed to communicate with TikTok content script:', err);
        
        // If content script isn't available, report error
        activeActions.delete(actionId);
        
        await browser.runtime.sendMessage({
          type: 'actionCompleted',
          payload: {
            actionId,
            success: false,
            error: 'TikTok tracking failed. Please ensure the extension has permission to run on TikTok.'
          }
        });
        
        return { 
          success: false, 
          error: 'Content script not available on TikTok' 
        };
      }
    } else {
      // For non-Instagram platforms, use timer-based completion
      console.log(`Non-Instagram platform (${platform}), using timer-based completion`);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Clean up
      activeActions.delete(actionId);
      
      // Send completion
      await browser.runtime.sendMessage({
        type: 'actionCompleted',
        payload: {
          actionId,
          success: true,
          error: null
        }
      });
      
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to execute action:', error);
    
    // Clean up
    if (activeActions.has(actionId)) {
      activeActions.delete(actionId);
    }
    
    // Send error message back to sidepanel
    await browser.runtime.sendMessage({
      type: 'actionCompleted',
      payload: {
        actionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Listen for completion messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Debug messages from TikTok content script
  if (message.type === 'TIKTOK_DEBUG') {
    console.log('[TikTok Debug]', message.message, message);
    sendResponse({ received: true });
    return true;
  }
  
  if (message.type === 'TIKTOK_ACTION_RECEIVED') {
    console.log('[TikTok] Action acknowledged by content script:', message);
    sendResponse({ received: true });
    return true;
  }
  
  if (message.type === 'ACTION_COMPLETED') {
    const { actionId, success, details, timestamp } = message.payload;
    
    console.log('Action completed from content script:', {
      actionId,
      success,
      details,
      timestamp
    });

    const actionInfo = activeActions.get(actionId);
    if (actionInfo) {
      // Close the tab after a short delay
      setTimeout(async () => {
        try {
          await browser.tabs.remove(actionInfo.tabId);
        } catch (err) {
          console.log('Tab might already be closed');
        }
      }, 1500);

      // Clean up
      activeActions.delete(actionId);
    }

    // Forward completion message to sidepanel
    browser.runtime.sendMessage({
      type: 'actionCompleted',
      payload: {
        actionId,
        success,
        details,
        error: success ? null : (details?.error || 'Action failed')
      }
    });

    sendResponse({ received: true });
    return true;
  }
});