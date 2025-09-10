# UI Package Integration Process

This document outlines the complete process for integrating the `@xad/ui` package with the WXT browser extension.

## Overview

The XAD UI package (`@xad/ui`) is a comprehensive React component library with:
- Dark-first design system using CSS custom properties
- Radix UI primitives with custom styling
- Tailwind CSS with custom configuration
- Built-in theme provider and utilities

## Integration Steps

### 1. Package Configuration

First, ensure the UI package is properly configured to export built files:

**packages/ui/package.json**:
```json
{
  "name": "@xad/ui",
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js"
    },
    "./styles": "./src/styles/globals.css"
  },
  "files": ["src", "dist"]
}
```

### 2. Build the UI Package

Always build the UI package before using it:

```bash
cd packages/ui
bun run build
```

This creates the `dist/` directory with compiled JavaScript files that avoid path resolution issues.

### 3. Extension Dependencies

Add required dependencies to your extension's `package.json`:

```json
{
  "dependencies": {
    "@xad/ui": "workspace:*",
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "@phosphor-icons/react": "^2.1.10",
    "lucide-react": "^0.542.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6"
  }
}
```

### 4. Tailwind Configuration

Create `tailwind.config.js` that mirrors the UI package configuration:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./entrypoints/**/*.{ts,tsx,html}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 5. PostCSS Configuration

Create `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 6. WXT Configuration

Update `wxt.config.ts` to handle the UI package:

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    permissions: ['sidePanel', 'tabs']
  },
  vite: () => ({
    css: {
      postcss: './postcss.config.js'
    },
    optimizeDeps: {
      include: ['@xad/ui'],
      exclude: ['@xad/ui/src']
    },
    server: {
      fs: {
        allow: ['..']
      }
    }
  })
});
```

### 7. Component Usage

Import and use components in your extension:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Home, Button, Card } from '@xad/ui';
import '@xad/ui/styles';
import './style.css';

const App = () => {
  return <Home />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 8. Style Integration

Import UI package styles in your CSS files:

```css
@import '@xad/ui/styles';

/* Extension-specific styles */
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

## Key Design Tokens

The UI package provides the following CSS custom properties:

### Colors
- `--background: #0a0a0a` (very dark)
- `--foreground: #ededed` (light gray)
- `--primary: #4d61ff` (blue accent)
- `--card: #111111` / `--popover: #1a1a1a`
- `--secondary: #262626` / `--muted: #262626` / `--accent: #262626`
- `--destructive: #dc2626` (red)
- `--border: #262626` / `--input: #1a1a1a`

### Typography
- `--font-sans: Outfit, sans-serif`
- `--tracking-normal: 0.025em`

### Layout
- `--radius: 0.5rem`
- `--spacing: 0.25rem`

## Available Components

### Base UI Components
- Button, Card, Input, Label, Badge
- Avatar, Dialog, Dropdown Menu, Tooltip
- Separator, Alert, Accordion

### Domain-Specific Components
- **Authentication**: LoginButton, LogoutButton, UserProfile
- **Wallet**: CreateWalletButton, WalletList
- **Verification**: VerificationFlow, PlatformSelector
- **Daily Tasks**: DailyStreakWidget, JackpotWidget, DailyTaskCard
- **Earnings**: EarningsWidget, CashOutPage
- **Tasks**: ActionListPage
- **Welcome**: Home
- **Utilities**: Spinner, ErrorDisplay, AuthStateIndicator

### Platform Support
The UI package includes configurations for:
- X (Twitter)
- Instagram  
- TikTok
- Facebook
- LinkedIn
- Farcaster

## Troubleshooting

### Common Issues

1. **Path resolution errors**: Ensure the UI package is built and exports point to `dist/` files
2. **CSS variables not working**: Import `@xad/ui/styles` before custom styles
3. **Tailwind classes not applying**: Verify tailwind.config.js matches the UI package configuration
4. **Component not found**: Check the component is exported in the UI package's `index.ts`

### Development Workflow

1. Make changes to UI package components
2. Run `bun run build` in packages/ui
3. Restart the extension dev server
4. Test the integration

## File Structure

```
apps/actions/
├── entrypoints/
│   └── sidepanel/
│       ├── index.html
│       ├── main.tsx
│       └── style.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── wxt.config.ts
└── UI_INTEGRATION.md
```

This setup ensures the extension can use the complete XAD UI component library with proper theming and styling.