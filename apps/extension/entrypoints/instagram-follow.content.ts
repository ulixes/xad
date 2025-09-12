export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  main() {
    console.log('[Instagram Follow Tracker] Specialized follow tracking initialized at:', new Date().toISOString());
    
    // Announce presence immediately
    window.postMessage({
      type: 'FOLLOW_TRACKER_READY',
      timestamp: Date.now()
    }, '*');

    class InstagramFollowTracker {
      private observers: Map<string, MutationObserver> = new Map();
      private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
      private pendingFollows: Map<string, {
        actionId: string;
        startTime: number;
        targetUrl: string;
        targetUsername?: string;
        initialState?: {
          buttonText: string;
          buttonClass: string;
          hasChevron: boolean;
          isFollowing: boolean;
        };
        verificationStages: {
          buttonFound: boolean;
          clicked: boolean;
          stateChanged: boolean;
        };
        detectionAttempts: number;
      }> = new Map();

      constructor() {
        this.setupMessageListener();
        console.log('[Follow Tracker] Ready for follow verification');
      }

      private setupMessageListener() {
        // Listen for browser runtime messages - ONLY for follow-specific messages
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('[Follow Tracker] Received runtime message:', message);

          // Only handle follow-specific messages
          if (message.type === 'TRACK_FOLLOW_ACTION') {
            this.startTracking({
              actionId: message.actionId,
              targetUrl: message.targetUrl || window.location.href,
              targetUsername: message.targetUsername
            });
            sendResponse({ acknowledged: true });
          }

          if (message.type === 'CHECK_FOLLOW_STATUS') {
            sendResponse({ 
              isActive: true, 
              pendingFollows: Array.from(this.pendingFollows.keys()) 
            });
          }

          return true;
        });

        // Also listen for window messages from the main tracker
        window.addEventListener('message', (event) => {
          // Only process messages from same origin
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'TRACK_FOLLOW_ACTION') {
            console.log('[Follow Tracker] Received window message:', event.data);
            this.startTracking({
              actionId: event.data.actionId,
              targetUrl: event.data.targetUrl || window.location.href,
              targetUsername: event.data.targetUsername
            });
            
            // Send acknowledgment back
            window.postMessage({
              type: 'FOLLOW_TRACKER_ACK',
              actionId: event.data.actionId
            }, '*');
          }
        });
      }

      private startTracking(request: {
        actionId: string;
        targetUrl?: string;
        targetUsername?: string;
      }) {
        const { actionId, targetUsername } = request;

        console.log('[Follow Tracker] Starting enhanced tracking for:', actionId);

        // Initialize tracking data
        this.pendingFollows.set(actionId, {
          actionId,
          startTime: Date.now(),
          targetUrl: window.location.href,
          targetUsername,
          verificationStages: {
            buttonFound: false,
            clicked: false,
            stateChanged: false
          },
          detectionAttempts: 0
        });

        // Start detection process
        this.initializeFollowDetection(actionId);

        // Set timeout (follows are quicker but still give ample time)
        setTimeout(() => {
          if (this.pendingFollows.has(actionId)) {
            const follow = this.pendingFollows.get(actionId);
            const stagesCompleted = Object.values(follow?.verificationStages || {})
              .filter(v => v).length;
            
            this.reportResult(actionId, false, {
              error: 'Timeout - follow action not verified after 2 minutes',
              stagesCompleted,
              verificationStages: follow?.verificationStages,
              attempts: follow?.detectionAttempts
            });
            this.cleanup(actionId);
          }
        }, 120000); // 2 minute timeout for follows
      }

      private initializeFollowDetection(actionId: string) {
        const follow = this.pendingFollows.get(actionId);
        if (!follow) return;

        // Find follow buttons on the page
        const followButtons = this.findFollowButtons();
        
        if (followButtons.length === 0) {
          console.log('[Follow Tracker] No follow buttons found, retrying...');
          follow.detectionAttempts++;
          
          if (follow.detectionAttempts < 10) {
            setTimeout(() => this.initializeFollowDetection(actionId), 1000);
          } else {
            this.reportResult(actionId, false, { error: 'Could not find follow buttons' });
            this.cleanup(actionId);
          }
          return;
        }

        // Analyze initial state of all follow buttons
        const buttonStates = followButtons.map(btn => this.analyzeFollowButton(btn));
        
        // Store initial states
        follow.initialState = buttonStates[0]; // Use first button as reference
        follow.verificationStages.buttonFound = true;

        console.log('[Follow Tracker] Initial state captured:', {
          buttonsFound: followButtons.length,
          initialStates: buttonStates
        });

        // Set up detection methods
        this.setupMultiMethodDetection(actionId, followButtons, buttonStates);
      }

      private findFollowButtons(): HTMLElement[] {
        const buttons: HTMLElement[] = [];
        
        // Strategy 1: Find buttons with Follow/Following text
        const allButtons = document.querySelectorAll('button, div[role="button"]');
        allButtons.forEach(btn => {
          const text = btn.textContent?.trim() || '';
          // Look for exact matches
          if (text === 'Follow' || text === 'Following' || text === 'Follow Back' || 
              text === 'Requested' || text === 'Unfollow') {
            buttons.push(btn as HTMLElement);
          }
        });

        // Strategy 2: Find buttons with specific classes (from DOM analysis)
        const classButtons = document.querySelectorAll('button._aswu, button._aswv, button[class*="_asw"]');
        classButtons.forEach(btn => {
          if (!buttons.includes(btn as HTMLElement)) {
            buttons.push(btn as HTMLElement);
          }
        });

        // Strategy 3: Find buttons near profile elements
        const profileSections = document.querySelectorAll('header section, div[role="tablist"]');
        profileSections.forEach(section => {
          const sectionButtons = section.querySelectorAll('button');
          sectionButtons.forEach(btn => {
            const text = btn.textContent?.trim() || '';
            if ((text.includes('Follow') || text.includes('Message')) && 
                !buttons.includes(btn as HTMLElement)) {
              // Find the follow button (not message)
              if (!text.includes('Message')) {
                buttons.push(btn as HTMLElement);
              }
            }
          });
        });

        return buttons;
      }

      private analyzeFollowButton(button: HTMLElement): any {
        const text = button.textContent?.trim() || '';
        const classList = Array.from(button.classList);
        const hasChevron = !!button.querySelector('svg[aria-label*="chevron" i], svg title:has-text("chevron")');
        
        // Check button classes for state
        const hasFollowingClass = classList.some(c => c.includes('_aswv'));
        const hasFollowClass = classList.some(c => c.includes('_aswu'));
        
        // Determine follow state
        let isFollowing = false;
        if (text === 'Following' || text === 'Requested' || hasFollowingClass) {
          isFollowing = true;
        } else if (text === 'Follow' || text === 'Follow Back' || hasFollowClass) {
          isFollowing = false;
        }

        return {
          buttonText: text,
          buttonClass: classList.join(' '),
          hasChevron,
          isFollowing,
          element: button
        };
      }

      private setupMultiMethodDetection(actionId: string, buttons: HTMLElement[], initialStates: any[]) {
        const follow = this.pendingFollows.get(actionId);
        if (!follow) return;

        // Method 1: MutationObserver on all buttons
        buttons.forEach((button, index) => {
          const observer = new MutationObserver((mutations) => {
            const currentState = this.analyzeFollowButton(button);
            const initialState = initialStates[index];
            
            if (this.detectStateChange(initialState, currentState)) {
              follow.verificationStages.stateChanged = true;
              console.log('[Follow Tracker] Follow state changed via MutationObserver!');
              
              this.reportResult(actionId, true, {
                previousState: initialState,
                newState: currentState,
                detectionMethod: 'mutation',
                buttonIndex: index
              });
              
              this.cleanup(actionId);
            }
          });

          observer.observe(button, {
            attributes: true,
            attributeFilter: ['class', 'aria-label'],
            childList: true,
            subtree: true,
            characterData: true
          });

          // Store observer with unique key
          this.observers.set(`${actionId}_${index}`, observer);
        });

        // Method 2: Click detection
        buttons.forEach((button, index) => {
          const clickHandler = () => {
            follow.verificationStages.clicked = true;
            console.log('[Follow Tracker] Follow button clicked');
            
            // Wait a bit for state change
            setTimeout(() => {
              const currentState = this.analyzeFollowButton(button);
              const initialState = initialStates[index];
              
              if (this.detectStateChange(initialState, currentState)) {
                follow.verificationStages.stateChanged = true;
                console.log('[Follow Tracker] Follow state confirmed after click');
                
                this.reportResult(actionId, true, {
                  previousState: initialState,
                  newState: currentState,
                  detectionMethod: 'click',
                  buttonIndex: index
                });
                
                this.cleanup(actionId);
              }
            }, 500);
          };
          
          button.addEventListener('click', clickHandler, { once: true });
        });

        // Method 3: Polling fallback
        const pollInterval = setInterval(() => {
          for (let i = 0; i < buttons.length; i++) {
            const currentState = this.analyzeFollowButton(buttons[i]);
            const initialState = initialStates[i];
            
            if (this.detectStateChange(initialState, currentState)) {
              follow.verificationStages.stateChanged = true;
              console.log('[Follow Tracker] Follow state changed via polling!');
              
              clearInterval(pollInterval);
              this.reportResult(actionId, true, {
                previousState: initialState,
                newState: currentState,
                detectionMethod: 'polling',
                buttonIndex: i
              });
              
              this.cleanup(actionId);
              break;
            }
          }
        }, 500);

        this.pollingIntervals.set(actionId, pollInterval);

        // Method 4: Watch for page navigation (follow might trigger navigation)
        const urlWatcher = setInterval(() => {
          if (window.location.href !== follow.targetUrl) {
            // URL changed, might indicate successful follow
            clearInterval(urlWatcher);
            
            // Check if we're on a different profile or success page
            if (window.location.href.includes('/following') || 
                window.location.href.includes('/followers')) {
              follow.verificationStages.stateChanged = true;
              this.reportResult(actionId, true, {
                detectionMethod: 'navigation',
                newUrl: window.location.href
              });
              this.cleanup(actionId);
            }
          }
        }, 500);

        console.log('[Follow Tracker] Detection methods configured');
      }

      private detectStateChange(initial: any, current: any): boolean {
        // Primary check: Text change
        if (initial.buttonText !== current.buttonText) {
          // Valid state transitions
          const validTransitions = [
            { from: 'Follow', to: 'Following' },
            { from: 'Follow', to: 'Requested' },
            { from: 'Follow Back', to: 'Following' },
            { from: 'Following', to: 'Follow' },
            { from: 'Requested', to: 'Follow' }
          ];

          const isValid = validTransitions.some(t => 
            initial.buttonText === t.from && current.buttonText === t.to
          );

          if (isValid) return true;
        }

        // Secondary check: Class change (specifically _aswu to _aswv or vice versa)
        const initialHasFollowClass = initial.buttonClass.includes('_aswu');
        const initialHasFollowingClass = initial.buttonClass.includes('_aswv');
        const currentHasFollowClass = current.buttonClass.includes('_aswu');
        const currentHasFollowingClass = current.buttonClass.includes('_aswv');

        if ((initialHasFollowClass && currentHasFollowingClass) ||
            (initialHasFollowingClass && currentHasFollowClass)) {
          return true;
        }

        // Tertiary check: Chevron appearance/disappearance
        if (initial.hasChevron !== current.hasChevron) {
          // Chevron typically appears when following
          return true;
        }

        // Final check: isFollowing state change
        if (initial.isFollowing !== current.isFollowing) {
          return true;
        }

        return false;
      }

      private reportResult(actionId: string, success: boolean, details: any) {
        console.log('[Follow Tracker] Reporting result:', {
          actionId,
          success,
          details
        });

        const follow = this.pendingFollows.get(actionId);
        
        const proof = {
          actionType: 'follow',
          platform: 'instagram',
          targetUrl: window.location.href,
          targetUsername: follow?.targetUsername,
          timestamp: Date.now(),
          duration: follow ? Date.now() - follow.startTime : 0,
          domState: {
            ...details,
            verificationStages: follow?.verificationStages
          },
          verificationMethod: 'enhanced_follow_tracker',
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
          console.error('[Follow Tracker] Failed to send completion message:', err);
        });

        // Notify main tracker via window message
        window.postMessage({
          type: 'FOLLOW_TRACKING_COMPLETE',
          actionId,
          success
        }, '*');
      }

      private cleanup(actionId: string) {
        console.log('[Follow Tracker] Cleaning up for:', actionId);

        // Stop all observers for this action
        const observerKeys = Array.from(this.observers.keys())
          .filter(key => key.startsWith(actionId));
        
        observerKeys.forEach(key => {
          const observer = this.observers.get(key);
          if (observer) {
            observer.disconnect();
            this.observers.delete(key);
          }
        });

        // Clear polling
        const interval = this.pollingIntervals.get(actionId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(actionId);
        }

        // Remove tracking data
        this.pendingFollows.delete(actionId);

        console.log('[Follow Tracker] Cleanup complete. Active follows:', this.pendingFollows.size);
      }
    }

    // Initialize the follow tracker
    const followTracker = new InstagramFollowTracker();

    // Export for debugging
    (window as any).igFollowTracker = followTracker;
  },
});