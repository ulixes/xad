// Import the config to get parsers
import { twitterLikesConfig } from '../src/lib/configs/twitter-likes';
import { twitterCommentsConfig } from '../src/lib/configs/twitter-comments';
import { twitterFollowsConfig } from '../src/lib/configs/twitter-follows';
import { twitterRetweetsConfig } from '../src/lib/configs/twitter-retweets';

// Generic Proof Detection Engine
export default defineBackground(() => {
  const attachedTabs = new Set<number>();
  const activeProofSessions = new Map<string, any>();

  // Config registry for parsers
  const configRegistry: Record<string, any> = {
    'X_LIKE': twitterLikesConfig,
    'X_COMMENT': twitterCommentsConfig,
    'X_FOLLOW': twitterFollowsConfig,
    'X_RETWEET': twitterRetweetsConfig
  };

  // Check if debugger API is available
  const debuggerAvailable = typeof browser !== 'undefined' && browser.debugger;
  
  if (!debuggerAvailable) {
    console.warn('Debugger API not available - proof detection will not work');
  }

  // Extension action - open side panel
  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  // Listen for proof session commands from state machine
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_PROOF_SESSION') {
      const { sessionId, proofType, targetUrl, config, targetId } = message;
      
      // Reconstruct the full config with RegExp and parsers
      const fullConfig = configRegistry[proofType];
      const reconstructedConfig = config ? {
        ...config,
        urlRegex: new RegExp(config.urlRegex), // Reconstruct RegExp from string
        context: {
          endpointIdentifier: config.context?.endpointIdentifier,
          parser: fullConfig?.context?.parser // Get parser from registry
        },
        action: {
          endpointIdentifier: config.action?.endpointIdentifier,
          parser: fullConfig?.action?.parser // Get parser from registry
        }
      } : fullConfig; // Fallback to full config if no config provided
      
      activeProofSessions.set(sessionId, {
        proofType,
        config: reconstructedConfig,
        targetUrl,
        targetId,
        contextData: null,
        actionData: null,
        status: 'waiting_for_navigation'
      });
      console.log(`Started proof session: ${sessionId} for type: ${proofType}, target: ${targetId}`);
      console.log('Original config:', config);
      console.log('Full config from registry:', fullConfig);
      console.log('Reconstructed config:', reconstructedConfig);
      console.log('URL RegExp:', reconstructedConfig?.urlRegex, typeof reconstructedConfig?.urlRegex);
      sendResponse({ success: true, type: 'START_PROOF_SESSION' });
      
      // Also emit a SESSION_STARTED event
      emitEvent('SESSION_STARTED', { sessionId });
      return true; // Keep the message channel open for async response
    }
    
    if (message.type === 'END_PROOF_SESSION') {
      const { sessionId } = message;
      activeProofSessions.delete(sessionId);
      console.log(`Ended proof session: ${sessionId}`);
      sendResponse({ success: true });
      return true;
    }
  });

  // Generic tab monitoring for all active sessions
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    
    console.log(`Tab updated: ${tab.url}`);
    console.log('Active sessions:', activeProofSessions.size);
    
    // Check which active sessions match this URL
    for (const [sessionId, session] of activeProofSessions) {
      console.log(`Checking session ${sessionId}:`, {
        configExists: !!session.config,
        urlRegexExists: !!session.config?.urlRegex,
        urlRegexType: typeof session.config?.urlRegex,
        urlRegex: session.config?.urlRegex
      });
      
      try {
        if (session.config?.urlRegex && typeof session.config.urlRegex.test === 'function') {
          const matches = session.config.urlRegex.test(tab.url);
          console.log(`URL ${tab.url} matches pattern: ${matches}`);
          
          if (matches) {
            console.log('✅ Navigation detected!');
            
            // Extract username from URL as fallback context
            const usernameMatch = tab.url.match(/x\.com\/([^/]+)\/(likes|with_replies|following)/);
            const username = usernameMatch ? usernameMatch[1] : 'unknown';
            
            // Set basic context from URL if we don't have it
            if (!session.contextData) {
              session.contextData = {
                id: 'url_extracted',
                name: username,
                handle: username,
                source: 'url'
              };
              console.log('📝 Set fallback context from URL:', session.contextData);
            }
            
            attachDebugger(tabId, sessionId, session);
            emitEvent('NAVIGATION_DETECTED', { sessionId, url: tab.url });
          }
        } else {
          console.warn('Invalid urlRegex for session:', sessionId);
        }
      } catch (error) {
        console.error('Error testing URL pattern:', error);
      }
    }
  });

  function attachDebugger(tabId: number, sessionId: string, session: any) {
    if (!debuggerAvailable) {
      console.warn('Cannot attach debugger - API not available');
      emitEvent('PROOF_ERROR', { sessionId, error: 'Debugger API not available' });
      return;
    }
    
    if (!attachedTabs.has(tabId)) {
      browser.debugger.attach({ tabId }, "1.3", () => {
        if (browser.runtime.lastError) {
          console.error("Debugger attach failed:", browser.runtime.lastError.message);
          emitEvent('PROOF_ERROR', { sessionId, error: browser.runtime.lastError.message });
          return;
        }
        attachedTabs.add(tabId);
        browser.debugger.sendCommand({ tabId }, "Network.enable");
        console.log(`Debugger attached to tab ${tabId} for session: ${sessionId}`);
      });
    }
  }

  // Generic GraphQL response interceptor
  if (debuggerAvailable) {
    browser.debugger.onEvent.addListener((source, method, params: any) => {
      if (method !== "Network.responseReceived" || !source.tabId) return;
      
      const url = params.response.url;
      
      // Check all active sessions for matching endpoints
      for (const [sessionId, session] of activeProofSessions) {
        const { config } = session;
        
        if (!config) continue;
        
        // Context endpoint (user profile data)
        if (url.includes(config.context?.endpointIdentifier)) {
          extractAndEmitData(source.tabId, params.requestId, sessionId, 'context', config.context.parser);
        }
        
        // Action endpoint (proof data)  
        if (url.includes(config.action?.endpointIdentifier)) {
          extractAndEmitData(source.tabId, params.requestId, sessionId, 'action', config.action.parser);
        }
      }
    });
  }

  function extractAndEmitData(tabId: number, requestId: string, sessionId: string, dataType: string, parser: Function) {
    if (!debuggerAvailable) {
      console.warn('Cannot extract data - debugger not available');
      return;
    }
    
    browser.debugger.sendCommand(
      { tabId },
      "Network.getResponseBody", 
      { requestId },
      (response) => {
        if (!response?.body) return;
        
        try {
          const rawData = JSON.parse(response.body);
          const session = activeProofSessions.get(sessionId);
          const parsedData = parser ? 
            (dataType === 'action' ? parser(rawData, session?.targetId) : parser(rawData)) 
            : rawData;
          
          // Update session
          if (session) {
            if (dataType === 'context') {
              session.contextData = parsedData;
            } else {
              session.actionData = parsedData;
            }
            
            // Emit structured event to verification state machine
            emitEvent('PROOF_DATA_EXTRACTED', {
              sessionId,
              dataType,
              data: parsedData,
              isComplete: session.contextData && session.actionData
            });
            
            // Complete the proof if we have action data with a result
            // Context is nice-to-have but not required for proof verification
            const canComplete = session.actionData && 
              (session.actionData.proofResult !== undefined || session.contextData);
            
            if (canComplete) {
              console.log('🎉 Completing proof with available data');
              emitEvent('PROOF_COMPLETED', {
                sessionId,
                proof: {
                  type: session.proofType,
                  context: session.contextData || { id: 'unknown', name: 'User', handle: 'unknown' },
                  action: session.actionData,
                  timestamp: Date.now()
                }
              });
              activeProofSessions.delete(sessionId);
            }
          }
        } catch (error) {
          console.error('Error parsing response:', error);
          emitEvent('PROOF_ERROR', { sessionId, error: error instanceof Error ? error.message : 'Parse error' });
        }
      }
    );
  }

  function emitEvent(eventType: string, payload: any) {
    browser.runtime.sendMessage({
      type: 'BACKGROUND_EVENT',
      eventType,
      payload,
      timestamp: Date.now()
    }).catch(error => {
      // Side panel may not be open - this is normal
      console.debug(`Background event not delivered: ${eventType}`, error.message);
    });
  }

  // Cleanup on tab removal
  browser.tabs.onRemoved.addListener((tabId) => {
    if (attachedTabs.has(tabId) && debuggerAvailable) {
      browser.debugger.detach({ tabId }, () => {
        attachedTabs.delete(tabId);
        console.log(`Debugger detached from removed tab: ${tabId}`);
      });
    }
  });

  // Cleanup on extension shutdown
  browser.runtime.onSuspend?.addListener(() => {
    if (debuggerAvailable) {
      for (const tabId of attachedTabs) {
        browser.debugger.detach({ tabId });
      }
    }
    attachedTabs.clear();
    activeProofSessions.clear();
  });
});