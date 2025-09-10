// Chrome Debugger API utilities for HTTP request/response extraction
import { HTTPRequest, HTTPResponse, GraphQLRequest } from '../types/extraction';
import { SessionManager } from './SessionManager';

export class RequestExtractor {
  private static attachedTabs = new Set<number>();
  private static requestDataCache = new Map<string, any>(); // requestId -> request data
  private static requestTrackers = new Map<number, Set<string>>(); // tabId -> Set<requestId>
  
  static async attachToTab(tabId: number): Promise<void> {
    console.log(`🔗 [RequestExtractor] Attaching debugger to tab: ${tabId}`);
    
    return new Promise((resolve, reject) => {
      if (this.attachedTabs.has(tabId)) {
        console.log(`✅ [RequestExtractor] Debugger already attached to tab: ${tabId}`);
        resolve();
        return;
      }
      
      browser.debugger.attach({ tabId }, '1.3', () => {
        if (browser.runtime.lastError) {
          console.error(`❌ [RequestExtractor] Failed to attach debugger:`, browser.runtime.lastError.message);
          reject(new Error(browser.runtime.lastError.message));
          return;
        }
        
        this.attachedTabs.add(tabId);
        this.requestTrackers.set(tabId, new Set());
        console.log(`📡 [RequestExtractor] Debugger attached, enabling network monitoring...`);
        
        // Enable network monitoring
        browser.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
          if (browser.runtime.lastError) {
            console.error(`❌ [RequestExtractor] Failed to enable network monitoring:`, browser.runtime.lastError.message);
            this.detachFromTab(tabId);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }
          
          console.log(`📡 [RequestExtractor] Network monitoring enabled for tab: ${tabId}`);
          
          // Configure network settings for better response capture (like actions extension)
          browser.debugger.sendCommand({ tabId }, 'Network.setCacheDisabled', { cacheDisabled: false }, () => {
            if (browser.runtime.lastError) {
              console.error(`❌ [RequestExtractor] Failed to configure network cache:`, browser.runtime.lastError.message);
            } else {
              console.log(`💾 [RequestExtractor] Network caching configured for response preservation`);
            }
            
            // Set up event listeners
            this.setupEventListeners(tabId);
            resolve();
          });
        });
      });
    });
  }
  
  private static setupEventListeners(tabId: number): void {
    // Create a unique handler for this tab to avoid conflicts
    const handleDebuggerEvent = (source: any, method: string, params: any) => {
      // CRITICAL: Only process events for this specific tab
      if (source.tabId !== tabId) return;
      
      const session = SessionManager.getActiveSessionForTab(tabId);
      if (!session) {
        console.warn(`⚠️ [RequestExtractor] No active session found for tab ${tabId}, ignoring event: ${method}`);
        return;
      }
      
      console.log(`🔍 [RequestExtractor] Debug event for tab ${tabId}: ${method}`);
      
      if (method === 'Network.requestWillBeSent') {
        const url = params.request.url;
        if (this.shouldCaptureRequest(url)) {
          console.log(`📤 [RequestExtractor] GraphQL request will be sent for tab ${tabId}: ${url}`);
          const requestTracker = this.requestTrackers.get(tabId);
          if (requestTracker) {
            requestTracker.add(params.requestId);
            console.log(`📝 [RequestExtractor] Added request ${params.requestId} to tracker for tab ${tabId}`);
          }
          // Store request data for later
          this.requestDataCache.set(params.requestId, { 
            request: params.request, 
            timestamp: params.timestamp, 
            sessionId: session.id 
          });
        }
      }
      
      if (method === 'Network.responseReceived') {
        const requestId = params.requestId;
        const requestTracker = this.requestTrackers.get(tabId);
        
        if (requestTracker?.has(requestId)) {
          console.log(`✅ [RequestExtractor] GraphQL response received for tab ${tabId}, request: ${requestId}`);
          
          // Store response metadata (status, headers)
          const cachedData = this.requestDataCache.get(requestId);
          if (cachedData) {
            cachedData.response = params.response;
            cachedData.responseTimestamp = params.timestamp;
          }
          
          // Small delay to ensure response is fully loaded (same as actions extension)
          setTimeout(() => {
            this.processResponse(tabId, requestId);
          }, 100);
        }
      }
    };
    
    // Request tracker was already set in attachToTab, just ensure it exists
    if (!this.requestTrackers.has(tabId)) {
      this.requestTrackers.set(tabId, new Set());
    }
    
    browser.debugger.onEvent.addListener(handleDebuggerEvent);
    console.log(`🎧 [RequestExtractor] Event listeners set up for tab ${tabId}`);
  }
  
  private static async processResponse(tabId: number, requestId: string): Promise<void> {
    try {
      const cachedData = this.requestDataCache.get(requestId);
      if (!cachedData) return;

      browser.debugger.sendCommand(
        { tabId },
        'Network.getResponseBody',
        { requestId },
        (response: any) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [RequestExtractor] Error getting response body:`, browser.runtime.lastError.message);
            return;
          }

          if (!response?.body) {
            console.log(`❗ [RequestExtractor] Response body is empty for tab ${tabId}, request: ${requestId}`);
          }

          const request = cachedData.request;
          const sessionId = cachedData.sessionId;
          
          // Create HTTP request object
          const httpRequest: HTTPRequest = {
            id: requestId,
            url: request.url,
            method: request.method,
            headers: request.headers || {},
            body: request.postData,
            timestamp: cachedData.timestamp * 1000,
            requestType: this.determineRequestType(request)
          };

          // Create HTTP response object using both Network.responseReceived and Network.getResponseBody data
          const httpResponse: HTTPResponse = {
            requestId,
            status: cachedData.response?.status || 200,
            statusText: cachedData.response?.statusText || 'OK',
            headers: cachedData.response?.headers || {},
            body: response?.body || null, // This is the actual response body content from Network.getResponseBody
            timestamp: (cachedData.responseTimestamp || cachedData.timestamp) * 1000,
            responseTime: ((cachedData.responseTimestamp || cachedData.timestamp) - cachedData.timestamp) * 1000
          };

          // Add to session
          if (httpRequest.requestType === 'GraphQL') {
            const graphqlRequest = this.extractGraphQLData(httpRequest);
            SessionManager.addRequestResponse(sessionId, { request: graphqlRequest, response: httpResponse });
          } else {
            SessionManager.addRequestResponse(sessionId, { request: httpRequest, response: httpResponse });
          }

          // Clean up
          this.requestDataCache.delete(requestId);
          const requestTracker = this.requestTrackers.get(tabId);
          if (requestTracker) {
            requestTracker.delete(requestId);
          }

          // Log GraphQL responses specifically
          if (httpRequest.requestType === 'GraphQL') {
            console.log(`🔥 [RequestExtractor] Captured GraphQL request/response: ${request.method} ${request.url}`);
            console.log(`📄 [RequestExtractor] GraphQL Response Body Length: ${response?.body?.length || 0}`);
            if (response?.body) {
              console.log(`📄 [RequestExtractor] GraphQL Response Preview: ${response.body.substring(0, 200)}...`);
            }
          } else {
            console.log(`✅ [RequestExtractor] Captured ${httpRequest.requestType} request/response: ${request.method} ${request.url}`);
          }
        }
      );
    } catch (error) {
      console.error(`💥 [RequestExtractor] Failed to process response for tab ${tabId}:`, error);
    }
  }
  
  private static shouldCaptureRequest(url: string): boolean {
    // Skip browser internal URLs and extensions
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://')) {
      return false;
    }
    
    const urlLower = url.toLowerCase();
    
    // Capture GraphQL requests (Instagram, Twitter, etc.)
    const isGraphQL = urlLower.includes('graphql');
    
    // Capture TikTok API requests
    const isTikTokAPI = urlLower.includes('tiktok.com/api');
    
    // Capture other common API patterns
    const isAPI = urlLower.includes('/api/v') || urlLower.includes('/rest/') || urlLower.includes('/query');
    
    if (isGraphQL) {
      console.log(`🎯 [RequestExtractor] Will capture GraphQL request: ${url.substring(0, 100)}...`);
      return true;
    }
    
    if (isTikTokAPI) {
      console.log(`🎯 [RequestExtractor] Will capture TikTok API request: ${url.substring(0, 100)}...`);
      return true;
    }
    
    if (isAPI) {
      console.log(`🎯 [RequestExtractor] Will capture API request: ${url.substring(0, 100)}...`);
      return true;
    }
    
    return false;
  }

  private static determineRequestType(request: any): 'REST' | 'GraphQL' | 'Other' {
    const url = request.url.toLowerCase();
    const contentType = request.headers?.['content-type']?.toLowerCase() || '';
    
    // Simple GraphQL detection - just look for "graphql" in URL
    if (url.includes('graphql')) {
      return 'GraphQL';
    }
    
    // REST API detection
    if (contentType.includes('application/json') || 
        contentType.includes('application/x-www-form-urlencoded') ||
        url.includes('/api/') ||
        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return 'REST';
    }
    
    return 'Other';
  }
  
  private static extractGraphQLData(request: HTTPRequest): GraphQLRequest {
    const graphqlRequest: GraphQLRequest = { ...request };
    
    try {
      if (request.body) {
        const body = JSON.parse(request.body);
        graphqlRequest.operationName = body.operationName;
        graphqlRequest.query = body.query;
        graphqlRequest.variables = body.variables;
      }
    } catch (error) {
      console.warn(`⚠️ [RequestExtractor] Failed to parse GraphQL body:`, error);
    }
    
    return graphqlRequest;
  }
  
  static async detachFromTab(tabId: number): Promise<void> {
    if (!this.attachedTabs.has(tabId)) {
      return;
    }
    
    try {
      browser.debugger.detach({ tabId });
      console.log(`🧹 [RequestExtractor] Debugger detached from tab: ${tabId}`);
    } catch (error) {
      console.warn(`⚠️ [RequestExtractor] Error detaching debugger from tab ${tabId}:`, error);
    } finally {
      this.attachedTabs.delete(tabId);
      this.requestTrackers.delete(tabId);
    }
  }
  
  static cleanup(): void {
    // Detach from all tabs
    for (const tabId of this.attachedTabs) {
      this.detachFromTab(tabId);
    }
    this.requestDataCache.clear();
    this.requestTrackers.clear();
  }
}