export default defineBackground(() => {
  console.log('Background actions handler initialized');

  // Track active actions
  const activeActions = new Map<string, {
    tabId: number;
    actionType: string;
    platform: string;
    startTime: number;
  }>();

  // Message listener for executing actions
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'executeAction') {
      const { actionId, url, actionType, platform, accountHandle } = message.payload;
      
      console.log('Executing action:', {
        actionId,
        url,
        actionType,
        platform,
        accountHandle
      });

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
          startTime: Date.now()
        });

        // Wait for the tab to load
        await new Promise<void>((resolve) => {
          const listener = (tabId: number, changeInfo: any) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              browser.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          browser.tabs.onUpdated.addListener(listener);
        });

        console.log('Tab loaded, sending tracking request to content script');

        // Notify sidepanel that tracking has started
        await browser.runtime.sendMessage({
          type: 'actionTracking',
          payload: {
            actionId,
            status: 'tracking'
          }
        }).catch(() => {
          // Sidepanel might not be listening
        });

        // Send message to content script to start tracking
        try {
          console.log(`Attempting to send tracking request to tab ${tab.id} for ${platform} action`);
          await browser.tabs.sendMessage(tab.id, {
            type: 'TRACK_ACTION',
            actionId,
            actionType,
            targetUrl: url
          });
          console.log('Tracking request sent successfully to content script');
        } catch (err) {
          console.warn('Content script not ready, error:', err);
          console.log('Waiting 2 seconds for content script to load...');
          // Wait longer for content script to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            console.log('Retrying tracking request...');
            await browser.tabs.sendMessage(tab.id, {
              type: 'TRACK_ACTION',
              actionId,
              actionType,
              targetUrl: url
            });
            console.log('Tracking request sent successfully on retry');
          } catch (retryErr) {
            console.error('Content script communication failed after retry:', retryErr);
            console.error('Platform:', platform, 'URL:', url);
            // For non-Instagram platforms or if content script isn't available,
            // fall back to timer-based completion
            await handleFallbackCompletion(actionId, tab.id);
          }
        }

        sendResponse({ success: true, message: 'Action tracking started' });
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

        sendResponse({ success: false, error });
      }

      return true; // Keep the message channel open for async response
    }

    // Handle completion messages from content scripts
    if (message.type === 'ACTION_COMPLETED') {
      const { actionId, success, details, timestamp } = message.payload;
      
      console.log('Action completed:', {
        actionId,
        success,
        details,
        timestamp
      });

      const actionInfo = activeActions.get(actionId);
      if (actionInfo) {
        // Close the tab after a short delay to let user see the result
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
      await browser.runtime.sendMessage({
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

  // Fallback completion for non-tracked platforms
  async function handleFallbackCompletion(actionId: string, tabId: number) {
    console.log('Using fallback completion for action:', actionId);
    
    const actionInfo = activeActions.get(actionId);
    
    // Only use fallback for non-Instagram platforms
    if (actionInfo?.platform?.toLowerCase() === 'instagram') {
      console.error('Instagram content script failed to load - action cannot be tracked');
      
      // Clean up
      activeActions.delete(actionId);
      
      // Report error for Instagram
      await browser.runtime.sendMessage({
        type: 'actionCompleted',
        payload: {
          actionId,
          success: false,
          error: 'Instagram tracking script failed to load. Please refresh and try again.',
          details: { fallback: true, reason: 'content_script_failed' }
        }
      });
      
      // Keep tab open for manual completion
      return;
    }
    
    // For non-Instagram platforms, wait for manual action
    console.log('Non-Instagram platform detected, waiting for manual action...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds for manual action
    
    // Assume success for non-Instagram platforms
    const success = true;
    
    // Close tab
    setTimeout(async () => {
      try {
        await browser.tabs.remove(tabId);
      } catch (err) {
        console.log('Tab might already be closed');
      }
    }, 1000);

    // Clean up
    activeActions.delete(actionId);
    
    // Send completion
    await browser.runtime.sendMessage({
      type: 'actionCompleted',
      payload: {
        actionId,
        success,
        details: { fallback: true, platform: actionInfo?.platform },
        error: success ? null : 'Action could not be verified'
      }
    });
  }

  // Clean up on tab close
  browser.tabs.onRemoved.addListener((tabId) => {
    // Find and remove any actions associated with this tab
    for (const [actionId, info] of activeActions.entries()) {
      if (info.tabId === tabId) {
        console.log('Tab closed for action:', actionId);
        activeActions.delete(actionId);
        
        // Notify sidepanel that action was cancelled
        browser.runtime.sendMessage({
          type: 'actionCompleted',
          payload: {
            actionId,
            success: false,
            error: 'Tab was closed before action completed'
          }
        }).catch(() => {
          // Sidepanel might not be listening
        });
      }
    }
  });
});