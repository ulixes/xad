# Instagram Account Verification Flow Analysis

## Overview
This document details the complete flow of Instagram account verification in the XAD Actions extension, from UI interaction to background processing, including the issues discovered with usernames containing dots (e.g., "ma3ak.health").

## Architecture Components

### 1. Frontend/UI Layer
- **Location**: Side panel UI
- **State Management**: XState machines
- **Key Files**:
  - `src/machines/userMachine.ts` - Parent state machine managing all accounts
  - `src/machines/accountMachine.ts` - Child state machine for individual account verification

### 2. Service Layer
- **Location**: Content script context
- **Key Files**:
  - `src/services/VerificationService.ts` - Sends messages to background script

### 3. Background Script
- **Location**: Extension background
- **Key Files**:
  - `entrypoints/background.ts` - Message handler and tab management
  - `src/services/InstagramVerifier.ts` - Core verification logic using Chrome Debugger API

## Detailed Flow

### Step 1: User Initiates Account Addition
**UI Action**: User enters Instagram username (e.g., "ma3ak.health") and clicks add

**File**: `src/machines/userMachine.ts`
```typescript
// User machine spawns a new account machine for the Instagram account
spawn(accountMachine, {
  id: accountId,
  input: {
    id: accountId,
    platform: 'instagram',
    handle: username
  }
})
```

### Step 2: Account Machine Starts Verification
**File**: `src/machines/accountMachine.ts` (lines 31-36)
```typescript
const verifyAccountService = fromPromise(async ({ input }: {
  input: { platform: string; handle: string }
}): Promise<ProfileData> => {
  console.log('Verifying account...');
  return await VerificationService.startVerification(input.platform, input.handle);
});
```

**State Transition**: `initial` → `verifying`

### Step 3: Verification Service Sends Message
**File**: `src/services/VerificationService.ts` (lines 4-34)
```typescript
static async startVerification(platform: string, username: string): Promise<ProfileData> {
  console.log(`[VerificationService] Sending verification request for ${platform}:"${username}"`);
  
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({
      type: 'START_VERIFICATION',
      platform,
      username
    }, (response) => {
      // Handle response...
    });
  });
}
```

**Message Sent**: 
```json
{
  "type": "START_VERIFICATION",
  "platform": "instagram",
  "username": "ma3ak.health"
}
```

### Step 4: Background Script Handles Message
**File**: `entrypoints/background.ts` (lines 16-21)
```typescript
browser.runtime.onMessage.addListener((message: VerificationMessage, sender, sendResponse) => {
  if (message.type === 'START_VERIFICATION') {
    handleVerificationRequest(message.platform, message.username, sendResponse);
    return true; // Keep message channel open for async response
  }
});
```

### Step 5: Background Creates Verification Tab
**File**: `entrypoints/background.ts` (lines 23-100)
```typescript
async function handleVerificationRequest(platform: string, username: string, sendResponse) {
  // 1. Get verifier for platform
  const verifier = verifiers.get('instagram'); // InstagramVerifier instance
  
  // 2. Construct profile URL
  const profileUrl = getProfileUrl(platform, username);
  // For "ma3ak.health": https://www.instagram.com/ma3ak.health/
  
  // 3. Create new tab
  const tab = await browser.tabs.create({
    url: profileUrl,
    active: true // Must be active for Instagram to load properly
  });
  
  // 4. Start verification (BEFORE tab loads to catch early requests)
  const verificationPromise = verifier.verifyAccount(username, tab.id);
  
  // 5. Wait for tab to load
  await waitForTabToLoad(tab.id);
  
  // 6. Wait for verification result
  const result = await verificationPromise;
  
  // 7. Close tab and send response
  await browser.tabs.remove(tab.id);
  sendResponse(result);
}
```

### Step 6: Instagram Verifier Attaches Debugger
**File**: `src/services/InstagramVerifier.ts` (lines 7-189)

#### 6.1 Setup Phase
```typescript
async verifyAccount(username: string, tabId: number): Promise<VerificationResult> {
  console.log(`Starting verification for username: "${username}"`);
  
  return new Promise((resolve) => {
    let isResolved = false;
    const graphqlRequestIds = new Set<string>();
    
    // Setup cleanup function
    const cleanup = () => {
      browser.debugger.detach({ tabId });
    };
```

#### 6.2 Attach Debugger & Enable Network Monitoring
```typescript
    // Attach debugger to tab
    browser.debugger.attach({ tabId }, '1.3', () => {
      // Enable network monitoring
      browser.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
        // Listen for network events
        browser.debugger.onEvent.addListener(handleDebuggerEvent);
      });
    });
```

