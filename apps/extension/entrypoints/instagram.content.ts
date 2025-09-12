export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  main() {
    console.log('[Instagram Tracker] 🚀 Content script loaded on:', window.location.href);
    console.log('[Instagram Tracker] Page readyState:', document.readyState);
    console.log('[Instagram Tracker] Timestamp:', new Date().toISOString());

    class InstagramActionTracker {
      private observers: Map<string, MutationObserver> = new Map();
      private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
      private pendingActions: Map<string, {
        actionId: string;
        actionType: 'like' | 'comment' | 'follow';
        startTime: number;
        targetElement?: Element;
        initialState?: any;
      }> = new Map();

      constructor() {
        this.setupMessageListener();
        console.log('[Instagram Tracker] Initialized');
        
        // Listen for specialized tracker ready messages
        window.addEventListener('message', (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'COMMENT_TRACKER_READY') {
            console.log('[Instagram Tracker] Comment tracker is ready!');
          }
          if (event.data?.type === 'FOLLOW_TRACKER_READY') {
            console.log('[Instagram Tracker] Follow tracker is ready!');
          }
        });
      }

      private setupMessageListener() {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('[Instagram Tracker] 📨 Received message:', {
            type: message.type,
            actionType: message.actionType,
            actionId: message.actionId,
            targetUrl: message.targetUrl
          });

          if (message.type === 'TRACK_ACTION') {
            console.log(`[Instagram Tracker] 🎬 Processing ${message.actionType} action with ID: ${message.actionId}`);
            
            // Handle likes and follows directly, delegate comments
            if (message.actionType === 'like' || message.actionType === 'follow') {
              console.log(`[Instagram Tracker] ✅ Starting tracking for ${message.actionType}`);
              this.startTracking(message);
              sendResponse({ acknowledged: true });
            } else if (message.actionType === 'comment') {
              // Comments are disabled for now
              console.log('[Instagram Tracker] ❌ Comment actions are disabled');
              sendResponse({ acknowledged: false, error: 'Comment actions are disabled' });
            } else {
              console.log(`[Instagram Tracker] ⚠️ Unknown action type: ${message.actionType}`);
              sendResponse({ acknowledged: false, error: `Unknown action type: ${message.actionType}` });
            }
          }

          if (message.type === 'CHECK_STATUS') {
            sendResponse({ 
              isActive: true, 
              pendingActions: Array.from(this.pendingActions.keys()) 
            });
          }

          return true;
        });
      }

      private delegateToCommentTracker(actionId: string, targetUrl?: string) {
        console.log('[Instagram Tracker] Delegating comment action:', actionId);
        
        // Send to specialized comment tracker
        window.postMessage({
          type: 'TRACK_COMMENT_ACTION',
          actionId,
          targetUrl: targetUrl || window.location.href
        }, '*');
        
        // Also send via runtime for reliability
        browser.runtime.sendMessage({
          type: 'TRACK_COMMENT_ACTION',
          actionId,
          targetUrl: targetUrl || window.location.href
        }).catch(e => console.log('[Instagram Tracker] Runtime message failed:', e));
      }

      private delegateToFollowTracker(actionId: string, targetUrl?: string) {
        console.log('[Instagram Tracker] Delegating follow action:', actionId);
        
        // Send to specialized follow tracker
        window.postMessage({
          type: 'TRACK_FOLLOW_ACTION',
          actionId,
          targetUrl: targetUrl || window.location.href,
          targetUsername: this.extractUsername()
        }, '*');
        
        // Also send via runtime for reliability
        browser.runtime.sendMessage({
          type: 'TRACK_FOLLOW_ACTION',
          actionId,
          targetUrl: targetUrl || window.location.href,
          targetUsername: this.extractUsername()
        }).catch(e => console.log('[Instagram Tracker] Runtime message failed:', e));
      }

      private startTracking(request: {
        actionId: string;
        actionType: 'like' | 'comment' | 'follow';
        targetUrl?: string;
      }) {
        const { actionId, actionType } = request;

        // Handle like and follow actions
        if (actionType !== 'like' && actionType !== 'follow') {
          console.error('[Instagram Tracker] startTracking called with unsupported action:', actionType);
          return;
        }

        // Store pending action
        this.pendingActions.set(actionId, {
          actionId,
          actionType,
          startTime: Date.now(),
        });

        // Track the appropriate action
        if (actionType === 'like') {
          this.trackLikeAction(actionId);
        } else if (actionType === 'follow') {
          this.trackFollowAction(actionId);
        }

        // Set timeout to cleanup if action doesn't complete
        setTimeout(() => {
          if (this.pendingActions.has(actionId)) {
            this.reportActionResult(actionId, false, `Timeout - ${actionType} action not detected`);
            this.cleanup(actionId);
          }
        }, 120000); // 2 minute timeout
      }

      private trackLikeAction(actionId: string) {
        console.log('[Instagram Tracker] Starting like tracking for:', actionId);

        // Find all like buttons on the page
        const likeButtons = this.findLikeButtons();
        
        if (likeButtons.length === 0) {
          console.log('[Instagram Tracker] No like buttons found, waiting for page load...');
          // Wait a bit for page to load
          setTimeout(() => this.trackLikeAction(actionId), 1000);
          return;
        }

        // Store initial states
        const initialStates = likeButtons.map(btn => {
          const liked = this.isLiked(btn);
          const svg = btn.querySelector('svg');
          console.log('[Instagram Tracker] Initial like button state:', {
            isLiked: liked,
            ariaLabel: svg?.getAttribute('aria-label'),
            classes: svg?.className,
            title: svg?.querySelector('title')?.textContent
          });
          return {
            element: btn,
            isLiked: liked
          };
        });

        const action = this.pendingActions.get(actionId);
        if (action) {
          action.initialState = initialStates;
        }

        // Set up observer for the main content area
        const mainContent = document.querySelector('main') || document.body;
        
        const observer = new MutationObserver((mutations) => {
          // Check if any like button changed state
          for (const state of initialStates) {
            const currentlyLiked = this.isLiked(state.element);
            if (currentlyLiked !== state.isLiked) {
              console.log('[Instagram Tracker] Like state changed!', {
                was: state.isLiked,
                now: currentlyLiked
              });
              // Only report success if we went from not-liked to liked
              // This prevents unlike actions from being reported as successful like actions
              if (!state.isLiked && currentlyLiked) {
                this.reportActionResult(actionId, true, {
                  previousState: 'not-liked',
                  newState: 'liked',
                  timestamp: Date.now()
                });
                this.cleanup(actionId);
                return;
              } else if (state.isLiked && !currentlyLiked) {
                // Unlike detected - ignore it, continue monitoring
                console.log('[Instagram Tracker] Unlike detected - ignoring and continuing to monitor');
                // Update the initial state to track from this new state
                state.isLiked = false;
                // Continue monitoring - don't cleanup or report
              }
            }
          }

          // Check mutations for aria-label changes
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label') {
              const target = mutation.target as Element;
              if (target.tagName === 'SVG') {
                const parent = target.closest('div[role="button"], button, span[role="button"], [tabindex="0"]') || target.parentElement;
                if (parent) {
                  for (const state of initialStates) {
                    if (state.element === parent || state.element.contains(target)) {
                      const currentlyLiked = this.isLiked(state.element);
                      if (currentlyLiked !== state.isLiked) {
                        console.log('[Instagram Tracker] Like state changed via aria-label!', {
                          was: state.isLiked,
                          now: currentlyLiked
                        });
                        // Only report success if we went from not-liked to liked
                        if (!state.isLiked && currentlyLiked) {
                          this.reportActionResult(actionId, true, {
                            previousState: 'not-liked',
                            newState: 'liked',
                            timestamp: Date.now()
                          });
                          this.cleanup(actionId);
                          return;
                        } else if (state.isLiked && !currentlyLiked) {
                          // Unlike detected - ignore it, continue monitoring
                          console.log('[Instagram Tracker] Unlike via aria-label detected - ignoring');
                          state.isLiked = false;
                          // Continue monitoring - don't cleanup or report
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          // Also check for new like buttons (in case of navigation)
          const newButtons = this.findLikeButtons();
          for (const btn of newButtons) {
            if (!initialStates.find(s => s.element === btn)) {
              const isLiked = this.isLiked(btn);
              // Check if this might be our action
              for (const mutation of mutations) {
                if (mutation.type === 'childList' && btn.contains(mutation.target as Element)) {
                  console.log('[Instagram Tracker] New like button detected with state:', isLiked);
                  // Assume this is our action if it's liked
                  if (isLiked) {
                    this.reportActionResult(actionId, true, {
                      newButton: true,
                      state: 'liked',
                      timestamp: Date.now()
                    });
                    this.cleanup(actionId);
                    return;
                  }
                }
              }
            }
          }
        });

        observer.observe(mainContent, {
          childList: true,
          attributes: true,
          subtree: true,
          attributeFilter: ['aria-label', 'class', 'viewBox']
        });

        this.observers.set(actionId, observer);
        console.log('[Instagram Tracker] Like observer set up for:', actionId);
        
        // Also set up polling as a fallback (check every 500ms)
        const pollInterval = setInterval(() => {
          for (const state of initialStates) {
            const currentlyLiked = this.isLiked(state.element);
            if (currentlyLiked !== state.isLiked) {
              console.log('[Instagram Tracker] Like state changed (via polling)!', {
                was: state.isLiked,
                now: currentlyLiked
              });
              // Only report success if we went from not-liked to liked
              if (!state.isLiked && currentlyLiked) {
                clearInterval(pollInterval);
                this.reportActionResult(actionId, true, {
                  previousState: 'not-liked',
                  newState: 'liked',
                  detectionMethod: 'polling',
                  timestamp: Date.now()
                });
                this.cleanup(actionId);
                return;
              } else if (state.isLiked && !currentlyLiked) {
                // Unlike detected - ignore it, continue monitoring
                console.log('[Instagram Tracker] Unlike detected (via polling) - ignoring');
                state.isLiked = false;
                // Continue monitoring - don't cleanup or stop polling
              }
            }
          }
          
          // Also check for completely new buttons
          const currentButtons = this.findLikeButtons();
          for (const btn of currentButtons) {
            if (!initialStates.find(s => s.element === btn)) {
              const isLiked = this.isLiked(btn);
              if (isLiked) {
                console.log('[Instagram Tracker] New liked button detected (via polling)');
                clearInterval(pollInterval);
                this.reportActionResult(actionId, true, {
                  newButton: true,
                  state: 'liked',
                  detectionMethod: 'polling',
                  timestamp: Date.now()
                });
                this.cleanup(actionId);
                return;
              }
            }
          }
        }, 500);
        
        // Store interval for cleanup
        const existingInterval = this.pollingIntervals.get(actionId);
        if (existingInterval) clearInterval(existingInterval);
        this.pollingIntervals.set(actionId, pollInterval);
      }

      private trackFollowAction(actionId: string) {
        console.log('[Instagram Tracker - FOLLOW] 🟢 Starting follow tracking for:', actionId);
        console.log('[Instagram Tracker - FOLLOW] Current URL:', window.location.href);
        console.log('[Instagram Tracker - FOLLOW] Page title:', document.title);

        // Find follow buttons on the page
        const followButtons = this.findFollowButtons();
        
        console.log('[Instagram Tracker - FOLLOW] 🔍 Found buttons count:', followButtons.length);
        
        if (followButtons.length === 0) {
          console.log('[Instagram Tracker - FOLLOW] ⏳ No follow buttons found, waiting for page load...');
          console.log('[Instagram Tracker - FOLLOW] DOM state:', {
            hasMain: !!document.querySelector('main'),
            hasHeader: !!document.querySelector('header'),
            buttonCount: document.querySelectorAll('button').length,
            pageReadyState: document.readyState
          });
          // Wait a bit for page to load
          setTimeout(() => this.trackFollowAction(actionId), 1000);
          return;
        }

        // Store initial states
        const initialStates = followButtons.map((btn, index) => {
          const state = this.getFollowButtonState(btn);
          console.log(`[Instagram Tracker - FOLLOW] 📊 Button ${index + 1} initial state:`, {
            text: state.buttonText,
            isFollowing: state.isFollowing,
            hasChevron: state.hasChevron,
            classes: state.buttonClass.substring(0, 100) // Truncate long class strings
          });
          return {
            element: btn,
            ...state
          };
        });

        const action = this.pendingActions.get(actionId);
        if (action) {
          action.initialState = initialStates;
        }

        // Set up observer for the main content area
        const mainContent = document.querySelector('main') || document.body;
        
        const observer = new MutationObserver((mutations) => {
          console.log('[Instagram Tracker - FOLLOW] 🔄 Mutation detected, checking states...');
          // Check if any follow button changed state
          for (let i = 0; i < initialStates.length; i++) {
            const state = initialStates[i];
            const currentState = this.getFollowButtonState(state.element);
            
            if (state.buttonText !== currentState.buttonText || state.isFollowing !== currentState.isFollowing) {
              console.log(`[Instagram Tracker - FOLLOW] 🎯 Button ${i + 1} state comparison:`, {
                before: { text: state.buttonText, isFollowing: state.isFollowing },
                after: { text: currentState.buttonText, isFollowing: currentState.isFollowing }
              });
            }
            
            if (this.detectFollowStateChange(state, currentState)) {
              console.log('[Instagram Tracker - FOLLOW] ✅ Follow state CHANGED! Success!', {
                was: state,
                now: currentState
              });
              this.reportActionResult(actionId, true, {
                previousState: state,
                newState: currentState,
                timestamp: Date.now()
              });
              this.cleanup(actionId);
              return;
            } else if (state.isFollowing && !currentState.isFollowing) {
              // Unfollow detected - update state and continue monitoring
              console.log('[Instagram Tracker - FOLLOW] Updating state after unfollow, continuing to monitor');
              Object.assign(state, currentState);
            }
          }
        });

        observer.observe(mainContent, {
          childList: true,
          attributes: true,
          subtree: true,
          attributeFilter: ['class', 'aria-label']
        });

        this.observers.set(actionId, observer);
        console.log('[Instagram Tracker - FOLLOW] 👁️ MutationObserver set up for:', actionId);
        console.log('[Instagram Tracker - FOLLOW] Observing element:', mainContent.tagName, 'with', mainContent.children.length, 'children');
        
        // Also set up polling as a fallback
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;
          if (pollCount % 10 === 0) { // Log every 5 seconds
            console.log(`[Instagram Tracker - FOLLOW] ⏱️ Polling check #${pollCount} (${pollCount * 500 / 1000}s elapsed)`);
          }
          
          for (let i = 0; i < initialStates.length; i++) {
            const state = initialStates[i];
            const currentState = this.getFollowButtonState(state.element);
            
            // Log any changes detected
            if (state.buttonText !== currentState.buttonText || state.isFollowing !== currentState.isFollowing) {
              console.log(`[Instagram Tracker - FOLLOW] 🔍 POLLING: Button ${i + 1} change detected:`, {
                before: { text: state.buttonText, isFollowing: state.isFollowing },
                after: { text: currentState.buttonText, isFollowing: currentState.isFollowing }
              });
            }
            
            if (this.detectFollowStateChange(state, currentState)) {
              console.log('[Instagram Tracker - FOLLOW] ✅ Follow state changed (via POLLING)!');
              clearInterval(pollInterval);
              this.reportActionResult(actionId, true, {
                previousState: state,
                newState: currentState,
                detectionMethod: 'polling',
                timestamp: Date.now()
              });
              this.cleanup(actionId);
              return;
            } else if (state.isFollowing && !currentState.isFollowing) {
              // Unfollow detected - update state and continue monitoring
              console.log('[Instagram Tracker - FOLLOW] Updating state after unfollow (via polling), continuing to monitor');
              Object.assign(state, currentState);
            }
          }
        }, 500);
        
        // Store interval for cleanup
        const existingInterval = this.pollingIntervals.get(actionId);
        if (existingInterval) clearInterval(existingInterval);
        this.pollingIntervals.set(actionId, pollInterval);
      }

      private findFollowButtons(): Element[] {
        const buttons: Element[] = [];
        
        console.log('[Instagram Tracker - FOLLOW] 🔎 Searching for follow buttons...');
        
        // Find buttons with Follow/Following text
        const allButtons = document.querySelectorAll('button, div[role="button"]');
        console.log(`[Instagram Tracker - FOLLOW] Total buttons/divs found: ${allButtons.length}`);
        
        allButtons.forEach(btn => {
          const text = btn.textContent?.trim() || '';
          // Look for follow-related text
          if (text === 'Follow' || text === 'Following' || text === 'Follow Back' || 
              text === 'Requested' || text === 'Unfollow') {
            buttons.push(btn);
            console.log(`[Instagram Tracker - FOLLOW] Found button with text: "${text}"`);
          }
        });

        // Also check for buttons with specific Instagram classes
        // _aswu = Follow button (not following)
        // _aswv = Following button (already following)
        const classButtons = document.querySelectorAll('button._acan, button._acap, button[class*="_ac"], button._aswu, button._aswv, button[class*="_asw"]');
        console.log(`[Instagram Tracker - FOLLOW] Buttons with Instagram classes: ${classButtons.length}`);
        
        classButtons.forEach(btn => {
          const text = btn.textContent?.trim() || '';
          if ((text.includes('Follow') || text === 'Following' || text === 'Requested') && 
              !buttons.includes(btn)) {
            buttons.push(btn);
            console.log(`[Instagram Tracker - FOLLOW] Found class-based button with text: "${text}"`);
          }
        });

        console.log(`[Instagram Tracker - FOLLOW] 📋 Total follow buttons found: ${buttons.length}`);
        return buttons;
      }

      private getFollowButtonState(button: Element): any {
        const text = button.textContent?.trim() || '';
        const classList = Array.from(button.classList);
        const hasChevron = !!button.querySelector('svg[aria-label*="chevron" i], svg[title*="chevron" i]');
        
        // Check for specific Instagram class indicators
        const hasFollowClass = classList.includes('_aswu'); // Not following
        const hasFollowingClass = classList.includes('_aswv'); // Following
        
        // Determine follow state based on multiple indicators
        let isFollowing = false;
        
        // Primary: Check text
        if (text === 'Following' || text === 'Requested') {
          isFollowing = true;
        } else if (text === 'Follow' || text === 'Follow Back') {
          isFollowing = false;
        }
        
        // Secondary: Check classes (Instagram specific)
        if (hasFollowingClass) {
          isFollowing = true;
        } else if (hasFollowClass) {
          isFollowing = false;
        }

        return {
          buttonText: text,
          buttonClass: classList.join(' '),
          hasChevron,
          isFollowing,
          hasFollowClass,
          hasFollowingClass
        };
      }

      private detectFollowStateChange(initial: any, current: any): boolean {
        console.log('[Instagram Tracker - FOLLOW] 🔍 Checking for state change...');
        
        // Primary check: Text change
        if (initial.buttonText !== current.buttonText) {
          console.log(`[Instagram Tracker - FOLLOW] Text changed: "${initial.buttonText}" → "${current.buttonText}"`);
          
          // Only valid FOLLOW transitions (not unfollow)
          const validFollowTransitions = [
            { from: 'Follow', to: 'Following' },
            { from: 'Follow', to: 'Requested' },
            { from: 'Follow Back', to: 'Following' },
            { from: 'Follow Back', to: 'Requested' }
          ];

          const isValidFollow = validFollowTransitions.some(t => 
            initial.buttonText === t.from && current.buttonText === t.to
          );

          if (isValidFollow) {
            console.log('[Instagram Tracker - FOLLOW] ✅ Valid follow action detected!');
            return true;
          }

          // Check if this is an unfollow transition (ignore these)
          const unfollowTransitions = [
            { from: 'Following', to: 'Follow' },
            { from: 'Requested', to: 'Follow' },
            { from: 'Following', to: 'Follow Back' }
          ];

          const isUnfollow = unfollowTransitions.some(t => 
            initial.buttonText === t.from && current.buttonText === t.to
          );

          if (isUnfollow) {
            console.log('[Instagram Tracker - FOLLOW] ⚠️ Unfollow detected - ignoring');
            return false;
          }

          console.log('[Instagram Tracker - FOLLOW] ⚠️ Text changed but not a valid follow transition');
        }

        // Secondary check: Only report if going from not following to following
        if (initial.isFollowing !== current.isFollowing) {
          if (!initial.isFollowing && current.isFollowing) {
            console.log(`[Instagram Tracker - FOLLOW] ✅ Started following: ${initial.isFollowing} → ${current.isFollowing}`);
            return true;
          } else if (initial.isFollowing && !current.isFollowing) {
            console.log(`[Instagram Tracker - FOLLOW] ⚠️ Unfollowed: ${initial.isFollowing} → ${current.isFollowing} - ignoring`);
            return false;
          }
        }

        // Tertiary check: Chevron appearance (typically appears when following)
        if (!initial.hasChevron && current.hasChevron && current.buttonText === 'Following') {
          console.log('[Instagram Tracker - FOLLOW] ✅ Chevron appeared with Following state');
          return true;
        }
        
        // Quaternary check: Class changes (_aswu → _aswv means followed)
        if (initial.hasFollowClass && !initial.hasFollowingClass && 
            !current.hasFollowClass && current.hasFollowingClass) {
          console.log('[Instagram Tracker - FOLLOW] ✅ Class changed from _aswu to _aswv (followed)');
          return true;
        }

        return false;
      }

      private extractUsername(): string | undefined {
        // Try to extract username from URL
        const urlMatch = window.location.pathname.match(/^\/([^\/]+)\/?$/);
        if (urlMatch) return urlMatch[1];

        // Try to extract from page title
        const titleMatch = document.title.match(/@(\w+)/);
        if (titleMatch) return titleMatch[1];

        // Try to find in profile header
        const profileName = document.querySelector('h1, h2[dir="auto"]');
        if (profileName?.textContent) {
          return profileName.textContent.replace('@', '').trim();
        }

        return undefined;
      }

      private findLikeButtons(): Element[] {
        const buttons: Element[] = [];
        
        // Find SVGs with Like or Unlike aria-label (case-insensitive)
        const svgs = document.querySelectorAll('svg');
        svgs.forEach(svg => {
          const ariaLabel = svg.getAttribute('aria-label')?.toLowerCase() || '';
          if (ariaLabel.includes('like')) {
            // Find the clickable parent element
            const parent = svg.closest('div[role="button"], button, span[role="button"], [tabindex="0"]');
            if (parent && !buttons.includes(parent)) {
              buttons.push(parent);
            } else if (!parent) {
              // Sometimes the SVG itself or its immediate parent is clickable
              const svgParent = svg.parentElement;
              if (svgParent && !buttons.includes(svgParent)) {
                buttons.push(svgParent);
              }
            }
          }
        });
        
        // Also look for buttons by class patterns (Instagram uses consistent classes)
        const potentialButtons = document.querySelectorAll('[role="button"]');
        potentialButtons.forEach(btn => {
          // Check if it contains a heart icon
          const hasSvg = btn.querySelector('svg');
          if (hasSvg && !buttons.includes(btn)) {
            const ariaLabel = hasSvg.getAttribute('aria-label')?.toLowerCase() || '';
            if (ariaLabel.includes('like')) {
              buttons.push(btn);
            }
          }
        });

        console.log(`[Instagram Tracker] Found ${buttons.length} like buttons`);
        return buttons;
      }

      private isLiked(element: Element): boolean {
        // Check SVG within the element
        const svg = element.querySelector('svg') || element.closest('svg');
        if (!svg) return false;

        const ariaLabel = svg.getAttribute('aria-label')?.toLowerCase() || '';
        const title = svg.querySelector('title')?.textContent?.toLowerCase() || '';
        
        // Primary check: aria-label
        // "Unlike" means it's currently liked (filled heart)
        if (ariaLabel.includes('unlike') || title.includes('unlike')) return true;
        
        // IMPORTANT: Instagram keeps aria-label="Like" even after liking
        // We need to check other indicators when aria-label is "Like"
        
        // Check for filled heart class indicators
        // xxk16z8 = filled heart (liked)
        // xyb1xck = empty heart (not liked)
        if (svg.classList.contains('xxk16z8')) return true;
        if (svg.classList.contains('xyb1xck')) return false;
        
        // Check fill colors for red/filled heart
        const fill = svg.getAttribute('fill');
        if (fill && (fill === 'rgb(255, 48, 64)' || fill === '#ff3040' || fill === '#ed4956')) {
          return true;
        }
        
        // Check path structure to distinguish filled vs outline heart
        const path = svg.querySelector('path');
        if (path) {
          const d = path.getAttribute('d') || '';
          const pathFill = path.getAttribute('fill');
          
          // Check if path has red fill color
          if (pathFill && (pathFill === 'rgb(255, 48, 64)' || pathFill === '#ff3040' || pathFill === '#ed4956')) {
            return true;
          }
          
          // Filled heart paths (liked state)
          // M34.6 is for 48x48 viewBox filled heart
          if (d.startsWith('M34.6')) return true;
          
          // M16.792 pattern with specific ending indicates outline (not liked)
          // The filled version has different path data
          if (d.includes('M16.792 3.904') && d.includes('6.708-7.218Z')) {
            // This is the outline heart pattern
            return false;
          }
        }
        
        // Additional check: parent element classes
        // Sometimes the button or parent div has state indicators
        const parentButton = element.closest('button') || element.closest('div[role="button"]');
        if (parentButton) {
          // Check for active/pressed state classes
          const classList = Array.from(parentButton.classList);
          if (classList.some(c => c.includes('xxk16z8'))) return true;
        }
        
        // If we still have aria-label="Like" and no other indicators, it's not liked
        if (ariaLabel === 'like' && !ariaLabel.includes('unlike')) return false;
        
        // Default to not liked if we can't determine
        return false;
      }

      private reportActionResult(actionId: string, success: boolean, details?: any) {
        console.log('[Instagram Tracker] Reporting action result:', {
          actionId,
          success,
          details
        });

        const action = this.pendingActions.get(actionId);
        
        // Create detailed proof for database
        const proof = {
          actionType: action?.actionType || 'unknown',
          platform: 'instagram',
          targetUrl: window.location.href,
          timestamp: Date.now(),
          domState: {
            previousState: details?.previousState,
            newState: details?.newState,
            elementFound: success,
            selector: details?.selector
          },
          userAgent: navigator.userAgent,
          tabId: undefined  // Will be filled by background script
        };

        browser.runtime.sendMessage({
          type: 'ACTION_COMPLETED',
          payload: {
            actionId,
            success,
            details: {
              ...details,
              ...proof
            },
            timestamp: Date.now()
          }
        }).catch(err => {
          console.error('[Instagram Tracker] Failed to send completion message:', err);
        });
      }

      private cleanup(actionId: string) {
        console.log('[Instagram Tracker] Starting cleanup for action:', actionId);
        
        // Stop and remove observer
        const observer = this.observers.get(actionId);
        if (observer) {
          observer.disconnect();
          this.observers.delete(actionId);
          console.log('[Instagram Tracker] Removed observer for:', actionId);
        }
        
        // Clear polling interval
        const interval = this.pollingIntervals.get(actionId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(actionId);
          console.log('[Instagram Tracker] Cleared polling interval for:', actionId);
        }

        // Remove from pending actions
        const action = this.pendingActions.get(actionId);
        if (action) {
          // Clear any stored state
          if (action.initialState) {
            delete action.initialState;
          }
          this.pendingActions.delete(actionId);
          console.log('[Instagram Tracker] Removed pending action:', actionId);
        }

        // If no more pending actions, reset the tracker state
        if (this.pendingActions.size === 0) {
          console.log('[Instagram Tracker] No more pending actions, resetting tracker state');
          this.observers.clear();
          this.pollingIntervals.clear();
        }

        console.log('[Instagram Tracker] Cleanup completed for:', actionId);
        console.log('[Instagram Tracker] Remaining pending actions:', this.pendingActions.size);
      }
    }

    // Initialize tracker
    const tracker = new InstagramActionTracker();

    // Handle page navigation (Instagram is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('[Instagram Tracker] Page navigation detected:', url);
      }
    }).observe(document, { subtree: true, childList: true });
  },
});