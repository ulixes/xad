# Instagram Action Tracking System

## Overview
The extension now includes a DOM-based tracking system for Instagram actions (likes, comments, follows) without using the Chrome Debugger API.

## Architecture

### 1. **Content Script** (`instagram-content.ts`)
- Automatically injected on Instagram pages
- Uses MutationObserver to track DOM changes
- Detects action completion by monitoring:
  - **Likes**: SVG aria-label changes from "Like" to "Unlike"
  - **Comments**: New list items added to comment sections
  - **Follows**: Button text changes from "Follow" to "Following"

### 2. **Background Script** (`background-actions.ts`)
- Manages action execution flow
- Creates tabs for action URLs
- Communicates with content scripts
- Handles timeouts and fallbacks

### 3. **Type Definitions** (`src/types/actions.ts`)
- Provides TypeScript interfaces for action tracking
- Ensures type safety across the system

## How It Works

### Action Flow:
1. **Sidepanel** sends `executeAction` message to background
2. **Background** creates new tab with action URL
3. **Background** sends `TRACK_ACTION` message to content script
4. **Content Script** sets up MutationObserver for specific action
5. **User** performs the action manually
6. **Content Script** detects DOM changes
7. **Content Script** sends `ACTION_COMPLETED` to background
8. **Background** forwards completion to sidepanel
9. **Tab** closes automatically after success

## Detection Methods

### Like Detection:
```javascript
// Primary: aria-label change
svg[aria-label="Unlike"] // Liked state
svg[aria-label="Like"]   // Not liked state

// Secondary: ViewBox change
viewBox="0 0 48 48" // Liked (filled heart)
viewBox="0 0 24 24" // Not liked (outline)

// Tertiary: Class change
svg.xxk16z8 // Specific class for liked state
```

### Comment Detection:
- Monitors comment list containers
- Counts children before/after action
- Detects new `<li>` or `[role="listitem"]` elements
- Validates by checking for username in new comment

### Follow Detection:
- Monitors button text content
- Detects "Follow" → "Following" change
- Handles "Requested" state for private accounts
- Checks aria-label attributes

## Features

### Automatic Fallback:
- If Instagram content script fails to load
- Falls back to timer-based completion (5 seconds)
- Works for non-Instagram platforms

### Error Handling:
- 30-second timeout for action detection
- Tab close detection (action cancelled)
- Retry mechanism for content script communication
- Clear error messages to user

### Multi-Action Support:
- Tracks multiple simultaneous actions
- Unique action IDs prevent conflicts
- Independent observers per action

## Testing

### Manual Testing Steps:
1. Build and load the extension
2. Open the sidepanel
3. Navigate to action list/campaign
4. Click an Instagram action (like/comment/follow)
5. Extension opens Instagram in new tab
6. Perform the action manually
7. Watch console for tracking logs
8. Tab should close automatically on success
9. Sidepanel should update with completion status

### Console Logs to Monitor:
```
[Instagram Tracker] Content script loaded
[Instagram Tracker] Starting like tracking for: [actionId]
[Instagram Tracker] Like state changed!
[Instagram Tracker] Reporting action result
```

## Permissions Required

In `wxt.config.ts`:
```typescript
permissions: ['sidePanel', 'tabs', 'activeTab', 'scripting'],
host_permissions: ['*://*.instagram.com/*']
```

## Limitations & Future Improvements

### Current Limitations:
- Requires manual action by user
- Instagram UI changes may break selectors
- SPA navigation may require re-initialization

### Planned Improvements:
- Add support for more actions (save, share, repost)
- Implement automatic action execution
- Add visual indicators in content script
- Support for Instagram Stories and Reels
- Better handling of private accounts
- Analytics and success rate tracking

## Troubleshooting

### Content script not loading:
- Check if Instagram URL matches pattern
- Verify permissions in manifest
- Check for CSP restrictions

### Action not detected:
- Instagram may have updated their UI
- Check console for selector failures
- Verify MutationObserver is active

### Tab closes too quickly:
- Increase delay in background script
- Check for action completion timing

## Development

### Adding New Action Types:
1. Add type to `ActionType` in `actions.ts`
2. Create detection method in content script
3. Add case in `startTracking()` switch
4. Implement specific tracking function
5. Test with real Instagram actions