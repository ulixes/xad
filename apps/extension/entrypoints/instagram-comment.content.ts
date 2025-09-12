export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  main() {
    console.log('[Instagram Comment Tracker] Specialized comment tracking initialized at:', new Date().toISOString());
    
    // Announce presence immediately
    window.postMessage({
      type: 'COMMENT_TRACKER_READY',
      timestamp: Date.now()
    }, '*');

    class InstagramCommentTracker {
      private observers: Map<string, MutationObserver> = new Map();
      private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
      private pendingComments: Map<string, {
        actionId: string;
        startTime: number;
        targetUrl: string;
        initialState?: {
          commentCount: number;
          existingHashes: Set<string>;
          textareaEmpty: boolean;
          postButtonDisabled: boolean;
          scrollPosition: number;
        };
        expectedCommentText?: string;
        verificationStages: {
          preComment: boolean;
          typing: boolean;
          submit: boolean;
          appeared: boolean;
        };
        detectionAttempts: number;
      }> = new Map();

      constructor() {
        this.setupMessageListener();
        console.log('[Comment Tracker] Ready for comment verification');
      }

      private setupMessageListener() {
        // Listen for browser runtime messages - ONLY for comment-specific messages
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('[Comment Tracker] Received runtime message:', message);

          // Only handle comment-specific messages
          if (message.type === 'TRACK_COMMENT_ACTION') {
            this.startTracking({
              actionId: message.actionId,
              targetUrl: message.targetUrl || window.location.href,
              expectedText: message.expectedText
            });
            sendResponse({ acknowledged: true });
          }

          if (message.type === 'CHECK_COMMENT_STATUS') {
            sendResponse({ 
              isActive: true, 
              pendingComments: Array.from(this.pendingComments.keys()) 
            });
          }

          return true;
        });

        // Also listen for window messages from the main tracker
        window.addEventListener('message', (event) => {
          // Only process messages from same origin
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'TRACK_COMMENT_ACTION') {
            console.log('[Comment Tracker] Received window message:', event.data);
            this.startTracking({
              actionId: event.data.actionId,
              targetUrl: event.data.targetUrl || window.location.href,
              expectedText: event.data.expectedText
            });
            
            // Send acknowledgment back
            window.postMessage({
              type: 'COMMENT_TRACKER_ACK',
              actionId: event.data.actionId
            }, '*');
          }
        });
      }

      private startTracking(request: {
        actionId: string;
        targetUrl?: string;
        expectedText?: string;
      }) {
        const { actionId, expectedText } = request;

        console.log('[Comment Tracker] Starting enhanced tracking for:', actionId);

        // Initialize tracking data
        this.pendingComments.set(actionId, {
          actionId,
          startTime: Date.now(),
          targetUrl: window.location.href,
          verificationStages: {
            preComment: false,
            typing: false,
            submit: false,
            appeared: false
          },
          detectionAttempts: 0,
          expectedCommentText: expectedText
        });

        // Start detection process
        this.initializeCommentDetection(actionId);

        // Set timeout
        setTimeout(() => {
          if (this.pendingComments.has(actionId)) {
            const comment = this.pendingComments.get(actionId);
            const stagesCompleted = Object.values(comment?.verificationStages || {})
              .filter(v => v).length;
            
            this.reportResult(actionId, false, {
              error: 'Timeout - comment not verified after 2 minutes',
              stagesCompleted,
              verificationStages: comment?.verificationStages,
              attempts: comment?.detectionAttempts
            });
            this.cleanup(actionId);
          }
        }, 120000); // 2 minute timeout
      }

      private initializeCommentDetection(actionId: string) {
        const comment = this.pendingComments.get(actionId);
        if (!comment) return;

        // Analyze the page structure
        const analysis = this.analyzePageStructure();
        if (!analysis) {
          console.log('[Comment Tracker] Page structure not ready, retrying...');
          comment.detectionAttempts++;
          
          if (comment.detectionAttempts < 10) {
            setTimeout(() => this.initializeCommentDetection(actionId), 1000);
          } else {
            this.reportResult(actionId, false, { error: 'Could not find comment section' });
            this.cleanup(actionId);
          }
          return;
        }

        const { 
          commentSection, 
          commentsList,
          textarea, 
          postButton,
          existingComments 
        } = analysis;

        // Store initial state
        comment.initialState = {
          commentCount: existingComments.length,
          existingHashes: this.generateCommentHashes(existingComments),
          textareaEmpty: !textarea?.value,
          postButtonDisabled: postButton?.hasAttribute('disabled') || false,
          scrollPosition: commentSection.scrollTop
        };
        comment.verificationStages.preComment = true;

        console.log('[Comment Tracker] Initial state captured:', {
          commentCount: existingComments.length,
          hasTextarea: !!textarea,
          hasPostButton: !!postButton
        });

        // Set up detection methods
        this.setupMultiMethodDetection(actionId, {
          commentSection,
          commentsList,
          textarea,
          postButton,
          existingComments
        });
      }

      private analyzePageStructure() {
        // Strategy 1: Find comment form first
        let textarea = document.querySelector('textarea[placeholder*="comment" i], textarea[aria-label*="comment" i]') as HTMLTextAreaElement;
        
        if (!textarea) {
          // Strategy 2: Look for Add comment placeholder
          const placeholders = document.querySelectorAll('div[role="button"]');
          for (const placeholder of placeholders) {
            if (placeholder.textContent?.toLowerCase().includes('add a comment')) {
              placeholder.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              // Wait a bit for textarea to appear
              setTimeout(() => {
                textarea = document.querySelector('textarea[placeholder*="comment" i]') as HTMLTextAreaElement;
              }, 500);
              break;
            }
          }
        }

        // Find comment section
        let commentSection: Element | null = null;
        let commentsList: Element | null = null;

        // Look for comments list
        const listSelectors = [
          'ul:has(> li time)',
          'ul:has(> li a[href^="/"])',
          'div[role="list"]:has(> div[role="listitem"] time)',
          'section ul:has(li)',
          'div:has(> article time)'
        ];

        for (const selector of listSelectors) {
          try {
            const lists = document.querySelectorAll(selector);
            for (const list of lists) {
              // Check if this looks like a comments list
              const items = list.querySelectorAll('li, [role="listitem"], article');
              const hasTimeStamps = Array.from(items).some(item => 
                item.querySelector('time, [datetime]')
              );
              
              if (hasTimeStamps || items.length > 0) {
                commentsList = list;
                commentSection = list.closest('section, div[role="presentation"]') || list.parentElement;
                break;
              }
            }
            if (commentsList) break;
          } catch (e) {
            // Selector not supported
          }
        }

        // Fallback: Find section near textarea
        if (!commentSection && textarea) {
          commentSection = textarea.closest('section, main, article') || document.body;
          commentsList = commentSection.querySelector('ul, [role="list"]');
        }

        if (!commentSection) return null;

        // Find post button
        const postButton = this.findPostButton(textarea);

        // Get existing comments
        const existingComments = this.getExistingComments(commentsList || commentSection);

        return {
          commentSection,
          commentsList: commentsList || commentSection,
          textarea,
          postButton,
          existingComments
        };
      }

      private findPostButton(textarea: HTMLTextAreaElement | null): HTMLElement | null {
        if (!textarea) return null;

        // Look for Post button near textarea
        const form = textarea.closest('form');
        if (form) {
          // Check for submit button in form
          const buttons = form.querySelectorAll('button, div[role="button"]');
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if (text === 'post' || text === 'submit' || text === 'send') {
              return btn as HTMLElement;
            }
          }
        }

        // Look in parent container
        const container = textarea.closest('div, section');
        if (container) {
          const postBtn = container.querySelector('div[role="button"]:has-text("Post"), button:has-text("Post")');
          if (postBtn) return postBtn as HTMLElement;
        }

        return null;
      }

      private getExistingComments(container: Element): Element[] {
        const comments: Element[] = [];
        const items = container.querySelectorAll('li, [role="listitem"], article:has(time)');
        
        items.forEach(item => {
          // Filter out non-comment items
          const hasText = item.querySelector('span[dir="auto"], div[dir="auto"]');
          const hasTime = item.querySelector('time, [datetime]');
          const hasProfile = item.querySelector('a[href^="/"]');
          
          if (hasText || (hasTime && hasProfile)) {
            comments.push(item);
          }
        });

        return comments;
      }

      private generateCommentHashes(comments: Element[]): Set<string> {
        const hashes = new Set<string>();
        
        comments.forEach(comment => {
          const text = this.extractCommentText(comment);
          if (text) {
            hashes.add(this.hashText(text));
          }
        });

        return hashes;
      }

      private extractCommentText(element: Element): string {
        // Try to get just the comment text, excluding username and metadata
        const textElement = element.querySelector('span[dir="auto"]:not(:first-child), div[dir="auto"]:not(:first-child)');
        if (textElement) {
          return textElement.textContent || '';
        }

        // Fallback: get all text and try to clean it
        const fullText = element.textContent || '';
        // Remove common patterns like usernames, timestamps
        return fullText
          .replace(/@[\w.]+/g, '')
          .replace(/\d+[smhdw]/g, '')
          .replace(/Reply/gi, '')
          .replace(/Like/gi, '')
          .trim();
      }

      private hashText(text: string): string {
        const clean = text.toLowerCase().replace(/\s+/g, ' ').trim();
        let hash = 0;
        for (let i = 0; i < clean.length; i++) {
          const char = clean.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return `${hash.toString(36)}_${clean.length}`;
      }

      private setupMultiMethodDetection(actionId: string, context: any) {
        const { commentSection, commentsList, textarea, postButton } = context;
        const comment = this.pendingComments.get(actionId);
        if (!comment) return;

        // Method 1: Monitor textarea for typing
        if (textarea) {
          const handleTyping = () => {
            if (!comment.verificationStages.typing && textarea.value.length > 3) {
              comment.verificationStages.typing = true;
              comment.expectedCommentText = textarea.value;
              console.log('[Comment Tracker] Typing detected:', textarea.value.substring(0, 30));
            }
          };

          textarea.addEventListener('input', handleTyping);
          textarea.addEventListener('change', handleTyping);
          textarea.addEventListener('keyup', handleTyping);

          // Monitor form submission
          const form = textarea.closest('form');
          if (form) {
            form.addEventListener('submit', (e) => {
              comment.verificationStages.submit = true;
              comment.expectedCommentText = textarea.value;
              console.log('[Comment Tracker] Form submitted with text:', textarea.value.substring(0, 30));
            });
          }

          // Monitor post button click
          if (postButton) {
            postButton.addEventListener('click', () => {
              comment.verificationStages.submit = true;
              comment.expectedCommentText = textarea.value;
              console.log('[Comment Tracker] Post button clicked');
            });
          }
        }

        // Method 2: MutationObserver for new comments
        const observer = new MutationObserver((mutations) => {
          this.checkForNewComment(actionId, commentsList, mutations);
        });

        observer.observe(commentsList, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['datetime', 'title'],
          characterData: true
        });

        this.observers.set(actionId, observer);

        // Method 3: Polling fallback
        const pollInterval = setInterval(() => {
          this.checkForNewComment(actionId, commentsList);
        }, 500);

        this.pollingIntervals.set(actionId, pollInterval);

        console.log('[Comment Tracker] Detection methods configured');
      }

      private checkForNewComment(actionId: string, container: Element, mutations?: MutationRecord[]) {
        const comment = this.pendingComments.get(actionId);
        if (!comment || !comment.initialState) return;

        const currentComments = this.getExistingComments(container);
        
        // Quick check: has count increased?
        if (currentComments.length <= comment.initialState.commentCount) {
          return;
        }

        // Check each comment starting from the newest
        for (let i = currentComments.length - 1; i >= Math.max(0, comment.initialState.commentCount - 1); i--) {
          const commentEl = currentComments[i];
          const text = this.extractCommentText(commentEl);
          const hash = this.hashText(text);

          // Is this a new comment?
          if (!comment.initialState.existingHashes.has(hash)) {
            // Verify it's a valid new comment
            const verification = this.verifyNewComment(commentEl, {
              expectedText: comment.expectedCommentText,
              checkRecency: true
            });

            if (verification.isValid) {
              comment.verificationStages.appeared = true;
              console.log('[Comment Tracker] New comment verified!', {
                text: text.substring(0, 50),
                confidence: verification.confidence
              });

              this.reportResult(actionId, true, {
                commentText: text,
                timestamp: verification.timestamp,
                confidence: verification.confidence,
                verificationStages: comment.verificationStages,
                detectionMethod: mutations ? 'mutation' : 'polling',
                previousCount: comment.initialState.commentCount,
                newCount: currentComments.length,
                elementHTML: commentEl.outerHTML.substring(0, 500)
              });

              this.cleanup(actionId);
              return;
            }
          }
        }
      }

      private verifyNewComment(element: Element, options: any): any {
        const { expectedText, checkRecency } = options;
        let confidence = 0;
        let timestamp = null;

        // Check 1: Timestamp recency
        if (checkRecency) {
          const timeEl = element.querySelector('time, [datetime]');
          if (timeEl) {
            const datetime = timeEl.getAttribute('datetime');
            const timeText = timeEl.textContent || '';

            if (datetime) {
              const commentTime = new Date(datetime);
              const ageMs = Date.now() - commentTime.getTime();
              
              if (ageMs < 60000) { // Less than 1 minute old
                confidence += 0.4;
                timestamp = datetime;
              }
            } else if (timeText.match(/^(now|just now|[1-9]\d?s|1m)$/i)) {
              confidence += 0.4;
              timestamp = timeText;
            }
          }
        }

        // Check 2: Text matching
        if (expectedText && expectedText.length > 3) {
          const commentText = this.extractCommentText(element);
          const cleanExpected = expectedText.trim().toLowerCase();
          const cleanComment = commentText.trim().toLowerCase();

          // Calculate similarity
          const minLength = Math.min(cleanExpected.length, cleanComment.length, 50);
          if (minLength > 0) {
            const matchingChars = cleanComment.substring(0, minLength) === cleanExpected.substring(0, minLength);
            if (matchingChars) {
              confidence += 0.4;
            } else if (cleanComment.includes(cleanExpected.substring(0, 20))) {
              confidence += 0.3;
            }
          }
        }

        // Check 3: Comment structure
        const hasReply = element.textContent?.includes('Reply');
        const hasProfileLink = element.querySelector('a[href^="/"]');
        const hasLikeOption = element.querySelector('svg[aria-label*="Like"], button[aria-label*="Like"]');

        if (hasReply) confidence += 0.05;
        if (hasProfileLink) confidence += 0.1;
        if (hasLikeOption) confidence += 0.05;

        return {
          isValid: confidence >= 0.4,
          confidence,
          timestamp,
          hasReply,
          hasProfileLink,
          hasLikeOption
        };
      }

      private reportResult(actionId: string, success: boolean, details: any) {
        console.log('[Comment Tracker] Reporting result:', {
          actionId,
          success,
          details
        });

        const comment = this.pendingComments.get(actionId);
        
        const proof = {
          actionType: 'comment',
          platform: 'instagram',
          targetUrl: window.location.href,
          timestamp: Date.now(),
          duration: comment ? Date.now() - comment.startTime : 0,
          domState: details,
          verificationMethod: 'enhanced_comment_tracker',
          success
        };

        browser.runtime.sendMessage({
          type: 'ACTION_COMPLETED',
          payload: {
            actionId,
            success,
            details: {
              ...details,
              proof
            },
            timestamp: Date.now()
          }
        }).catch(err => {
          console.error('[Comment Tracker] Failed to send completion message:', err);
        });
      }

      private cleanup(actionId: string) {
        console.log('[Comment Tracker] Cleaning up for:', actionId);

        // Stop observer
        const observer = this.observers.get(actionId);
        if (observer) {
          observer.disconnect();
          this.observers.delete(actionId);
        }

        // Clear polling
        const interval = this.pollingIntervals.get(actionId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(actionId);
        }

        // Remove tracking data
        this.pendingComments.delete(actionId);

        console.log('[Comment Tracker] Cleanup complete. Active comments:', this.pendingComments.size);
      }
    }

    // Initialize the comment tracker
    const commentTracker = new InstagramCommentTracker();

    // Export for debugging
    (window as any).igCommentTracker = commentTracker;
  },
});