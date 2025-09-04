# Chrome Extension Permissions Documentation

## Standard Permissions

**`sidePanel`** - Opens task management interface in browser side panel instead of popup window. Used in background.ts:4-21 to handle extension icon clicks.

**`storage`** - Persists user data, authentication state, and task progress locally. Required for maintaining extension state between browser sessions.

**`identity`** - Manages user authentication through Privy auth service. Enables secure login/logout functionality for the task management system.


**`tabs`** - Creates and manages browser tabs programmatically. Used in reddit-facade.ts:53-56 to open Reddit profile pages during verification flows.

**`activeTab`** - Detects current active tab context for verification workflows. Used in twitterVerificationMachine.ts:62-63 to determine if user is on Twitter/X.

**`webRequest`** - Monitors network requests to capture API responses from social platforms. Used in background-old.ts and reddit-capture-facade.ts to intercept GraphQL requests.

## Host Permissions

**`https://auth.privy.io/*`** - Authentication service endpoints. Required for secure user login, wallet connection, and identity management through Privy.

**`https://x.com/i/api/graphql/*`** - Twitter/X API monitoring. Used by likes-monitor.ts:13 content script to capture Twitter Likes GraphQL responses for social verification tasks.

## Purpose Summary
This extension enables automated verification of social media interactions (likes, follows, posts) by monitoring platform APIs and managing authentication through a side panel interface.