import { VerificationMessage } from '../types/verification';

export class VerificationService {
  static async startVerification(platform: string, username: string) {
    console.log(`📤 [VerificationService] Sending verification request to background for ${platform}:${username}`);
    
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
}