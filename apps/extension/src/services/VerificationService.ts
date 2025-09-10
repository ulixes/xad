import { ProfileData, VerificationMessage } from '../types/verification';

interface TabCreationResult {
  tabId: number;
}

interface DebuggerAttachResult {
  success: boolean;
}

export class VerificationService {
  // Enhanced IG Profile Building - Complete 4-stage collection
  static async buildIGProfileComplete(username: string, userId: string): Promise<any> {
    console.log(`[VerificationService] Starting enhanced IG profile building for "${username}" (User: ${userId})`);

    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          type: 'BUILD_IG_PROFILE_COMPLETE',
          username,
          userId
        } as VerificationMessage,
        (response) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [VerificationService] Runtime error:`, browser.runtime.lastError.message);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }

          console.log(`📥 [VerificationService] Received IG profile response:`, response);

          if (response.type === 'IG_PROFILE_COMPLETE') {
            console.log(`✅ [VerificationService] Enhanced IG profile building completed for ${username}`);
            resolve(response.profileData);
          } else if (response.type === 'IG_PROFILE_ERROR') {
            console.error(`❌ [VerificationService] IG profile building failed:`, response.error);
            reject(new Error(response.error));
          } else {
            console.error(`❌ [VerificationService] Unknown response type:`, response.type);
            reject(new Error('Unknown response type'));
          }
        }
      );
    });
  }

  // Legacy verification method for fallback
  static async startVerification(platform: string, username: string) : Promise<ProfileData> {
    console.log(`[VerificationService] Sending legacy verification request to background for ${platform}:"${username}"`);
    console.log(`[VerificationService] Username details: length=${username.length}, type=${typeof username}`);

    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          type: 'START_VERIFICATION',
          platform,
          username
        } as VerificationMessage,
        (response) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [VerificationService] Runtime error:`, browser.runtime.lastError.message);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }

          console.log(`📥 [VerificationService] Received response from background:`, response);

          if (response.type === 'VERIFICATION_COMPLETE') {
            console.log(`✅ [VerificationService] Verification completed successfully for ${username}`);
            resolve(response.profileData);
          } else if (response.type === 'VERIFICATION_ERROR') {
            console.error(`❌ [VerificationService] Verification failed:`, response.error);
            reject(new Error(response.error));
          } else {
            console.error(`❌ [VerificationService] Unknown response type:`, response.type);
            reject(new Error('Unknown response type'));
          }
        }
      );
    });
  }
  
  // New hierarchical verification methods
  static async createVerificationTab(platform: string, username: string): Promise<TabCreationResult> {
    console.log(`[VerificationService] Creating verification tab for ${platform}:"${username}"`);
    
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          type: 'CREATE_VERIFICATION_TAB',
          platform,
          username
        },
        (response) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [VerificationService] Runtime error creating tab:`, browser.runtime.lastError.message);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }

          if (response.type === 'TAB_CREATED') {
            console.log(`✅ [VerificationService] Tab created successfully with ID: ${response.tabId}`);
            resolve({ tabId: response.tabId });
          } else if (response.type === 'TAB_CREATION_ERROR') {
            console.error(`❌ [VerificationService] Tab creation failed:`, response.error);
            reject(new Error(response.error));
          } else {
            console.error(`❌ [VerificationService] Unknown response type:`, response.type);
            reject(new Error('Unknown response type'));
          }
        }
      );
    });
  }
  
  static async attachDebugger(tabId: number, username: string): Promise<void> {
    console.log(`[VerificationService] Attaching debugger to tab ${tabId} for username "${username}"`);
    
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          type: 'ATTACH_DEBUGGER',
          tabId,
          username
        },
        (response) => {
          if (browser.runtime.lastError) {
            console.error(`❌ [VerificationService] Runtime error attaching debugger:`, browser.runtime.lastError.message);
            reject(new Error(browser.runtime.lastError.message));
            return;
          }

          if (response.type === 'DEBUGGER_ATTACHED') {
            console.log(`✅ [VerificationService] Debugger attached successfully`);
            resolve();
          } else if (response.type === 'DEBUGGER_ATTACHMENT_ERROR') {
            console.error(`❌ [VerificationService] Debugger attachment failed:`, response.error);
            reject(new Error(response.error));
          } else {
            console.error(`❌ [VerificationService] Unknown response type:`, response.type);
            reject(new Error('Unknown response type'));
          }
        }
      );
    });
  }
  
  static async cleanup(tabId: number): Promise<void> {
    console.log(`[VerificationService] Cleaning up verification resources for tab ${tabId}`);
    
    return new Promise((resolve) => {
      browser.runtime.sendMessage(
        {
          type: 'CLEANUP_VERIFICATION',
          tabId
        },
        (response) => {
          if (browser.runtime.lastError) {
            console.warn(`⚠️ [VerificationService] Runtime error during cleanup (ignoring):`, browser.runtime.lastError.message);
          }

          console.log(`🧹 [VerificationService] Cleanup completed for tab ${tabId}`);
          resolve();
        }
      );
    });
  }
  
  // Method to listen for response events (called by accountMachine)
  static subscribeToResponses(tabId: number, onResponse: (data: ProfileData, requestId: string) => void): () => void {
    console.log(`[VerificationService] Subscribing to responses for tab ${tabId}`);
    
    const messageListener = (message: any) => {
      if (message.type === 'VERIFICATION_RESPONSE' && message.tabId === tabId) {
        console.log(`📨 [VerificationService] Received response for tab ${tabId}:`, message.profileData);
        onResponse(message.profileData, message.requestId);
      }
    };
    
    browser.runtime.onMessage.addListener(messageListener);
    
    // Return unsubscribe function
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
      console.log(`🔇 [VerificationService] Unsubscribed from responses for tab ${tabId}`);
    };
  }
}