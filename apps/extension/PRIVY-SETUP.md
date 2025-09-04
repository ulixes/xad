# Privy Authentication Setup

## 🚀 Quick Setup

### 1. Create Privy Account & App
1. Go to [Privy Dashboard](https://dashboard.privy.io/apps)
2. Create new app
3. Copy your App ID

### 2. Environment Configuration
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Privy App ID
VITE_PRIVY_APP_ID=your_actual_app_id_here
```

### 3. Configure Privy Dashboard

**App Settings > Domains:**
```
chrome-extension://your-extension-id-will-be-here
```

**Allowed Redirect URLs:**
```
https://your-extension-id.chromiumapp.org/
```

### 4. Build & Test
```bash
# Build extension
bun run build

# Load in Chrome
1. Go to chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `build` folder
5. Copy the extension ID from Chrome
6. Update Privy dashboard with actual extension ID
```

## 🔐 Authentication Flow

### Side Panel Authentication
1. **Not Authenticated**: Shows login options
   - "Sign In with Email" - Works directly in side panel
   - "More Login Options" - Opens popup for social login

2. **Email Authentication Flow**:
   - User enters email in side panel
   - Privy sends OTP/magic link
   - User completes auth in side panel
   - ✅ Authenticated

3. **Social Authentication Flow**:
   - User clicks "More Login Options"
   - Opens popup window (400x640px)
   - Privy handles OAuth (Google, Twitter, Apple)
   - Popup closes automatically
   - ✅ Authenticated in side panel

### Task Flow with Authentication
1. **Unauthenticated**: Shows auth component + waiting state
2. **Authenticated**: Shows full TaskPanel with user info
3. **Task Received**: Displays in authenticated panel
4. **Wallet Creation**: Optional wallet creation for crypto tasks

## 🎨 UI Components

### AuthButton Component
- **Not authenticated**: Login buttons + instructions
- **Authenticated**: User info, wallet status, logout
- **Brutalist styling**: Matches your Neo Brutalism theme

### Updated TaskPanel
- **Authentication required**: Shows auth component first
- **Authenticated**: Full task display with user context
- **Task waiting**: Shows waiting state below auth if needed

## 🛠️ Features

### Supported Login Methods
**Side Panel (Direct)**:
- ✅ Email + OTP
- ✅ SMS + OTP

**Auth Popup (OAuth)**:
- ✅ Google
- ✅ Twitter/X  
- ✅ Apple
- ✅ Facebook
- ✅ GitHub
- ✅ Discord

### Wallet Integration
- ✅ Create embedded wallet
- ✅ Connect external wallets
- ✅ Sign messages/transactions
- ✅ Multi-wallet support

### Security Features
- ✅ Chrome extension CSP compliance
- ✅ Frame-ancestors protection
- ✅ Minimal permissions (identity, storage)
- ✅ Secure OAuth redirects

## 🔧 Development

### File Structure
```
entrypoints/
├── auth/
│   ├── index.html          # Auth popup HTML
│   └── main.tsx            # Auth popup React app
└── sidepanel/
    ├── index.html          # Main side panel
    └── main.tsx            # Side panel with PrivyProvider

components/
├── AuthButton.tsx          # Authentication UI component
└── TaskPanel.tsx           # Updated with auth integration

wxt.config.ts               # Updated manifest for Privy
.env                        # Privy App ID configuration
```

### Key Configuration
**Manifest Updates** (wxt.config.ts):
- Added `identity` permission for OAuth
- Added `https://auth.privy.io/*` host permission
- Added Content Security Policy
- Maintains existing side panel config

**Privy Configuration**:
- Email + SMS login for side panel
- Social login via popup window
- Brutalist theme colors (#ff3333)
- Extension logo integration

## 📱 User Experience

### First Time User
1. Opens extension → Side panel opens
2. Sees "Authentication Required" card
3. Can sign in with email (quick) or social (popup)
4. Once authenticated, can receive and view tasks

### Returning User  
1. Opens extension → Automatically authenticated
2. Sees account status + wallet info
3. Ready to receive tasks immediately
4. Can manage wallet and account settings

### Task Workflow
1. **External app** sends task data
2. **Extension** receives via background script  
3. **Side panel** displays task (if authenticated)
4. **User** views task details, opens links, completes work
5. **Optional**: Use wallet for crypto-related tasks

## 🚨 Security Notes

- Environment variables are build-time only
- Extension ID must be registered in Privy dashboard
- OAuth redirects are handled securely via browser windows
- No secrets stored in extension code
- CSP prevents unauthorized script execution

---

**Next Steps**: Get your Privy App ID and test the authentication flow!