#### 6.3 Intercept Network Requests
```typescript
const handleDebuggerEvent = (source: any, method: string, params: any) => {
  // Track GraphQL requests when sent
  if (method === 'Network.requestWillBeSent') {
    const url = params.request.url;
    if (this.isTargetRequest(url)) {
      // Store request ID for later matching
      graphqlRequestIds.add(params.requestId);
    }
  }
  
  // Process responses when received
  if (method === 'Network.responseReceived') {
    if (graphqlRequestIds.has(params.requestId)) {
      // Get response body after small delay
      setTimeout(() => {
        browser.debugger.sendCommand(
          { tabId },
          'Network.getResponseBody',
          { requestId: params.requestId },
          (response: any) => {
            // Extract and verify profile data
            const profileData = this.extractProfileData(response.body);
            // Compare usernames...
          }
        );
      }, 100);
    }
  }
};
```

### Step 7: Profile Data Extraction
**File**: `src/services/InstagramVerifier.ts` (lines 207-261)
```typescript
extractProfileData(responseBody: string): ProfileData | null {
  const response = JSON.parse(responseBody);
  
  // Try different response structures
  let user = null;
  
  // Standard GraphQL: response.data.user
  // Alternative API: response.user  
  // XDT API: response.data.xdt_api__v1__users__web_profile_info.user
  
  if (!user) return null;
  
  return {
    username: user.username || '',
    fullName: user.full_name || '',
    // ... other fields
  };
}
```

## Issues Identified

### Issue 1: Username with Dots ("ma3ak.health")
**Problem**: Verification fails for usernames containing dots

**Root Causes**:
1. **Multiple GraphQL Responses**: Instagram sends multiple GraphQL requests, some with incomplete data (just user ID), others with full profile
2. **Username Extraction**: First response often lacks username field, causing empty string comparison
3. **Response Processing Order**: Not filtering out incomplete responses

**Example Log**:
```
First Response (Incomplete):
{"data":{"user":{"id":"650864995"}}}
→ Extracted username: "" (undefined)
→ Comparison fails: "ma3ak.health" ≠ ""

Second Response (Complete):
{"data":{"user":{"username":"ma3ak.health", ...}}}
→ But first response already failed
```

### Issue 2: Tab Cleanup Race Condition
**Problem**: "No tab with given id" error after verification

**Cause**: 
- Tab is closed in background.ts (line 77)
- Debugger tries to detach in cleanup() after tab already closed
- Results in unchecked runtime error

### Issue 3: Subsequent Verifications Stuck
**Problem**: After first verification, subsequent attempts get stuck in "verifying" state

**Possible Causes**:
1. Event listeners not properly cleaned up
2. Debugger not properly detached
3. State machine not resetting properly

## Solution Implemented

### 1. Enhanced Username Detection
- Added detailed logging with quotes around usernames
- Track username throughout entire flow
- Log character codes for debugging hidden characters

### 2. Improved Response Handling
- Check for username existence before processing: `if (profileData && profileData.username)`
- Skip incomplete responses with warning log
- Clear timeout IDs before cleanup

### 3. Better API Detection
```typescript
isTargetRequest(url: string): boolean {
  // Expanded to catch more Instagram endpoints
  return url.includes('instagram.com/graphql/query') ||
         url.includes('instagram.com/api/v1/') ||
         url.includes('instagram.com/api/v1/users/web_profile_info');
}
```

### 4. Flexible Response Parsing
- Support multiple Instagram API response structures
- Handle edge_followed_by/edge_follow count formats
- Fallback fields for profile data

## Testing Recommendations

1. **Test with various username formats**:
   - Simple: "aqrajo" ✓
   - With dot: "ma3ak.health" 
   - With underscore: "test_user"
   - With numbers: "user123"
   - Mixed: "user.name_123"

2. **Test error scenarios**:
   - Non-existent username
   - Private account
   - Suspended account
   - Network timeout

3. **Test sequential verifications**:
   - Add multiple accounts rapidly
   - Retry failed verifications
   - Mix successful and failed attempts

## Future Improvements

1. **Implement request queuing**: Prevent concurrent verifications
2. **Add retry mechanism**: Auto-retry on specific failure types  
3. **Improve cleanup**: Use try-finally for guaranteed cleanup
4. **Add request filtering**: Only process responses with complete user data
5. **Implement caching**: Store successful verifications temporarily
6. **Better error messages**: Provide user-friendly error descriptions