import { ExtractionMessage } from '../src/types/extraction';
import { SessionManager } from '../src/utils/SessionManager';
import { RequestExtractor } from '../src/utils/RequestExtractor';
import { ExportService } from '../src/services/ExportService';

export default defineBackground(() => {
  // Extension icon click handler
  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  // Message handler for extraction requests
  browser.runtime.onMessage.addListener((message: ExtractionMessage, sender, sendResponse) => {
    console.log(`📨 [Background] Received message:`, message.type);
    
    try {
      switch (message.type) {
        case 'START_EXTRACTION':
          handleStartExtraction(message.url!, sendResponse);
          return true; // Keep message channel open for async response
          
        case 'STOP_EXTRACTION':
          handleStopExtraction(message.sessionId!, sendResponse);
          return true;
          
        case 'GET_SESSIONS':
          handleGetSessions(sendResponse);
          return true;
          
        case 'EXPORT_SESSION':
          handleExportSession(message.sessionId!, message.data, sendResponse);
          return true;
          
        default:
          console.warn(`⚠️ [Background] Unknown message type: ${message.type}`);
          sendResponse({ type: 'EXTRACTION_ERROR', error: 'Unknown message type' });
          return false;
      }
    } catch (error) {
      console.error(`💥 [Background] Error handling message:`, error);
      sendResponse({ type: 'EXTRACTION_ERROR', error: `Message handling failed: ${error}` });
      return false;
    }
  });

  // Start extraction for a given URL
  async function handleStartExtraction(url: string, sendResponse: (response: any) => void) {
    console.log(`🚀 [Background] Starting extraction for URL: ${url}`);
    
    try {
      // Create a new tab but DON'T navigate yet
      const tab = await browser.tabs.create({
        url: 'about:blank', // Start with blank page
        active: true
      });
      
      if (!tab.id) {
        throw new Error('Failed to create tab for extraction');
      }
      
      // Create extraction session
      const session = SessionManager.createSession(url, tab.id);
      
      // Attach debugger BEFORE navigating to capture ALL requests
      await RequestExtractor.attachToTab(tab.id);
      
      // NOW navigate to the actual URL - this ensures we catch ALL requests from the start
      await browser.tabs.update(tab.id, { url });
      
      sendResponse({
        type: 'SESSION_CREATED',
        data: {
          sessionId: session.id,
          tabId: tab.id,
          url: session.url
        }
      });
      
    } catch (error) {
      console.error(`💥 [Background] Extraction start failed:`, error);
      sendResponse({
        type: 'EXTRACTION_ERROR',
        error: `Failed to start extraction: ${error}`
      });
    }
  }

  // Stop extraction session
  async function handleStopExtraction(sessionId: string, sendResponse: (response: any) => void) {
    console.log(`🛑 [Background] Stopping extraction for session: ${sessionId}`);
    
    try {
      const session = SessionManager.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Stop session
      SessionManager.stopSession(sessionId);
      
      // Detach debugger
      await RequestExtractor.detachFromTab(session.tabId);
      
      sendResponse({
        type: 'SESSION_STOPPED',
        data: {
          sessionId,
          requestCount: session.requests.length
        }
      });
      
    } catch (error) {
      console.error(`💥 [Background] Extraction stop failed:`, error);
      sendResponse({
        type: 'EXTRACTION_ERROR',
        error: `Failed to stop extraction: ${error}`
      });
    }
  }

  // Get all sessions
  function handleGetSessions(sendResponse: (response: any) => void) {
    const sessions = SessionManager.getAllSessions();
    sendResponse({
      type: 'SESSIONS_DATA',
      data: sessions
    });
  }

  // Export session data
  async function handleExportSession(sessionId: string, exportConfig: any, sendResponse: (response: any) => void) {
    console.log(`📁 [Background] Exporting session: ${sessionId}`);
    
    try {
      const session = SessionManager.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      await ExportService.exportSession(session, exportConfig);
      
      sendResponse({
        type: 'EXPORT_COMPLETE',
        data: { sessionId, format: exportConfig.format }
      });
      
    } catch (error) {
      console.error(`💥 [Background] Export failed:`, error);
      sendResponse({
        type: 'EXTRACTION_ERROR',
        error: `Failed to export session: ${error}`
      });
    }
  }

  // Helper function to wait for tab to load
  function waitForTabToLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const listener = (id: number, changeInfo: any) => {
        if (id === tabId && changeInfo.status === 'complete') {
          browser.tabs.onUpdated.removeListener(listener);
          // Give some time for JavaScript to load
          setTimeout(resolve, 2000);
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }

  // Cleanup on tab close to prevent memory leaks
  browser.tabs.onRemoved.addListener((tabId) => {
    console.log(`🗑️ [Background] Tab ${tabId} closed, cleaning up resources`);
    
    // Stop any active session for this tab
    SessionManager.stopSessionForTab(tabId);
    
    // Detach debugger
    RequestExtractor.detachFromTab(tabId).catch((error) => {
      console.warn(`⚠️ [Background] Error detaching debugger from closed tab:`, error);
    });
  });

  // Cleanup on extension shutdown
  browser.runtime.onSuspend?.addListener(() => {
    console.log(`🛑 [Background] Extension suspending, cleaning up all resources`);
    
    try {
      SessionManager.cleanup();
    } finally {
      RequestExtractor.cleanup();
    }
  });

  console.log('🚀 [Background] Request/Response Extractor background script initialized');
});