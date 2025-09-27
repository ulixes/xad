// This content script runs in the ISOLATED world and acts as a bridge
// between the MAIN world content script and the background script

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  world: 'ISOLATED', // Run in ISOLATED world for chrome API access
  main() {
    console.log('[TikTok Bridge] Bridge script loaded in ISOLATED world');
    
    // Listen for messages from the MAIN world script
    window.addEventListener('message', (event) => {
      // Only accept messages from the same origin
      if (event.source !== window) return;
      
      // Check for our custom message format
      if (event.data && event.data.source === 'TIKTOK_MAIN_WORLD') {
        console.log('[TikTok Bridge] Received message from MAIN world:', event.data.type);
        
        // Forward the message to the background script
        chrome.runtime.sendMessage(event.data.payload)
          .then((response) => {
            // Send response back to MAIN world if needed
            if (response) {
              window.postMessage({
                source: 'TIKTOK_BRIDGE',
                type: 'RESPONSE',
                originalType: event.data.type,
                response: response
              }, '*');
            }
          })
          .catch((error) => {
            console.error('[TikTok Bridge] Failed to send message to background:', error);
          });
      }
    });
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[TikTok Bridge] Received message from background:', message.type);
      
      // Forward to MAIN world
      window.postMessage({
        source: 'TIKTOK_BRIDGE',
        type: 'FROM_BACKGROUND',
        message: message
      }, '*');
      
      sendResponse({ acknowledged: true });
      return true;
    });
    
    // Notify MAIN world that bridge is ready
    window.postMessage({
      source: 'TIKTOK_BRIDGE',
      type: 'BRIDGE_READY'
    }, '*');
  }
});