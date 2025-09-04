# Project Structure

The Microtask Platform follows WXT's strict project structure conventions for browser extension development. This document outlines the organization and purpose of each directory.

## Directory Overview

```
📂 microtask/
├── 📁 .output/           # Built extension files (auto-generated)
├── 📁 .wxt/             # WXT cache and temp files
├── 📁 assets/           # Static assets (images, fonts)
├── 📁 components/       # React components
├── 📁 entrypoints/      # Extension entry points
├── 📁 lib/              # Core business logic
├── 📁 public/           # Public static files
├── 📁 e2e/              # End-to-end tests
├── 📁 docs/             # Documentation
├── 📄 wxt.config.ts     # WXT configuration
├── 📄 tailwind.config.js # Tailwind configuration
├── 📄 tsconfig.json     # TypeScript configuration
└── 📄 package.json      # Project dependencies
```

## Core Directories

### `/components`

React components organized by feature domain:

```
components/
├── ui/                  # Base UI components
│   ├── button.tsx       # Base button component
│   ├── card.tsx         # Card component
│   ├── neo-button.tsx   # Neo-brutalism button
│   ├── neo-card.tsx     # Neo-brutalism card
│   └── ...
├── auth/                # Authentication components
│   ├── components/      # Auth UI components
│   │   ├── AuthView.tsx
│   │   ├── LoginButton.tsx
│   │   ├── LogoutButton.tsx
│   │   └── WalletDisplay.tsx
│   ├── containers/      # Auth container components
│   │   └── AuthContainer.tsx
│   └── errors/          # Error handling
│       └── AuthErrorBoundary.tsx
├── task/                # Task management components
│   ├── ActiveTaskView.tsx
│   ├── AvailableTasksView.tsx
│   ├── TaskPanelContainer.tsx
│   └── TaskSubmissionContainer.tsx
└── cashout/            # Cashout/rewards components
    ├── CashoutProgressCard.tsx
    └── CashoutProgressContainer.tsx
```

### `/entrypoints`

WXT entry points for the extension:

```
entrypoints/
├── background.ts        # Service worker/background script
├── content.ts          # Content script for page injection
├── sidepanel/          # Side panel UI
│   ├── main.tsx        # React app entry
│   ├── index.html      # HTML template
│   └── App.tsx         # Main app component
└── popup/              # Extension popup (if used)
```

### `/lib`

Core business logic and utilities:

```
lib/
├── facades/            # Facade pattern implementations
│   ├── dashboard-facade.ts     # Dashboard operations
│   ├── message-routing-facade.ts # Message passing
│   ├── reddit-capture-facade.ts # Reddit integration
│   ├── side-panel-facade.ts    # Side panel control
│   └── task-facade.ts          # Task management
├── theme/              # Theming system
│   ├── neo-brutalism.ts # Theme configuration
│   └── components.ts    # Component theme mapping
├── context/           # React contexts
│   └── TaskProvider.tsx # Task state context
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── redditMachine.ts  # XState machine for Reddit
```

### `/e2e`

End-to-end test files using Playwright:

```
e2e/
├── fixtures.ts         # Test fixtures and setup
├── auth-flow.spec.ts   # Authentication tests
├── task-management.spec.ts # Task workflow tests
├── authUtils.ts        # Auth test utilities
├── taskUtils.ts        # Task test utilities
├── testData.ts         # Test data constants
└── pages/              # Page object models
    └── sidepanel.ts    # Side panel interactions
```

### `/public`

Static files served directly:

```
public/
├── icon/               # Extension icons
│   ├── 16.png
│   ├── 32.png
│   ├── 48.png
│   ├── 96.png
│   └── 128.png
└── manifest.json       # Extension manifest (generated)
```

## Configuration Files

### `wxt.config.ts`

WXT configuration for extension building:

```typescript
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage', 'tabs', 'sidePanel'],
    // ... other manifest settings
  }
})
```

### `tsconfig.json`

TypeScript configuration with WXT paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./*"]
    }
  }
}
```

## Build Outputs

### `/.output`

Generated build artifacts:

```
.output/
├── chrome-mv3/         # Chrome extension build
├── firefox-mv2/        # Firefox extension build
└── safari/             # Safari extension build
```

## Environment Files

```
.env                    # Local environment variables
.env.publish            # Production environment variables
```

## Key Conventions

1. **File Naming**: 
   - Components: PascalCase (e.g., `TaskView.tsx`)
   - Utilities: camelCase (e.g., `messageUtils.ts`)
   - Config: kebab-case (e.g., `wxt-config.ts`)

2. **Import Aliases**:
   - `@/` - Root directory alias
   - `~/` - Alternative root alias

3. **Component Organization**:
   - Container components handle logic
   - View components handle presentation
   - UI components are pure/reusable

4. **State Management**:
   - XState for complex flows
   - React Context for shared state
   - Local state for component-specific data

5. **Testing Strategy**:
   - E2E tests for critical user flows
   - Unit tests for utilities (planned)
   - Component tests (planned)

## Development Workflow

1. **New Features**: Create components in appropriate domain folder
2. **Styling**: Use Tailwind classes with theme tokens
3. **State**: Use XState machines for complex flows
4. **Testing**: Add E2E tests for new user flows
5. **Documentation**: Update relevant docs

## Best Practices

- Keep entrypoints minimal, delegate to components
- Use facades for cross-component communication
- Maintain strict TypeScript typing
- Follow Neo-Brutalism design patterns
- Write E2E tests for critical paths