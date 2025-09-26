export class TikTokCommentTracker {
  private actionId: string;
  private accountHandle: string;
  private originalFetch: typeof window.fetch;
  private commentFound: boolean = false;
  private scrollInterval: NodeJS.Timeout | null = null;
  private startTime: number;
  private maxScrollAttempts: number = 10;
  private scrollAttempts: number = 0;
  
  constructor(actionId: string) {
    this.actionId = actionId;
    this.accountHandle = this.getAccountHandleFromCookies() || this.getAccountHandleFromURL();
    this.originalFetch = window.fetch;
    this.startTime = Date.now();
    
    console.log('[TikTok Comment Tracker] 🎯 Initialized:', {
      actionId: this.actionId,
      accountHandle: this.accountHandle,
      url: window.location.href
    });
  }
  
  async start(): Promise<void> {
    console.log('[TikTok Comment Tracker] 🚀 Starting comment tracking');
    
    // Setup network interceptor
    this.setupNetworkInterceptor();
    
    // Start auto-scrolling to trigger comment loading
    this.startAutoScroll();
    
    // Set timeout
    setTimeout(() => {
      if (!this.commentFound) {
        this.reportFailure('Timeout: No comment detected within 60 seconds');
      }
    }, 60000);
  }
  
  private getAccountHandleFromURL(): string {
    // Try to extract from current user's profile link or page
    const profileLinks = document.querySelectorAll('a[href*="/@"]');
    for (const link of profileLinks) {
      const href = link.getAttribute('href');
      if (href?.includes('/@')) {
        const match = href.match(/@([^\/\?]+)/);
        if (match) {
          console.log('[TikTok Comment Tracker] Found handle from profile link:', match[1]);
          return match[1];
        }
      }
    }
    
    // Fallback to URL parsing
    const match = window.location.pathname.match(/@([^\/]+)/);
    return match ? match[1] : '';
  }
  
  private getAccountHandleFromCookies(): string {
    // TikTok sometimes stores user info in localStorage or sessionStorage
    try {
      const userDataKeys = ['user_data', 'login_info', 'currentUser'];
      for (const key of userDataKeys) {
        const data = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.uniqueId || parsed.unique_id || parsed.username) {
            return parsed.uniqueId || parsed.unique_id || parsed.username;
          }
        }
      }
    } catch (e) {
      console.log('[TikTok Comment Tracker] Could not parse user data from storage');
    }
    return '';
  }
  
  private setupNetworkInterceptor(): void {
    console.log('[TikTok Comment Tracker] 🔍 Setting up network interceptor');
    
    // Override fetch to intercept API calls
    window.fetch = async (...args) => {
      const response = await this.originalFetch(...args);
      const url = args[0].toString();
      
      // Check for comment list API
      if (url.includes('/api/comment/list/')) {
        console.log('[TikTok Comment Tracker] 📋 Comment API call detected');
        
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          this.processCommentResponse(data, url);
        } catch (e) {
          console.error('[TikTok Comment Tracker] Failed to parse comment response:', e);
        }
      }
      
      // Check for comment publish API (when user posts a comment)
      if (url.includes('/api/comment/publish/') || url.includes('/api/comment/post/')) {
        console.log('[TikTok Comment Tracker] 📤 Comment publish API detected');
        
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          if (data.status_code === 0) {
            console.log('[TikTok Comment Tracker] Comment posted successfully, waiting for verification...');
            // Trigger immediate scroll to load the new comment
            this.scrollToLoadComments(true);
          }
        } catch (e) {
          console.error('[TikTok Comment Tracker] Failed to parse publish response:', e);
        }
      }
      
      return response;
    };
  }
  
  private processCommentResponse(data: any, url: string): void {
    if (!data.comments || !Array.isArray(data.comments)) {
      return;
    }
    
    console.log(`[TikTok Comment Tracker] Processing ${data.comments.length} comments`);
    
    // Look for our comment
    for (const comment of data.comments) {
      // Check multiple fields for account matching
      const commentUserId = comment.user?.unique_id || comment.user?.uniqueId;
      const commentNickname = comment.user?.nickname;
      
      console.log('[TikTok Comment Tracker] Checking comment:', {
        userId: commentUserId,
        nickname: commentNickname,
        text: comment.text?.substring(0, 50),
        createTime: comment.create_time
      });
      
      // Match by unique_id (most reliable)
      if (commentUserId === this.accountHandle) {
        this.verifyAndReportComment(comment, url);
        break;
      }
      
      // Also check if this is a very recent comment (within last 30 seconds)
      // This helps catch comments even if handle matching fails
      const commentTime = comment.create_time * 1000;
      const timeSinceStart = commentTime - this.startTime;
      
      if (timeSinceStart > 0 && timeSinceStart < 30000) {
        console.log('[TikTok Comment Tracker] Found recent comment, might be ours:', {
          text: comment.text,
          timeSinceStart: timeSinceStart / 1000 + 's'
        });
        
        // Store as potential match
        if (!this.commentFound) {
          // Could implement additional verification here
          // For now, we'll rely on unique_id matching
        }
      }
    }
    
    // Check if we need to continue scrolling
    if (!this.commentFound && data.has_more) {
      console.log('[TikTok Comment Tracker] More comments available, continuing scroll...');
    }
  }
  
  private verifyAndReportComment(comment: any, apiUrl: string): void {
    const commentTime = comment.create_time * 1000;
    const currentTime = Date.now();
    const timeDiff = currentTime - commentTime;
    
    // Verify it's recent (within 2 minutes)
    if (timeDiff > 120000) {
      console.log('[TikTok Comment Tracker] Comment too old:', timeDiff / 1000, 'seconds');
      return;
    }
    
    console.log('[TikTok Comment Tracker] ✅ COMMENT VERIFIED!');
    
    // Extract post ID from URL or comment data
    const postIdMatch = apiUrl.match(/aweme_id=(\d+)/) || 
                       window.location.pathname.match(/video\/(\d+)/);
    const postId = comment.aweme_id || (postIdMatch ? postIdMatch[1] : '');
    
    // Build proof object
    const proof = {
      // Comment details
      commentId: comment.cid,
      commentText: comment.text,
      createTime: comment.create_time,
      
      // Post details
      awemeId: comment.aweme_id,
      postId: postId,
      postUrl: window.location.href,
      
      // User details
      userId: comment.user?.uid,
      uniqueId: comment.user?.unique_id,
      nickname: comment.user?.nickname,
      
      // Verification details
      platform: 'tiktok',
      actionType: 'comment',
      timestamp: Date.now(),
      verificationMethod: 'network_api',
      
      // Additional metadata
      shareUrl: comment.share_info?.url,
      replyId: comment.reply_id || '0',
      diggCount: comment.digg_count || 0,
      
      // API response metadata
      apiEndpoint: apiUrl.split('?')[0],
      statusCode: 0, // Successful response
      
      // Timing
      timeToVerify: (Date.now() - this.startTime) / 1000 + 's'
    };
    
    console.log('[TikTok Comment Tracker] 🎉 Comment proof:', proof);
    
    // Mark as found and stop scrolling
    this.commentFound = true;
    this.stopAutoScroll();
    
    // Report success
    this.reportSuccess(proof);
    
    // Restore original fetch
    this.cleanup();
  }
  
  private startAutoScroll(): void {
    console.log('[TikTok Comment Tracker] 📜 Starting auto-scroll');
    
    // Initial scroll to load comments
    this.scrollToLoadComments();
    
    // Set up periodic scrolling
    this.scrollInterval = setInterval(() => {
      if (this.scrollAttempts >= this.maxScrollAttempts) {
        console.log('[TikTok Comment Tracker] Max scroll attempts reached');
        this.stopAutoScroll();
        if (!this.commentFound) {
          this.reportFailure('Could not find comment after scrolling through all available comments');
        }
        return;
      }
      
      if (!this.commentFound) {
        this.scrollToLoadComments();
        this.scrollAttempts++;
      }
    }, 3000); // Scroll every 3 seconds
  }
  
  private scrollToLoadComments(immediate: boolean = false): void {
    // Find the comment container
    const selectors = [
      '[class*="DivCommentListContainer"]',
      '[class*="CommentList"]',
      '[data-e2e="comment-list"]',
      'div[class*="comment"]',
      // Fallback: any scrollable container with comments
      'div:has(> div[class*="CommentItem"])'
    ];
    
    let commentContainer: Element | null = null;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        commentContainer = element;
        console.log(`[TikTok Comment Tracker] Found comment container: ${selector}`);
        break;
      }
    }
    
    if (!commentContainer) {
      console.log('[TikTok Comment Tracker] No comment container found, trying window scroll');
      // Fallback to window scroll
      window.scrollBy(0, 500);
      return;
    }
    
    // Scroll the comment container
    const scrollHeight = commentContainer.scrollHeight;
    const currentScroll = commentContainer.scrollTop;
    const clientHeight = commentContainer.clientHeight;
    
    console.log('[TikTok Comment Tracker] Scrolling comments:', {
      scrollHeight,
      currentScroll,
      clientHeight,
      remaining: scrollHeight - currentScroll - clientHeight
    });
    
    if (immediate) {
      // Scroll to top to load newest comments
      commentContainer.scrollTop = 0;
    } else {
      // Scroll down to load more comments
      commentContainer.scrollTop += clientHeight * 0.8;
    }
    
    // Also trigger a small scroll to ensure loading
    setTimeout(() => {
      commentContainer.scrollTop += 10;
      commentContainer.scrollTop -= 10;
    }, 100);
  }
  
  private stopAutoScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      console.log('[TikTok Comment Tracker] 🛑 Stopped auto-scroll');
    }
  }
  
  private reportSuccess(proof: any): void {
    browser.runtime.sendMessage({
      type: 'ACTION_COMPLETED',
      payload: {
        actionId: this.actionId,
        success: true,
        details: proof,
        timestamp: Date.now()
      }
    }).catch(err => console.error('[TikTok Comment Tracker] Failed to report success:', err));
  }
  
  private reportFailure(error: string): void {
    console.error('[TikTok Comment Tracker] ❌ Failed:', error);
    
    this.stopAutoScroll();
    this.cleanup();
    
    browser.runtime.sendMessage({
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
    }).catch(err => console.error('[TikTok Comment Tracker] Failed to report failure:', err));
  }
  
  private cleanup(): void {
    // Restore original fetch
    window.fetch = this.originalFetch;
    
    // Stop scrolling
    this.stopAutoScroll();
    
    console.log('[TikTok Comment Tracker] 🧹 Cleaned up');
  }
}