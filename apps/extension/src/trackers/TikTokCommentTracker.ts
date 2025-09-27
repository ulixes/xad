export class TikTokCommentTracker {
  private actionId: string;
  private accountHandle: string;
  private isActive: boolean = false;
  private foundComment: boolean = false;
  
  constructor(actionId: string, providedHandle?: string) {
    this.actionId = actionId;
    this.accountHandle = providedHandle || '';
    
    console.log('[TikTokCommentTracker] Initialized:', {
      actionId: this.actionId,
      accountHandle: this.accountHandle,
      url: window.location.href
    });
    
    // Fail if no account handle provided
    if (!this.accountHandle) {
      console.error('[TikTokCommentTracker] CRITICAL: No account handle provided!');
      this.reportFailure('No account handle provided from social account');
      return;
    }
  }
  
  async start(): Promise<void> {
    console.log('[TikTokCommentTracker] Starting comment tracking for NEW comments only');
    console.log('[TikTokCommentTracker] Waiting for user to post a comment...');
    this.isActive = true;
    
    // Register this tracker globally so the network interceptor can use it
    (window as any).__activeCommentTracker = this;
    
    // We only track NEW comments via publish API
    // No need to check cache or trigger reloads
    
    // Set timeout (60 seconds)
    setTimeout(() => {
      if (!this.foundComment) {
        this.cleanup();
        this.reportFailure('Timeout: User did not post a comment within 60 seconds');
      }
    }, 60000);
  }
  
  // Called by the global network interceptor
  processCommentResponse(data: any): void {
    if (!this.isActive || this.foundComment) return;
    
    console.log('[TikTokCommentTracker] ====== PROCESSING COMMENT RESPONSE ======');
    console.log('[TikTokCommentTracker] Response keys:', Object.keys(data));
    
    if (data.comments && Array.isArray(data.comments)) {
      console.log('[TikTokCommentTracker] Total comments:', data.comments.length);
      console.log('[TikTokCommentTracker] Has more:', data.has_more);
      console.log('[TikTokCommentTracker] Looking for account:', this.accountHandle);
      
      // Log each comment's structure
      data.comments.forEach((comment: any, index: number) => {
        console.log(`[TikTokCommentTracker] Comment ${index + 1}:`, {
          cid: comment.cid,
          text: comment.text,
          create_time: comment.create_time,
          user_unique_id: comment.user?.unique_id,
          user_uid: comment.user?.uid,
          user_nickname: comment.user?.nickname,
          aweme_id: comment.aweme_id,
          digg_count: comment.digg_count,
          reply_id: comment.reply_id
        });
      });
      
      // Check if any comment matches our account
      const matchingComment = data.comments.find((comment: any) => 
        comment.user?.unique_id === this.accountHandle
      );
      
      if (matchingComment) {
        console.log('[TikTokCommentTracker] ====== MATCH FOUND! ======');
        console.log('[TikTokCommentTracker] Matching comment:', matchingComment);
        
        this.foundComment = true;
        this.reportSuccess(matchingComment);
        this.cleanup();
      } else {
        console.log('[TikTokCommentTracker] No match found in this batch');
      }
    }
    
    console.log('[TikTokCommentTracker] ====== END PROCESSING ======');
  }
  
  private reportSuccess(comment: any): void {
    const proof = {
      commentId: comment.cid,
      commentText: comment.text,
      createTime: comment.create_time,
      awemeId: comment.aweme_id,
      userId: comment.user?.uid,
      uniqueId: comment.user?.unique_id,
      nickname: comment.user?.nickname,
      platform: 'tiktok',
      actionType: 'comment',
      timestamp: Date.now(),
      verificationMethod: 'network_api',
      postUrl: window.location.href
    };
    
    console.log('[TikTokCommentTracker] Sending success with proof:', proof);
    
    // Send via postMessage to bridge script (we're in MAIN world)
    window.postMessage({
      source: 'TIKTOK_MAIN_WORLD',
      type: 'SEND_TO_BACKGROUND',
      payload: {
        type: 'ACTION_COMPLETED',
        payload: {
          actionId: this.actionId,
          success: true,
          details: proof,
          timestamp: Date.now()
        }
      }
    }, '*');
  }
  
  private reportFailure(error: string): void {
    console.error('[TikTokCommentTracker] Failed:', error);
    
    // Send via postMessage to bridge script (we're in MAIN world)
    window.postMessage({
      source: 'TIKTOK_MAIN_WORLD',
      type: 'SEND_TO_BACKGROUND',
      payload: {
        type: 'ACTION_COMPLETED',
        payload: {
          actionId: this.actionId,
          success: false,
          details: {
            error,
            accountHandle: this.accountHandle,
            url: window.location.href,
            timestamp: Date.now()
          }
        }
      }
    }, '*');
  }
  
  private cleanup(): void {
    this.isActive = false;
    delete (window as any).__activeCommentTracker;
    console.log('[TikTokCommentTracker] Cleaned up');
  }
}