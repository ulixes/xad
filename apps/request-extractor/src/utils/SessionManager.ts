// Session management for request/response extraction
import { ExtractionSession, RequestResponsePair } from '../types/extraction';

export class SessionManager {
  private static sessions = new Map<string, ExtractionSession>();
  private static activeSessionsByTab = new Map<number, string>(); // tabId -> sessionId
  
  static createSession(url: string, tabId: number): ExtractionSession {
    const sessionId = this.generateSessionId();
    const session: ExtractionSession = {
      id: sessionId,
      url,
      tabId,
      startTime: Date.now(),
      status: 'active',
      requests: []
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionsByTab.set(tabId, sessionId);
    
    console.log(`📝 [SessionManager] Created session ${sessionId} for tab ${tabId}: ${url}`);
    return session;
  }
  
  static getSession(sessionId: string): ExtractionSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  static getActiveSessionForTab(tabId: number): ExtractionSession | undefined {
    const sessionId = this.activeSessionsByTab.get(tabId);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }
  
  static getAllSessions(): ExtractionSession[] {
    return Array.from(this.sessions.values());
  }
  
  static addRequestResponse(sessionId: string, pair: RequestResponsePair): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ [SessionManager] Session ${sessionId} not found`);
      return;
    }
    
    session.requests.push(pair);
    console.log(`📨 [SessionManager] Added request/response to session ${sessionId}: ${pair.request.method} ${pair.request.url}`);
  }
  
  static updateResponse(sessionId: string, requestId: string, response: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const pair = session.requests.find(p => p.request.id === requestId);
    if (pair) {
      pair.response = response;
      console.log(`✅ [SessionManager] Updated response for request ${requestId} in session ${sessionId}`);
    }
  }
  
  static stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.status = 'completed';
    session.endTime = Date.now();
    
    // Remove from active sessions
    this.activeSessionsByTab.delete(session.tabId);
    
    console.log(`🛑 [SessionManager] Stopped session ${sessionId} with ${session.requests.length} requests`);
  }
  
  static stopSessionForTab(tabId: number): void {
    const sessionId = this.activeSessionsByTab.get(tabId);
    if (sessionId) {
      this.stopSession(sessionId);
    }
  }
  
  static deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.activeSessionsByTab.delete(session.tabId);
    }
    
    this.sessions.delete(sessionId);
    console.log(`🗑️ [SessionManager] Deleted session ${sessionId}`);
  }
  
  static cleanup(): void {
    console.log(`🧹 [SessionManager] Cleaning up all sessions`);
    this.sessions.clear();
    this.activeSessionsByTab.clear();
  }
  
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}