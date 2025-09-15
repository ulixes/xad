# XAD Browser Extension

A browser extension for the XAD platform that enables users to earn rewards by completing social media actions (likes, follows, comments) on Instagram and TikTok.

## Architecture Overview

### System Components

1. **Sidepanel UI** (`entrypoints/sidepanel/`)
   - React-based interface for user interaction
   - Displays eligible actions from connected social accounts
   - Manages wallet connection via Porto
   - Tracks action status and earnings

2. **Background Service Worker** (`entrypoints/background.ts`)
   - Handles message routing between components
   - Manages browser tab lifecycle for actions
   - Coordinates social account data collection

3. **Content Scripts**
   - **Instagram** (`entrypoints/instagram.content.ts`): Tracks likes, follows, and comments
   - **TikTok** (`entrypoints/tiktok.content.ts`): Tracks platform actions
   - Performs DOM-based action verification

4. **Action Handler** (`src/background/actionHandler.ts`)
   - Orchestrates action execution flow
   - Injects content scripts dynamically
   - Routes completion messages to sidepanel

## Action Verification Flow

The system uses a multi-step verification process to ensure actions are legitimate:

```
1. User clicks action in sidepanel
   ↓
2. API creates action_run (status: pending_verification)
   ↓
3. Background script opens target URL in new tab
   ↓
4. Content script tracks DOM changes
   ↓
5. Action detected → sends completion message
   ↓
6. Sidepanel updates action_run (status: dom_verified)
   ↓
7. Backend performs CDP verification (status: cdp_verified)
   ↓
8. Payment processed (status: paid)
```

### Key Features

- **Duplicate Action Prevention**: Checks for existing action runs before creating new ones
- **Resume/Retry Logic**: Failed actions can be retried, in-progress actions can be resumed
- **Real-time DOM Tracking**: MutationObserver + polling for reliable action detection
- **Immediate State Management**: Uses React refs for instant access to action run IDs

## Configuration

### Development Environment

The extension is configured to use local development servers by default:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:8787';
```

### Production Deployment

To deploy to production, you need to configure the following:

#### 1. API Endpoint Configuration

Update `src/services/api.ts`:

```typescript
const API_BASE_URL = (() => {
  // For production, replace with your actual API URL
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Check if it's the production extension ID
    const PROD_EXTENSION_ID = 'YOUR_PRODUCTION_EXTENSION_ID';
    if (chrome.runtime.id === PROD_EXTENSION_ID) {
      return 'https://api.xad.com';  // Your production API
    }
  }
  return 'http://localhost:8787';  // Development API
})();
```

#### 2. Environment Variables

Create a `.env.production` file:

```bash
# API Configuration
VITE_API_URL=https://api.xad.com
VITE_API_KEY=your_api_key_here

# Porto Wallet Configuration (if needed)
VITE_PORTO_APP_ID=your_porto_app_id

# Extension Configuration
VITE_EXTENSION_NAME="XAD - Earn from Social Media"
VITE_EXTENSION_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_TIKTOK=true
VITE_ENABLE_INSTAGRAM=true
VITE_ENABLE_COMMENTS=false  # Currently disabled

# Tracking Configuration
VITE_ACTION_TIMEOUT=120000  # 2 minutes in milliseconds
VITE_POLLING_INTERVAL=500   # DOM polling interval in ms
```

#### 3. Manifest Configuration

Update `wxt.config.ts` for production:

```typescript
export default defineConfig({
  manifest: {
    name: process.env.VITE_EXTENSION_NAME || 'XAD Extension',
    permissions: [
      'activeTab',
      'storage',
      'scripting',
      'sidePanel',
      'tabs',
      'debugger'  // Required for Instagram data collection
    ],
    host_permissions: [
      'https://*.instagram.com/*',
      'https://*.tiktok.com/*',
      process.env.VITE_API_URL || 'http://localhost:8787/*'
    ],
    content_scripts: [
      {
        matches: ['*://*.instagram.com/*'],
        js: ['content-scripts/instagram.js']
      },
      {
        matches: ['*://*.tiktok.com/*'],
        js: ['content-scripts/tiktok.js']
      }
    ]
  }
});
```

#### 4. Build Configuration

For production builds:

```bash
# Install dependencies
bun install

# Build for production
bun run build

# The production-ready extension will be in .output/chrome-mv3/
```

### Configurable Keys

| Key | Description | Default | Required |
|-----|-------------|---------|----------|
| `API_BASE_URL` | Backend API endpoint | `http://localhost:8787` | Yes |
| `PORTO_APP_ID` | Porto wallet integration ID | - | Yes (for wallet features) |
| `EXTENSION_ID` | Production extension ID for API detection | - | Yes (for production) |
| `ACTION_TIMEOUT` | Maximum time to wait for action completion | `120000` (2 min) | No |
| `POLLING_INTERVAL` | DOM checking frequency | `500` (ms) | No |
| `DEBUGGER_VERSION` | Chrome debugger API version | `1.3` | No |
| `MAX_RETRY_ATTEMPTS` | Maximum action retry attempts | `3` | No |

### Security Considerations

1. **API Authentication**: Implement proper authentication tokens for production
2. **Content Security Policy**: Configure CSP headers appropriately
3. **Sensitive Data**: Never commit API keys or secrets to repository
4. **HTTPS Only**: Always use HTTPS endpoints in production
5. **Extension Permissions**: Request only necessary permissions

## Development

### Local Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build extension
bun run build
```

### Testing Action Flow

1. Start local API server: `cd ../api && bun run dev`
2. Load extension in Chrome: `chrome://extensions/` → Load unpacked → Select `.output/chrome-mv3`
3. Open extension sidepanel
4. Connect wallet and add social accounts
5. Click on eligible actions to test verification flow

### Debugging

- **Background Script Logs**: View in extension's background page console
- **Content Script Logs**: View in the web page console where action is performed
- **Sidepanel Logs**: View in sidepanel's DevTools console
- **Network Requests**: Monitor in DevTools Network tab

### Common Issues

1. **Action Run ID Not Found**: Ensure React refs are properly initialized
2. **Duplicate Completions**: Check for multiple event listeners or observers
3. **DOM Verification Fails**: Verify content script injection and permissions
4. **API Connection Issues**: Check CORS settings and API endpoint configuration

## Production Checklist

- [ ] Update API_BASE_URL to production endpoint
- [ ] Configure production extension ID
- [ ] Set up proper authentication mechanism
- [ ] Update manifest permissions for production domains
- [ ] Remove all console.log statements and debug code
- [ ] Test on multiple browsers and platforms
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure auto-update mechanism
- [ ] Submit to Chrome Web Store
- [ ] Set up monitoring and analytics

## License

Proprietary - XAD Platform