export default defineBackground(() => {
  console.log('Task Manager background script loaded');

  // Handle action button click to open side panel
  browser.action?.onClicked?.addListener((tab) => {
    // For Chrome/Edge - open side panel when action is clicked
    if (browser.sidePanel) {
      // Use windowId for more reliable opening
      browser.windows.getCurrent((window) => {
        browser.sidePanel.open({ windowId: window.id }, () => {
          if (browser.runtime.lastError) {
            // Fallback: open without parameters
            browser.sidePanel.open({}, () => {
              if (browser.runtime.lastError) {
                console.error('Failed to open side panel:', browser.runtime.lastError);
              }
            });
          }
        });
      });
    }
  });

  // Handle messages from external web apps (via chrome.runtime.sendMessage)
  browser.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      console.log('Received external message:', request, 'from:', sender.origin);
      
      // Verify sender is from allowed origin
      const allowedOrigins = ['http://localhost:5173', 'http://localhost'];
      const senderOrigin = new URL(sender.origin || sender.url || '').origin;
      
      if (!allowedOrigins.some(origin => senderOrigin.startsWith(origin))) {
        sendResponse({ 
          success: false, 
          error: 'Unauthorized origin',
          origin: senderOrigin 
        });
        return;
      }

      // Handle different message types
      switch (request.action) {
        case 'openSidePanel':
          // Open side panel when requested by web app
          if (!browser.sidePanel) {
            sendResponse({ 
              success: false, 
              error: 'Side panel API not available' 
            });
            return;
          }

          // Extract task data from the request (excluding the action field)
          const taskData = { ...request };
          delete taskData.action;
          
          // Store task data for the side panel
          if (Object.keys(taskData).length > 0) {
            browser.storage.local.set({ currentTask: taskData });
          }

          // Chrome's sidePanel.open uses callback, not Promise
          browser.windows.getCurrent((window) => {
            // Open side panel for the current window
            browser.sidePanel.open({ windowId: window.id }, () => {
              if (browser.runtime.lastError) {
                // Fallback: Try without any parameters
                browser.sidePanel.open({}, () => {
                  if (browser.runtime.lastError) {
                    sendResponse({ 
                      success: false, 
                      error: browser.runtime.lastError.message || 'Failed to open side panel' 
                    });
                  } else {
                    // Send task data to side panel after it opens
                    setTimeout(() => {
                      browser.runtime.sendMessage({
                        from: 'background',
                        taskData: taskData
                      });
                    }, 100);
                    
                    sendResponse({ 
                      success: true, 
                      message: 'Side panel opened (default context)' 
                    });
                  }
                });
              } else {
                // Send task data to side panel after it opens
                setTimeout(() => {
                  browser.runtime.sendMessage({
                    from: 'background',
                    taskData: taskData
                  });
                }, 100);
                
                sendResponse({ 
                  success: true, 
                  message: 'Side panel opened',
                  windowId: window.id 
                });
              }
            });
          });
          return true; // Keep channel open for async response
          
        case 'closeSidePanel':
          // Close side panel if supported
          if (browser.sidePanel?.close) {
            browser.sidePanel.close()
              .then(() => {
                sendResponse({ 
                  success: true, 
                  message: 'Side panel closed' 
                });
              })
              .catch((error) => {
                sendResponse({ 
                  success: false, 
                  error: error.message 
                });
              });
            return true;
          } else {
            sendResponse({ 
              success: false, 
              error: 'Close side panel not supported' 
            });
          }
          break;

        case 'isSidePanelOpen':
          // Check if side panel is open (if API supports it)
          if (browser.sidePanel?.isOpen) {
            browser.sidePanel.isOpen()
              .then((isOpen) => {
                sendResponse({ 
                  success: true, 
                  isOpen 
                });
              })
              .catch((error) => {
                sendResponse({ 
                  success: false, 
                  error: error.message 
                });
              });
            return true;
          } else {
            sendResponse({ 
              success: false, 
              error: 'Check panel status not supported' 
            });
          }
          break;
          
        case 'sendToSidePanel':
          // Forward data to side panel
          browser.runtime.sendMessage({
            from: 'external',
            data: request.data
          })
          .then((response) => {
            sendResponse({ 
              success: true, 
              response 
            });
          })
          .catch((error) => {
            sendResponse({ 
              success: false, 
              error: error.message 
            });
          });
          return true;
          
        case 'ping':
          // Simple connectivity check
          sendResponse({ 
            success: true, 
            message: 'Extension is running',
            extensionId: browser.runtime.id,
            version: browser.runtime.getManifest().version,
            sidePanelAvailable: !!browser.sidePanel
          });
          break;
          
        default:
          sendResponse({ 
            success: false, 
            error: `Unknown action: ${request.action}` 
          });
      }
    }
  );

  // Also listen for internal messages (from side panel to background)
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Internal message received:', request);
    
    if (request.from === 'sidePanel') {
      // Handle messages from side panel
      switch (request.action) {
        case 'getStatus':
          sendResponse({ 
            status: 'ready',
            timestamp: Date.now()
          });
          break;
      }
    }
  });
});
