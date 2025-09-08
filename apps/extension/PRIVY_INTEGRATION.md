# Privy Authentication Integration for WXT Extension

## Required Dependencies

```bash
bun add @privy-io/react-auth react react-dom buffer
bun add -D @types/react @types/react-dom
```

## Manifest Permissions

Add to `wxt.config.ts`:
```ts
export default defineConfig({
  manifest: {
    permissions: ["identity"],
    host_permissions: ["https://auth.privy.io/*"],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
    }
  }
});
```

## Environment Variables

Create `.env`:
```
VITE_PRIVY_APP_ID=cmf6izaj6006mld0brhfx9u7d
```

## Core Implementation

### 1. Main App Component (wxt sidepanle) https://wxt.dev/guide/essentials/entrypoints.html#side-panel with PrivyProvider

```tsx
import React from "react";
import { Buffer } from "buffer";
import { PrivyProvider } from "@privy-io/react-auth";
import { Popup } from "./components/Popup";

// Required for Node.js globals in browser
(window as any).Buffer = (window as any).Buffer || Buffer;

export function App() {
  return (
    <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID}>
      <Popup />
    </PrivyProvider>
  );
}
```

### 2. Authentication Component

```tsx
import React from "react";
import {
  usePrivy,
  useWallets,
  useCreateWallet
} from "@privy-io/react-auth";

export function Popup() {
  const { authenticated, logout, user, login } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const openAuthWindow = () => {
    chrome.windows.create({
      url: chrome.runtime.getURL("auth.html"),
      type: "popup",
      width: 420,
      height: 640,
    });
  };

  if (!authenticated) {
    return (
      <div>
        <button onClick={login}>Login with Privy</button>
        <button onClick={openAuthWindow}>Login (Popup)</button>
      </div>
    );
  }

  return (
    <div>
      <p>Authenticated as: {user?.email || user?.wallet?.address}</p>
      <button onClick={logout}>Logout</button>

      {wallets.length === 0 && (
        <button onClick={createWallet}>Create Wallet</button>
      )}
    </div>
  );
}
```

### 3. WXT Entrypoints Setup

**entrypoints/sidepanel.html:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Side Panel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./sidepanel.tsx"></script>
  </body>
</html>
```

**entrypoints/sidepanel.tsx:**
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "../src/App";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
```

### 4. Auth Popup (Optional)

**entrypoints/auth.html:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Authentication</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./auth.tsx"></script>
  </body>
</html>
```

**entrypoints/auth.tsx:**
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "../src/App";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
```

## Key Features

- **Authentication**: Login/logout with email, phone, or wallet
- **Wallet Management**: Create embedded wallets
- **Popup Support**: Optional popup window for authentication
- **User Data**: Access user profile and wallet information

## Important Notes

1. Privy App ID must be configured in environment variables
2. Buffer polyfill is required for browser compatibility
3. CSP policy allows Privy authentication domain
4. Identity permission enables Chrome extension OAuth flows
5. Host permissions required for Privy authentication endpoints
